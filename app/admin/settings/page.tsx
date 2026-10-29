'use client';

import React, { useEffect, useState, useRef } from 'react';
export default function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);
  
  // Profile state
  const [adminName, setAdminName] = useState('Admin User');
  const [adminEmail, setAdminEmail] = useState('admin@thessaris.com');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Profile lives in localStorage, which can only be read after hydration.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only source
    setMounted(true);

    const savedName = localStorage.getItem('thessaris_admin_name');
    if (savedName) setAdminName(savedName);

    const savedEmail = localStorage.getItem('thessaris_admin_email');
    if (savedEmail) setAdminEmail(savedEmail);

    const savedAvatar = localStorage.getItem('thessaris_admin_avatar');
    if (savedAvatar) setAvatar(savedAvatar);
  }, []);

  const dispatchProfileUpdate = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('admin-profile-updated'));
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setProfileMsg({ ok: false, text: 'Image size must be under 2MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAvatar(base64);
      localStorage.setItem('thessaris_admin_avatar', base64);
      dispatchProfileUpdate();
      setProfileMsg({ ok: true, text: 'Profile picture updated successfully.' });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
    localStorage.removeItem('thessaris_admin_avatar');
    dispatchProfileUpdate();
    setProfileMsg({ ok: true, text: 'Profile picture removed.' });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('thessaris_admin_name', adminName.trim());
    localStorage.setItem('thessaris_admin_email', adminEmail.trim());
    dispatchProfileUpdate();
    setProfileMsg({ ok: true, text: 'Profile details saved.' });
  };

  if (!mounted) return null;

  const initials = adminName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4 border-b border-[#1E293B] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Admin Settings</h1>
          <p className="text-sm text-slate-400">Manage your profile information, credentials, and system configuration.</p>
        </div>
        <img
          src="/logos/logo.png"
          alt="Thessaris"
          className="h-8 w-auto object-contain shrink-0 hidden sm:block opacity-90"
        />
      </div>

      {/* Admin Profile Section */}
      <div className="p-6 md:p-8 rounded-2xl bg-[#0f172a]/80 backdrop-blur-md border border-[#1E293B] shadow-lg space-y-8">
        <h3 className="text-lg font-semibold text-white">Profile Information</h3>

        {profileMsg && (
          <div className={`p-4 rounded-xl text-sm font-medium border ${profileMsg.ok ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
            {profileMsg.text}
          </div>
        )}

        <div className="flex items-center gap-6 pb-8 border-b border-[#1E293B]">
          {avatar ? (
            <img src={avatar} alt="Admin Profile" className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]" />
          ) : (
            <div className="w-20 h-20 rounded-full font-bold text-xl flex items-center justify-center border-2 border-indigo-500/30 bg-indigo-500/10 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
              {initials}
            </div>
          )}

          <div className="space-y-3">
            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-xl text-sm font-medium bg-[#1E293B] text-white hover:bg-[#2A3441] transition-colors shadow-sm cursor-pointer">
                Upload Photo
              </button>
              {avatar && (
                <button type="button" onClick={handleRemoveAvatar} className="px-4 py-2 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer">
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500">PNG, JPG or WEBP under 2MB.</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Full Name</label>
              <input type="text" required value={adminName} onChange={(e) => setAdminName(e.target.value)} className="w-full px-4 py-2.5 bg-[#020617]/50 border border-[#1E293B] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Admin Email</label>
              <input type="email" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="w-full px-4 py-2.5 bg-[#020617]/50 border border-[#1E293B] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all" />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 cursor-pointer">
              Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* Security Section. The password is a server environment variable, so it can't be
          changed from the browser — the old form here only ever failed. */}
      <div className="p-6 md:p-8 rounded-2xl bg-[#0f172a]/80 backdrop-blur-md border border-[#1E293B] shadow-lg space-y-4">
        <h3 className="text-lg font-semibold text-white">Security & Authentication</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          The admin password is the <code className="px-1.5 py-0.5 rounded-md font-mono text-[11px] bg-[#020617] border border-[#1E293B] text-slate-300">ADMIN_PASSWORD</code> environment
          variable (12+ characters). To change it, update the variable in Vercel and redeploy — every
          signed-in session is revoked automatically. Sessions otherwise expire after 12 hours.
        </p>
      </div>

      {/* Email Delivery Info */}
      <div className="p-6 md:p-8 rounded-2xl bg-[#0f172a]/80 backdrop-blur-md border border-[#1E293B] shadow-lg space-y-4">
        <h3 className="text-lg font-semibold text-white">Outbound Email Service</h3>
        <div className="p-5 rounded-xl flex items-start gap-4 bg-amber-500/10 border border-amber-500/20">
          <div className="mt-0.5">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <span className="font-semibold block mb-1.5 text-amber-500">
              Resend API Dispatch Status
            </span>
            <span className="text-sm text-amber-400/80 leading-relaxed block">
              Outbound email dispatch is currently paused until <code className="px-1.5 py-0.5 rounded-md font-mono text-[11px] bg-[#020617] border border-[#1E293B] text-slate-300">RESEND_API_KEY</code> is configured in Vercel environment variables. Replies are safely recorded to the Neon PostgreSQL database.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
