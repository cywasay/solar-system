'use client';

import { useState } from 'react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
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
      setFormData({ name: '', email: '', subject: '', message: '' });
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
    <div className="bg-[#121215] border border-[#27272A] p-6 md:p-8 rounded-xl relative overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#27272A]/60">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FF4500] animate-pulse"></span>
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#A1A1AA]">
            Direct Transmission Line
          </span>
        </div>
        <span className="font-mono text-[10px] text-[#71717A]">CHANNEL // 04</span>
      </div>

      {status === 'success' ? (
        <div className="py-12 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FF4500]/10 text-[#FF4500] border border-[#FF4500]/30 text-xl font-mono">
            ✓
          </div>
          <h3 className="font-serif text-2xl text-[#FAFAFA]">Transmission Received</h3>
          <p className="font-mono text-xs text-[#A1A1AA] max-w-md mx-auto leading-relaxed">
            Your message has been logged to the central database and dispatched to command.
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="mt-6 px-5 py-2.5 font-mono text-xs uppercase tracking-widest bg-[#27272A] hover:bg-[#3F3F46] text-[#FAFAFA] rounded transition-colors"
          >
            Send Another Message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {status === 'error' && (
            <div className="p-4 bg-red-950/40 border border-red-800/50 rounded text-red-200 text-xs font-mono">
              ⚠ {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-[#A1A1AA] mb-2">
                Your Name <span className="text-[#FF4500]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Commander Vance"
                className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FF4500] rounded px-4 py-3 text-sm text-[#FAFAFA] placeholder-[#52525B] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-[#A1A1AA] mb-2">
                Email Address <span className="text-[#FF4500]">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="vance@station.space"
                className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FF4500] rounded px-4 py-3 text-sm text-[#FAFAFA] placeholder-[#52525B] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-[#A1A1AA] mb-2">
              Subject
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Orbital Calculation Inquiry"
              className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FF4500] rounded px-4 py-3 text-sm text-[#FAFAFA] placeholder-[#52525B] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-[#A1A1AA] mb-2">
              Message Payload <span className="text-[#FF4500]">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Enter details of your inquiry, render feedback, or astronomical query..."
              className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FF4500] rounded px-4 py-3 text-sm text-[#FAFAFA] placeholder-[#52525B] focus:outline-none transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full py-3.5 bg-[#FF4500] hover:bg-[#FF571A] disabled:bg-[#71717A] text-[#FAFAFA] font-mono text-xs uppercase tracking-widest font-semibold rounded transition-all duration-200 shadow-lg shadow-[#FF4500]/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {status === 'submitting' ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
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
