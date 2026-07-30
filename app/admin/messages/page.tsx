'use client';

import React, { useState } from 'react';
import { useAdmin, ContactMessage } from '@/components/admin/AdminProvider';
import { Card, StatusBadge, Button, Field, inputClass, EmptyState, formatDate, SkeletonInboxList } from '@/components/admin/ui';

export default function MessagesPage() {
  const { messages, loading, refresh, setStatus, sendReply } = useAdmin();
  
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'READ' | 'REPLIED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replyNote, setReplyNote] = useState<{ ok: boolean; text: string } | null>(null);

  const selectedMessage = messages.find((m) => m.id === selectedId) || null;

  const filteredMessages = messages.filter((msg) => {
    if (filter !== 'ALL' && msg.status !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        msg.name.toLowerCase().includes(q) ||
        msg.email.toLowerCase().includes(q) ||
        (msg.subject || '').toLowerCase().includes(q) ||
        msg.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSelect = (msg: ContactMessage) => {
    setSelectedId(msg.id);
    setReplyNote(null);
    if (msg.status === 'UNREAD') {
      setStatus(msg.id, 'READ');
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage || !replyText.trim()) return;

    setSendingReply(true);
    setReplyNote(null);
    const result = await sendReply(selectedMessage.id, replyText.trim());
    setReplyNote({ ok: result.ok, text: result.note });
    if (result.ok) {
      setReplyText('');
    }
    setSendingReply(false);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden bg-[#020617]">
      {/* Sidebar List */}
      <aside className="w-full md:w-[360px] lg:w-[400px] border-r border-[#1E293B] flex flex-col flex-shrink-0 bg-[#090b0f]/80 backdrop-blur-xl z-10">
        <div className="p-5 border-b border-[#1E293B] space-y-4 bg-[#020617]/50">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold tracking-tight text-white">Messages</h1>
            <button
              onClick={refresh}
              disabled={loading}
              title="Refresh"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E293B] transition-colors cursor-pointer disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search inquiries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0f172a] border border-[#1E293B] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0f172a] border border-[#1E293B] text-xs font-medium">
            {['ALL', 'UNREAD', 'READ', 'REPLIED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                  filter === f
                    ? 'bg-[#1E293B] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1E293B]/50'
                }`}
              >
                {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#1E293B]">
          {loading && messages.length === 0 ? (
            <SkeletonInboxList count={6} />
          ) : filteredMessages.length === 0 ? (
            <div className="p-8 text-center text-[13px]" style={{ color: 'var(--a-text-subtle)' }}>No messages found.</div>
          ) : (
            filteredMessages.map((msg) => {
              const isSelected = selectedId === msg.id;
              const initials = msg.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <div
                  key={msg.id}
                  onClick={() => handleSelect(msg)}
                  className={`px-4 py-4 cursor-pointer transition-all border-l-2 flex items-center gap-4 ${
                    isSelected
                      ? 'bg-[#1E293B]/60 border-indigo-500'
                      : 'border-transparent hover:bg-[#1E293B]/30 hover:border-slate-600'
                  }`}
                >
                  {/* Avatar Circle */}
                  <div
                    className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-bold text-xs shadow-inner ${
                      isSelected
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        : 'bg-[#0f172a] text-slate-400 border border-[#1E293B]'
                    }`}
                  >
                    {initials}
                  </div>

                  {/* Message Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {msg.name}
                      </span>
                      <span className="text-[10px] font-mono shrink-0 text-slate-500">
                        {new Date(msg.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs truncate text-slate-400">
                        {msg.subject ? `${msg.subject} — ${msg.message}` : msg.message}
                      </span>
                      <div className="shrink-0 scale-90 origin-right">
                        <StatusBadge status={msg.status} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Detail Pane */}
      <main className="flex-1 overflow-y-auto bg-[#020617] relative">
        {selectedMessage ? (
          <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8 flex flex-col min-h-full">
            {/* Subject & Status Bar */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#1E293B] pb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <StatusBadge status={selectedMessage.status} />
                  <span className="text-xs font-mono text-slate-500 bg-[#0f172a] px-2 py-1 rounded-md border border-[#1E293B]">
                    ID: {selectedMessage.id}
                  </span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white mt-2">
                  {selectedMessage.subject || '(No Subject)'}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                {selectedMessage.status !== 'UNREAD' && (
                  <button
                    onClick={() => setStatus(selectedMessage.id, 'UNREAD')}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0f172a] text-slate-300 border border-[#1E293B] hover:bg-[#1E293B] hover:text-white transition-colors cursor-pointer"
                  >
                    Mark Unread
                  </button>
                )}
                {selectedMessage.status === 'UNREAD' && (
                  <button
                    onClick={() => setStatus(selectedMessage.id, 'READ')}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0f172a] text-slate-300 border border-[#1E293B] hover:bg-[#1E293B] hover:text-white transition-colors cursor-pointer"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            </div>

            {/* Sender Info Bar */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full font-bold text-sm flex items-center justify-center shrink-0 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                {selectedMessage.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-base font-semibold text-white">
                    {selectedMessage.name}
                  </span>
                  <a
                    href={`mailto:${selectedMessage.email}`}
                    className="text-sm text-slate-400 hover:text-indigo-400 hover:underline transition-colors"
                  >
                    &lt;{selectedMessage.email}&gt;
                  </a>
                </div>
                <div className="text-xs mt-1 text-slate-500">
                  Received {formatDate(selectedMessage.createdAt)}
                </div>
              </div>
            </div>

            {/* Message Body Content */}
            <div className="py-8 px-6 rounded-2xl bg-[#0f172a]/50 border border-[#1E293B] text-[15px] leading-relaxed whitespace-pre-wrap font-sans min-h-[120px] text-slate-200 shadow-sm">
              {selectedMessage.message}
            </div>

            {/* Recorded Previous Reply */}
            {selectedMessage.replyText && (
              <div className="p-5 rounded-xl space-y-3 text-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Previous Reply Sent
                </div>
                <p className="whitespace-pre-wrap leading-relaxed opacity-90">{selectedMessage.replyText}</p>
              </div>
            )}

            {/* Reply Composer Card */}
            <div className="mt-auto bg-[#0f172a]/80 backdrop-blur-md border border-[#1E293B] rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">
                  Send Email Reply
                </h3>
                <span className="text-xs text-slate-400">
                  To: {selectedMessage.email}
                </span>
              </div>

              {replyNote && (
                <div
                  className={`p-3 rounded-lg text-xs font-medium mb-4 border ${
                    replyNote.ok 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}
                >
                  {replyNote.text}
                </div>
              )}

              <form onSubmit={handleSendReply} className="space-y-4">
                <textarea
                  rows={4}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Write your response to ${selectedMessage.name}...`}
                  className="w-full p-4 bg-[#020617]/50 border border-[#1E293B] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none"
                />

                <div className="flex items-center justify-end">
                  <button 
                    type="submit" 
                    disabled={sendingReply} 
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:-translate-y-0 cursor-pointer"
                  >
                    {sendingReply ? (
                      'Sending...'
                    ) : (
                      <span className="flex items-center gap-2">
                        Send Reply
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4 p-8">
              <div className="w-16 h-16 rounded-2xl bg-[#0f172a] border border-[#1E293B] flex items-center justify-center mx-auto shadow-lg shadow-black/20">
                <svg className="w-8 h-8 text-indigo-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-white mb-1">No message selected</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">Choose an inquiry from the sidebar to inspect content and send replies.</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
