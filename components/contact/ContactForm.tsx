'use client';

import { useState } from 'react';
import { CONTACT_LIMITS } from '@/lib/contactLimits';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    // Honeypot — hidden from people, so only bots fill it. The API drops those submissions.
    website: '',
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '', website: '' });
    } catch (err: unknown) {
      console.error(err);
      setStatus('error');
      setErrorMessage(
        err instanceof Error && err.message
          ? err.message
          : 'An unexpected error occurred. Please try again.'
      );
    }
  };

  return (
    <div className="bg-card border border-line p-4 sm:p-6 md:p-8 rounded-xl relative overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between pb-4 sm:pb-6 mb-4 sm:mb-6 border-b border-line/60">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
          <span className="font-sans text-[11px] uppercase tracking-widest text-muted">
            Direct Transmission Line
          </span>
        </div>
        <span className="font-sans text-[11px] text-quiet hidden sm:inline">CHANNEL // 04</span>
      </div>

      {status === 'success' ? (
        <div className="py-12 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent border border-accent/30 text-xl font-sans">
            ✓
          </div>
          <h3 className="font-serif text-2xl text-fg">Transmission Received</h3>
          <p className="font-sans text-xs text-muted max-w-md mx-auto leading-relaxed">
            Your message has been logged to the central database and dispatched to command.
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="mt-6 px-5 py-2.5 font-sans text-xs uppercase tracking-widest bg-line hover:bg-line-strong text-fg rounded transition-colors"
          >
            Send Another Message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Off-screen rather than display:none, which some bots detect and skip. */}
          <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
            <label>
              Website
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </label>
          </div>

          {status === 'error' && (
            <div className="p-4 bg-danger/10 border border-danger/30 rounded text-danger text-xs font-sans">
              ⚠ {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="block font-sans text-[11px] uppercase tracking-widest text-muted mb-2">
                Your Name <span className="text-accent">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={CONTACT_LIMITS.name}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Commander Vance"
                className="w-full bg-ink border border-line focus:border-accent rounded px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-fg placeholder:text-quiet focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block font-sans text-[11px] uppercase tracking-widest text-muted mb-2">
                Email Address <span className="text-accent">*</span>
              </label>
              <input
                type="email"
                required
                maxLength={CONTACT_LIMITS.email}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="vance@station.space"
                className="w-full bg-ink border border-line focus:border-accent rounded px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-fg placeholder:text-quiet focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block font-sans text-[11px] uppercase tracking-widest text-muted mb-2">
              Subject
            </label>
            <input
              type="text"
              maxLength={CONTACT_LIMITS.subject}
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Orbital Calculation Inquiry"
              className="w-full bg-ink border border-line focus:border-accent rounded px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-fg placeholder:text-quiet focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block font-sans text-[11px] uppercase tracking-widest text-muted mb-2">
              Message Payload <span className="text-accent">*</span>
            </label>
            <textarea
              required
              rows={4}
              maxLength={CONTACT_LIMITS.message}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Enter details of your inquiry, render feedback, or astronomical query..."
              className="w-full bg-ink border border-line focus:border-accent rounded px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-fg placeholder:text-quiet focus:outline-none transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full py-3 sm:py-3.5 bg-accent hover:bg-accent-hover disabled:bg-quiet text-ink font-sans text-[11px] sm:text-xs uppercase tracking-widest font-semibold rounded transition-all duration-200 shadow-lg shadow-accent/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {status === 'submitting' ? (
              <>
                <span className="w-3 h-3 border-2 border-ink/30 border-t-ink rounded-full animate-spin"></span>
                Transmitting Payload...
              </>
            ) : (
              <>Transmit Signal ↗</>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
