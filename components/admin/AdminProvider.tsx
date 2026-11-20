'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export type MessageStatus = 'UNREAD' | 'READ' | 'REPLIED';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: MessageStatus;
  replyText: string | null;
  createdAt: string;
}

/**
 * Where older builds kept the raw admin password. Auth is now an httpOnly session cookie
 * the browser sends by itself; this key is only read in order to delete it.
 */
const LEGACY_TOKEN_KEY = 'thessaris_admin_token';

interface AdminContextValue {
  authenticated: boolean;
  ready: boolean;
  signIn: (password: string) => Promise<boolean>;
  signOut: () => void;
  authError: string;

  messages: ContactMessage[];
  loading: boolean;
  loadError: string | null;
  refresh: () => Promise<void>;

  setStatus: (id: string, status: MessageStatus) => Promise<void>;
  sendReply: (id: string, replyText: string, options?: SendReplyOptions) => Promise<ReplyResult>;
}

export interface SendReplyOptions {
  /** Store the reply and mark the message REPLIED without emailing — "I sent it myself". */
  recordOnly?: boolean;
}

export interface ReplyResult {
  ok: boolean;
  /** Human-readable outcome, including the real reason when something failed. */
  note: string;
  /** True when nothing was recorded because the email could not be sent. The caller can
   *  offer the record-only fallback. */
  emailFailed?: boolean;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside <AdminProvider>');
  return ctx;
}

/**
 * Owns admin auth and the message cache.
 *
 * Lives in the admin LAYOUT, so it is mounted once and survives navigation between
 * Dashboard / Messages / Settings — moving between pages re-renders from memory instead
 * of refetching, which is the single biggest perceived-speed win in a dashboard.
 */
export default function AdminProvider({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState('');

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Guards against overlapping fetches (fast navigation, double refresh clicks).
  const inFlight = useRef(false);

  /** Any 401 from the admin API means the cookie is missing, expired, or revoked. */
  const sessionLost = useCallback(() => {
    setAuthenticated(false);
    setMessages([]);
    setAuthError('Session expired. Sign in again.');
  }, []);

  /**
   * Fetches the inbox. Doubles as the session check: the cookie is httpOnly, so the only
   * way the client can learn whether it is signed in is to ask the server.
   * Resolves to whether the session was valid.
   */
  const load = useCallback(async (): Promise<boolean> => {
    if (inFlight.current) return true;
    inFlight.current = true;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/admin/messages', { cache: 'no-store' });
      if (res.status === 401) return false;
      if (!res.ok) {
        throw new Error(`The server returned an error (${res.status}) — the database may be unreachable`);
      }

      const data = await res.json();
      setMessages(data.messages ?? []);
      return true;
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load messages');
      return true;
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  // Restore an existing session on mount.
  useEffect(() => {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- server is the only source
    void load().then((valid) => {
      setAuthenticated(valid);
      setReady(true);
    });
  }, [load]);

  const signIn = useCallback(
    async (password: string) => {
      const candidate = password.trim();
      if (!candidate) return false;
      setAuthError('');

      try {
        const res = await fetch('/api/admin/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: candidate }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setAuthError(data.error ?? `Sign-in failed (${res.status}).`);
          return false;
        }
      } catch {
        setAuthError('Could not reach the server.');
        return false;
      }

      setAuthenticated(true);
      await load();
      return true;
    },
    [load]
  );

  const signOut = useCallback(() => {
    // Clear local state immediately; the cookie is cleared server-side.
    void fetch('/api/admin/session', { method: 'DELETE' }).catch(() => {});
    setAuthenticated(false);
    setMessages([]);
    setAuthError('');
  }, []);

  const refresh = useCallback(async () => {
    if (authenticated && !(await load())) sessionLost();
  }, [authenticated, load, sessionLost]);

  const setStatus = useCallback(
    async (id: string, status: MessageStatus) => {
      if (!authenticated) return;
      const previous = messages;
      // Optimistic: the table updates on click, not on round-trip.
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
      try {
        const res = await fetch('/api/admin/messages', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status }),
        });
        if (res.status === 401) sessionLost();
        else if (!res.ok) setMessages(previous);
      } catch {
        setMessages(previous);
      }
    },
    [authenticated, messages, sessionLost]
  );

  const sendReply = useCallback(
    async (id: string, replyText: string, options?: SendReplyOptions): Promise<ReplyResult> => {
      if (!authenticated) return { ok: false, note: 'Not signed in.' };
      const recordOnly = options?.recordOnly === true;
      try {
        const res = await fetch('/api/admin/reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, replyText, recordOnly }),
        });
        if (res.status === 401) {
          sessionLost();
          return { ok: false, note: 'Session expired. Sign in again.' };
        }
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          // 502 = the email could not be sent and nothing was recorded. Surface the real
          // reason (not configured / rejected by Resend / ...) rather than a guess.
          if (res.status === 502) {
            return {
              ok: false,
              emailFailed: true,
              note: `Email not sent: ${data.reason ?? 'unknown error'}. The message has NOT been marked as replied.`,
            };
          }
          return { ok: false, note: data.error ?? `Reply failed (${res.status}).` };
        }

        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status: 'REPLIED', replyText } : m))
        );
        return {
          ok: true,
          note: recordOnly
            ? 'Recorded as replied. No email was sent — you are responsible for sending it.'
            : 'Reply sent by email.',
        };
      } catch (err) {
        return { ok: false, note: err instanceof Error ? err.message : 'Reply failed.' };
      }
    },
    [authenticated, sessionLost]
  );

  const value = useMemo<AdminContextValue>(
    () => ({
      authenticated,
      ready,
      signIn,
      signOut,
      authError,
      messages,
      loading,
      loadError,
      refresh,
      setStatus,
      sendReply,
    }),
    [authenticated, ready, signIn, signOut, authError, messages, loading, loadError, refresh, setStatus, sendReply]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
