'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: 'UNREAD' | 'READ' | 'REPLIED';
  replyText: string | null;
  createdAt: string;
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState('');
  
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'READ' | 'REPLIED'>('ALL');
  
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replyStatus, setReplyStatus] = useState<string | null>(null);

  const fetchMessages = useCallback(async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/messages', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          setAuthError('Invalid admin password.');
          setAuthToken(null);
          localStorage.removeItem('thessaris_admin_token');
        } else {
          throw new Error('Failed to fetch messages');
        }
        return;
      }

      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * Restore the saved session after hydration. localStorage cannot be read during
   * render — it does not exist on the server, and a lazy initialiser would produce a
   * hydration mismatch — so adopting it into state from an effect is the correct
   * pattern here, and the one extra mount render it costs is unavoidable.
   */
  useEffect(() => {
    const savedToken = localStorage.getItem('thessaris_admin_token');
    if (!savedToken) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see note above
    setAuthToken(savedToken);
    void fetchMessages(savedToken);
  }, [fetchMessages]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!password.trim()) return;

    localStorage.setItem('thessaris_admin_token', password.trim());
    setAuthToken(password.trim());
    fetchMessages(password.trim());
  };

  const handleLogout = () => {
    localStorage.removeItem('thessaris_admin_token');
    setAuthToken(null);
    setMessages([]);
    setPassword('');
  };


  const updateMessageStatus = async (id: string, newStatus: 'UNREAD' | 'READ' | 'REPLIED') => {
    if (!authToken) return;

    try {
      const res = await fetch('/api/admin/messages', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === id ? { ...msg, status: newStatus } : msg))
        );
        if (selectedMessage?.id === id) {
          setSelectedMessage((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage || !replyText.trim() || !authToken) return;

    setSendingReply(true);
    setReplyStatus(null);

    try {
      const res = await fetch('/api/admin/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          id: selectedMessage.id,
          replyText: replyText.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reply');
      }

      setReplyStatus('Reply sent successfully via Resend email!');
      setReplyText('');
      
      // Refresh message list
      fetchMessages(authToken);
      setSelectedMessage((prev) =>
        prev ? { ...prev, status: 'REPLIED', replyText: replyText.trim() } : null
      );
    } catch (err: unknown) {
      setReplyStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSendingReply(false);
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (filter === 'ALL') return true;
    return msg.status === filter;
  });

  const unreadCount = messages.filter((m) => m.status === 'UNREAD').length;

  if (!authToken) {
    return (
      <main className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#121215] border border-[#27272A] p-8 rounded-xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#FF4500]">
              Restricted Access
            </span>
            <h1 className="font-serif text-3xl">Admin Command Panel</h1>
            <p className="font-mono text-xs text-[#71717A]">
              Enter master access key to log into message console.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {authError && (
              <div className="p-3 bg-red-950/40 border border-red-800/50 rounded text-red-200 text-xs font-mono text-center">
                {authError}
              </div>
            )}

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-[#A1A1AA] mb-2">
                Admin Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FF4500] rounded px-4 py-3 text-sm text-[#FAFAFA] focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#FF4500] hover:bg-[#FF571A] text-white font-mono text-xs uppercase tracking-widest font-semibold rounded transition-colors cursor-pointer"
            >
              Authenticate 🔓
            </button>
          </form>

          <div className="text-center pt-2">
            <Link href="/contact" className="font-mono text-xs text-[#71717A] hover:text-[#FAFAFA] transition-colors">
              ← Return to Contact Page
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090B] text-[#FAFAFA]">
      {/* Top Navbar */}
      <nav className="flex justify-between items-center px-6 md:px-12 py-5 border-b border-[#27272A] bg-[#0C0C0E]">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF4500] animate-pulse"></span>
          <span className="font-serif text-lg tracking-tight">Thessaris Admin</span>
          <span className="font-mono text-[10px] bg-[#27272A] text-[#A1A1AA] px-2 py-0.5 rounded uppercase">
            Neon DB Live
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/contact" className="font-mono text-xs text-[#A1A1AA] hover:text-white transition-colors">
            View Contact Site ↗
          </Link>
          <button
            onClick={handleLogout}
            className="font-mono text-xs bg-[#27272A] hover:bg-red-900/60 text-[#A1A1AA] hover:text-red-200 px-3 py-1.5 rounded transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Messages List Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Header & Stats */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl">Transmissions</h2>
              <p className="font-mono text-xs text-[#71717A] mt-1">
                {messages.length} total message{messages.length !== 1 ? 's' : ''} stored in Neon DB
              </p>
            </div>
            {unreadCount > 0 && (
              <span className="bg-[#FF4500] text-white font-mono text-[11px] px-2.5 py-1 rounded-full font-bold">
                {unreadCount} Unread
              </span>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 font-mono text-xs border-b border-[#27272A] pb-3">
            {(['ALL', 'UNREAD', 'READ', 'REPLIED'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  filter === f
                    ? 'bg-[#FF4500] text-white font-bold'
                    : 'bg-[#18181B] text-[#A1A1AA] hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Messages Stack */}
          {loading ? (
            <div className="py-12 text-center font-mono text-xs text-[#71717A] animate-pulse">
              Querying Neon PostgreSQL Database...
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="py-12 text-center font-mono text-xs text-[#71717A] bg-[#121215] border border-[#27272A] rounded-lg">
              No transmissions found for filter &ldquo;{filter}&rdquo;.
            </div>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => {
                    setSelectedMessage(msg);
                    if (msg.status === 'UNREAD') {
                      updateMessageStatus(msg.id, 'READ');
                    }
                  }}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    selectedMessage?.id === msg.id
                      ? 'bg-[#18181C] border-[#FF4500]'
                      : 'bg-[#121215] border-[#27272A] hover:border-[#3F3F46]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-semibold text-[#FAFAFA] truncate max-w-[180px]">
                      {msg.name}
                    </span>
                    <span
                      className={`font-mono text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                        msg.status === 'UNREAD'
                          ? 'bg-[#FF4500]/20 text-[#FF4500] border border-[#FF4500]/40'
                          : msg.status === 'REPLIED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {msg.status}
                    </span>
                  </div>

                  <p className="font-serif text-sm text-[#E4E4E7] truncate mb-1">
                    {msg.subject || '(No Subject)'}
                  </p>

                  <div className="flex items-center justify-between font-mono text-[10px] text-[#71717A]">
                    <span className="truncate max-w-[200px]">{msg.email}</span>
                    <span>{new Date(msg.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Inspection & Reply Column */}
        <div className="lg:col-span-7">
          {selectedMessage ? (
            <div className="bg-[#121215] border border-[#27272A] rounded-xl p-6 space-y-6 shadow-xl">
              {/* Header Details */}
              <div className="border-b border-[#27272A] pb-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#FF4500]">
                    Transmission ID: {selectedMessage.id}
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedMessage.status !== 'UNREAD' && (
                      <button
                        onClick={() => updateMessageStatus(selectedMessage.id, 'UNREAD')}
                        className="font-mono text-[10px] bg-[#27272A] hover:bg-[#3F3F46] text-[#A1A1AA] px-2.5 py-1 rounded"
                      >
                        Mark Unread
                      </button>
                    )}
                    <span className="font-mono text-[10px] text-[#71717A]">
                      {new Date(selectedMessage.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <h2 className="font-serif text-2xl text-[#FAFAFA]">
                  {selectedMessage.subject || '(No Subject)'}
                </h2>

                <div className="font-mono text-xs text-[#A1A1AA] flex flex-wrap gap-x-6 gap-y-1">
                  <div>
                    <span className="text-[#71717A]">From:</span> {selectedMessage.name}
                  </div>
                  <div>
                    <span className="text-[#71717A]">Email:</span>{' '}
                    <a href={`mailto:${selectedMessage.email}`} className="text-[#FF4500] underline">
                      {selectedMessage.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#71717A] mb-3">
                  Message Payload
                </h3>
                <div className="p-4 bg-[#09090B] border border-[#27272A] rounded-lg text-sm leading-relaxed text-[#E4E4E7] whitespace-pre-wrap font-sans">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Previous Reply if exists */}
              {selectedMessage.replyText && (
                <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-mono text-[10px] uppercase tracking-widest">
                    <span>✓ Replied via Email</span>
                  </div>
                  <p className="text-xs text-emerald-200/90 whitespace-pre-wrap font-sans">
                    {selectedMessage.replyText}
                  </p>
                </div>
              )}

              {/* Reply Form */}
              <div className="border-t border-[#27272A] pt-5 space-y-4">
                <h3 className="font-mono text-xs uppercase tracking-widest text-[#FAFAFA]">
                  Send Email Reply (via Resend API)
                </h3>

                {replyStatus && (
                  <div
                    className={`p-3 rounded text-xs font-mono ${
                      replyStatus.startsWith('Error')
                        ? 'bg-red-950/50 border border-red-800 text-red-200'
                        : 'bg-emerald-950/50 border border-emerald-800 text-emerald-200'
                    }`}
                  >
                    {replyStatus}
                  </div>
                )}

                <form onSubmit={handleSendReply} className="space-y-4">
                  <textarea
                    rows={4}
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Write your response to ${selectedMessage.name}...`}
                    className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FF4500] rounded p-4 text-sm text-[#FAFAFA] placeholder-[#52525B] focus:outline-none transition-colors resize-none"
                  />

                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[10px] text-[#71717A]">
                      Sending directly to: {selectedMessage.email}
                    </p>

                    <button
                      type="submit"
                      disabled={sendingReply}
                      className="px-6 py-2.5 bg-[#FF4500] hover:bg-[#FF571A] disabled:bg-[#71717A] text-white font-mono text-xs uppercase tracking-widest font-semibold rounded transition-colors cursor-pointer"
                    >
                      {sendingReply ? 'Sending Email...' : 'Send Reply Email ✉'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="h-[60vh] bg-[#121215] border border-[#27272A] rounded-xl flex flex-col items-center justify-center p-8 text-center space-y-3">
              <span className="text-4xl text-[#3F3F46]">💬</span>
              <h3 className="font-serif text-xl text-[#FAFAFA]">No Message Selected</h3>
              <p className="font-mono text-xs text-[#71717A] max-w-sm">
                Select a transmission from the left panel to inspect its contents, manage read status, or transmit an email reply.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
