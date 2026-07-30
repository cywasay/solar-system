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

const TOKEN_KEY = 'thessaris_admin_token';

interface AdminContextValue {
  token: string | null;
  ready: boolean;
  signIn: (password: string) => Promise<boolean>;
  signOut: () => void;
  authError: string;

  messages: ContactMessage[];
  loading: boolean;
  loadError: string | null;
  refresh: () => Promise<void>;

  setStatus: (id: string, status: MessageStatus) => Promise<void>;
  sendReply: (id: string, replyText: string) => Promise<{ ok: boolean; note: string }>;
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
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState('');

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Guards against overlapping fetches (fast navigation, double refresh clicks).
  const inFlight = useRef(false);

  const load = useCallback(async (authToken: string) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/admin/messages', {
        headers: { Authorization: `Bearer ${authToken}` },
        cache: 'no-store',
      });

      if (res.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setAuthError('Session expired. Sign in again.');
        return;
      }
      if (!res.ok) throw new Error(`Request failed (${res.status})`);

      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load messages');
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  // Restore the session after hydration. localStorage cannot be read during render.
  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only source
    setReady(true);
    if (!saved) return;
    setToken(saved);
    void load(saved);
  }, [load]);

  const signIn = useCallback(
    async (password: string) => {
      const candidate = password.trim();
      if (!candidate) return false;
      setAuthError('');

      // Validate before persisting, so a wrong key never gets stored.
      const res = await fetch('/api/admin/messages', {
        headers: { Authorization: `Bearer ${candidate}` },
        cache: 'no-store',
      });

      if (res.status === 401) {
        setAuthError('That key was not accepted.');
        return false;
      }
      if (!res.ok) {
        setAuthError(`Sign-in failed (${res.status}).`);
        return false;
      }

      const data = await res.json();
      localStorage.setItem(TOKEN_KEY, candidate);
      setToken(candidate);
      setMessages(data.messages ?? []);
      return true;
    },
    []
  );

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setMessages([]);
    setAuthError('');
  }, []);

  const refresh = useCallback(async () => {
    if (token) await load(token);
  }, [token, load]);

  const setStatus = useCallback(
    async (id: string, status: MessageStatus) => {
      if (!token) return;
      const previous = messages;
      // Optimistic: the table updates on click, not on round-trip.
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
      try {
        const res = await fetch('/api/admin/messages', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id, status }),
        });
        if (!res.ok) setMessages(previous);
      } catch {
        setMessages(previous);
      }
    },
    [token, messages]
  );

  const sendReply = useCallback(
    async (id: string, replyText: string): Promise<{ ok: boolean; note: string }> => {
      if (!token) return { ok: false, note: 'Not signed in.' };
      try {
        const res = await fetch('/api/admin/reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id, replyText }),
        });
        const data = await res.json();
        if (!res.ok) return { ok: false, note: data.error ?? 'Reply failed.' };

        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status: 'REPLIED', replyText } : m))
        );
        return {
          ok: true,
          note: data.emailSent
            ? 'Reply sent by email.'
            : 'Reply saved. Email delivery is disabled until RESEND_API_KEY is set.',
        };
      } catch (err) {
        return { ok: false, note: err instanceof Error ? err.message : 'Reply failed.' };
      }
    },
    [token]
  );

  const value = useMemo<AdminContextValue>(
    () => ({
      token,
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
    [token, ready, signIn, signOut, authError, messages, loading, loadError, refresh, setStatus, sendReply]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
