'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdmin } from './AdminProvider';
import { Button, Card, Field, inputClass } from './ui';
function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const stars = Array.from({ length: 400 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      z: Math.random() * 1.5 + 0.5,
      r: Math.random() * 1.5 + 0.5,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.03 + 0.005,
    }));

    const meteors: { x: number; y: number; length: number; speed: number; angle: number; opacity: number }[] = [];
    const addMeteor = () => {
      if (Math.random() > 0.95) {
        meteors.push({
          x: Math.random() * w,
          y: -50,
          length: Math.random() * 80 + 20,
          speed: Math.random() * 10 + 10,
          angle: (Math.PI / 4) + (Math.random() * 0.2 - 0.1),
          opacity: 1
        });
      }
    };

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    let t = 0;
    let animFrame: number;
    let mx = 0;
    let my = 0;

    const draw = () => {
      t++;
      ctx.clearRect(0, 0, w, h);
      
      const targetMx = (mouseRef.current.x - w / 2) * 0.1;
      const targetMy = (mouseRef.current.y - h / 2) * 0.1;
      mx += (targetMx - mx) * 0.05;
      my += (targetMy - my) * 0.05;

      for (const s of stars) {
        let px = s.x - (mx / s.z);
        let py = s.y - (my / s.z);
        
        px = ((px % w) + w) % w;
        py = ((py % h) + h) % h;

        const twinkle = 0.3 + 0.7 * Math.sin(t * s.speed + s.phase);
        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(248, 250, 252, ${0.2 + twinkle * 0.8})`;
        ctx.fill();
        
        if (s.r > 1.8) {
          ctx.beginPath();
          ctx.arc(px, py, s.r * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(99, 102, 241, ${0.15 * twinkle})`;
          ctx.fill();
        }
      }

      if (t % 20 === 0) addMeteor();
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += Math.cos(m.angle) * m.speed;
        m.y += Math.sin(m.angle) * m.speed;
        m.opacity -= 0.02;

        if (m.opacity <= 0) {
          meteors.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        const grad = ctx.createLinearGradient(m.x, m.y, m.x - Math.cos(m.angle)*m.length, m.y - Math.sin(m.angle)*m.length);
        grad.addColorStop(0, `rgba(255, 255, 255, ${m.opacity})`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - Math.cos(m.angle)*m.length, m.y - Math.sin(m.angle)*m.length);
        ctx.stroke();
      }

      animFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {/* Deep Space Nebulas */}
      <div 
        className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full mix-blend-screen" 
        style={{ background: 'radial-gradient(circle, rgba(49,46,129,0.2) 0%, transparent 70%)', animation: 'nebulaFloat 15s ease-in-out infinite alternate' }} 
      />
      <div 
        className="absolute top-[50%] -right-[15%] w-[70%] h-[70%] rounded-full mix-blend-screen" 
        style={{ background: 'radial-gradient(circle, rgba(76,29,149,0.15) 0%, transparent 70%)', animation: 'nebulaFloat 20s ease-in-out infinite alternate-reverse' }} 
      />
    </div>
  );
}

function LoginScreen() {
  const { signIn, authError } = useAdmin();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    await signIn(password);
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#030508] text-[#e8ecf2] flex items-center justify-center px-6 sm:px-12 md:px-20 lg:px-32 py-12 font-sans selection:bg-indigo-500 selection:text-white overflow-hidden">
      
      {/* 3D Space Background */}
      <SpaceBackground />

      {/* Dynamic Ambient Glow overlay */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-0"
        style={{
          background: `radial-gradient(circle 800px at ${mousePos.x}px ${mousePos.y}px, rgba(79, 70, 229, 0.15), transparent 80%)`
        }}
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
        {/* Left Column: 6x Larger Logo Only */}
        <div className="lg:col-span-7 overflow-hidden py-10 group cursor-default">
          <img
            src="/logos/logo.png"
            alt="Thessaris"
            className="h-28 sm:h-36 md:h-44 lg:h-52 w-auto object-contain object-left origin-left transition-all duration-700 ease-out group-hover:scale-110 group-hover:drop-shadow-[0_0_50px_rgba(255,255,255,0.25)]"
            style={{ 
              transform: 'scale(1.25)', 
              animation: 'float 6s ease-in-out infinite' 
            }}
          />
        </div>

        {/* Right Column: Sci-Fi HUD Login Panel (Circular) */}
        <div className="lg:col-span-5 flex justify-center items-center">
          <div className="relative group/card w-full max-w-[420px] aspect-square flex items-center justify-center">
            
            {/* Decorative Circular Rings */}
            <div className="absolute inset-0 border-[3px] border-indigo-500/20 rounded-full opacity-60 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none z-0 shadow-[0_0_30px_rgba(99,102,241,0.15)] group-hover/card:shadow-[0_0_50px_rgba(99,102,241,0.3)] group-hover/card:border-indigo-500/40" style={{ animation: 'spin-slow 20s linear infinite' }}>
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-2 bg-indigo-400 rounded-full shadow-[0_0_15px_rgba(99,102,241,1)]"></div>
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-2 bg-indigo-400 rounded-full shadow-[0_0_15px_rgba(99,102,241,1)]"></div>
              <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2 h-4 bg-indigo-400 rounded-full shadow-[0_0_15px_rgba(99,102,241,1)]"></div>
              <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-4 bg-indigo-400 rounded-full shadow-[0_0_15px_rgba(99,102,241,1)]"></div>
            </div>

            {/* Inner rotating ring */}
            <div className="absolute inset-4 border border-[#1e2540] border-dashed rounded-full pointer-events-none opacity-50 group-hover/card:opacity-100 transition-opacity duration-700 z-0" style={{ animation: 'spin-slow-reverse 35s linear infinite' }}></div>

            <div className="relative w-[92%] h-[92%] bg-[#050814]/80 backdrop-blur-xl border border-indigo-500/10 rounded-full overflow-hidden flex flex-col justify-center items-center px-10 sm:px-14 z-10 space-y-6">
              
              {/* Animated Scanning Line */}
              <div className="absolute top-0 left-0 w-full h-[120%] bg-gradient-to-b from-transparent via-indigo-500/15 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ animation: 'scan 4s linear infinite' }} />

              {/* Header */}
              <div className="flex flex-col items-center justify-center pb-2 relative w-full text-center">
                <div className="absolute bottom-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)]"></span>
                  </span>
                  Sign In
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 relative z-10 w-full">
                {authError && (
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/50 rounded-lg text-rose-400 text-xs font-medium text-center shadow-[0_0_15px_rgba(225,29,72,0.2)] animate-in fade-in zoom-in">
                    {authError}
                  </div>
                )}

                <div className="space-y-2 group/input w-full">
                  <label className="flex items-center justify-center text-[11px] font-semibold uppercase tracking-wider text-indigo-200/50 group-focus-within/input:text-indigo-400 transition-colors duration-300">
                    <span>Password</span>
                  </label>
                  <div className="relative w-full max-w-[280px] mx-auto">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-black/40 border border-[#1e2540] group-focus-within/input:border-indigo-500/50 rounded-full px-5 py-3.5 pr-12 text-sm text-center text-indigo-100 placeholder-indigo-200/20 focus:outline-none transition-all duration-300"
                    />
                    {/* Glowing Focus Frame */}
                    <div className="absolute inset-0 rounded-full pointer-events-none border border-indigo-400 opacity-0 group-focus-within/input:opacity-100 group-focus-within/input:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all duration-500 scale-105 group-focus-within/input:scale-100" />
                    
                    {/* Eye Toggle */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-indigo-400/50 hover:text-indigo-400 focus:outline-none transition-colors z-10 cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="w-full max-w-[280px] mx-auto pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full py-3.5 bg-indigo-600/20 border border-indigo-500 hover:bg-indigo-500 hover:text-white text-indigo-400 font-bold text-[13px] uppercase tracking-wider rounded-full transition-all duration-300 cursor-pointer overflow-hidden group/btn hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {/* Button Scan Line Effect */}
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent -translate-x-[150%] group-hover/btn:translate-x-[150%] transition-transform duration-700 ease-in-out pointer-events-none" />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-indigo-400 group-hover/btn:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign In
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </form>

              <div className="pt-2 text-center relative z-10">
                <Link href="/" className="inline-flex items-center gap-1.5 text-[11px] text-indigo-300/50 hover:text-indigo-300 transition-colors font-medium group/link cursor-pointer">
                  <span className="group-hover/link:-translate-x-1.5 transition-transform duration-300">←</span>
                  Return to Public Site
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1.25); }
          50% { transform: translateY(-16px) scale(1.25); }
        }
        @keyframes nebulaFloat {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(30px, -30px) scale(1.1); }
        }
        @keyframes spin-slow {
          100% { transform: rotate(360deg); }
        }
        @keyframes spin-slow-reverse {
          100% { transform: rotate(-360deg); }
        }
        @keyframes scan {
          0% { transform: translateY(-150px); }
          100% { transform: translateY(450px); }
        }
      `}</style>
    </div>
  );
}

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const { ready, token, signOut } = useAdmin();
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [adminName, setAdminName] = useState('Admin User');
  const [adminAvatar, setAdminAvatar] = useState<string | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Sync profile & theme on mount and storage changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedTheme = localStorage.getItem('thessaris_admin_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    } else {
      setTheme('light');
    }

    const savedName = localStorage.getItem('thessaris_admin_name');
    if (savedName) setAdminName(savedName);

    const savedAvatar = localStorage.getItem('thessaris_admin_avatar');
    if (savedAvatar) setAdminAvatar(savedAvatar);

    const handleProfileUpdate = () => {
      const name = localStorage.getItem('thessaris_admin_name');
      if (name) setAdminName(name);
      const avatar = localStorage.getItem('thessaris_admin_avatar');
      setAdminAvatar(avatar || null);
    };

    window.addEventListener('admin-profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('admin-profile-updated', handleProfileUpdate);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('thessaris_admin_theme', nextTheme);
  };

  if (!ready) {
    return <div className="min-h-screen admin-root flex items-center justify-center text-[13px] text-zinc-500" style={{ background: 'var(--a-bg)' }}>Loading...</div>;
  }

  if (!token) {
    return <div className="admin-root"><LoginScreen /></div>;
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg> },
    { href: '/admin/messages', label: 'Messages', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg> },
    { href: '/admin/settings', label: 'Settings', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg> },
  ];

  const currentPageTitle =
    pathname === '/admin/messages'
      ? 'Messages'
      : pathname === '/admin/settings'
      ? 'Settings'
      : 'Dashboard';

  const userInitials = adminName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="admin-root h-screen w-screen flex overflow-hidden font-sans selection:bg-indigo-500 selection:text-white"
      data-admin-theme={theme}
      style={{ background: 'var(--a-bg)' }}
    >
      {/* Full-Height Sidebar */}
      <aside
        className={`h-full border-r flex flex-col flex-shrink-0 transition-all duration-300 z-30 ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
        style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}
      >
        {/* Sidebar Header (Logo Block) */}
        <div className="h-20 border-b flex items-center px-4 shrink-0 overflow-hidden" style={{ borderColor: 'var(--a-border)' }}>
          {!collapsed ? (
            <Link href="/admin" className="w-full flex items-center overflow-hidden py-1">
              <img
                src={theme === 'light' ? '/logos/black-logo.png' : '/logos/logo.png'}
                alt="Thessaris Admin"
                className="w-full h-16 object-contain object-left scale-150 origin-left"
              />
            </Link>
          ) : (
            <div className="w-full flex justify-center overflow-hidden">
              <img
                src={theme === 'light' ? '/logos/black-logo.png' : '/logos/logo.png'}
                alt="Thessaris"
                className="h-9 w-auto object-contain scale-125"
                title="Thessaris Admin"
              />
            </div>
          )}
        </div>

        {/* Sidebar Nav Items */}
        <div className="p-3 space-y-1.5 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-[var(--a-accent-soft)] text-[var(--a-accent)]'
                    : 'text-[var(--a-text-muted)] hover:bg-[var(--a-surface-2)] hover:text-[var(--a-text)]'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer (Logout Button at bottom) */}
        <div className="p-3 border-t mt-auto shrink-0" style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface-2)' }}>
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            title={collapsed ? 'Sign Out' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[var(--a-danger)] hover:bg-[var(--a-danger-soft)] transition-colors cursor-pointer ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4-4H7m6 4v1" />
            </svg>
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Top Header Bar */}
        <header
          className="h-16 border-b flex items-center justify-between px-6 z-20 shrink-0"
          style={{ background: 'var(--a-surface)', borderColor: 'var(--a-border)' }}
        >
          {/* Left Side: Sidebar Toggle & Page Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg text-[var(--a-text-muted)] hover:text-[var(--a-text)] hover:bg-[var(--a-surface-2)] transition-colors cursor-pointer"
              title={collapsed ? 'Expand sidebar' : 'Minimize sidebar'}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-[15px] font-semibold tracking-tight" style={{ color: 'var(--a-text)' }}>
              {currentPageTitle}
            </span>
          </div>

          {/* Right Side: Profile Nav ONLY */}
          <div className="flex items-center gap-3">
            {/* Profile Navigation */}
            <Link
              href="/admin/settings"
              className="flex items-center gap-3 pl-3 border-l hover:bg-[var(--a-surface-2)] p-1.5 pr-3 rounded-xl transition-colors cursor-pointer"
              style={{ borderColor: 'var(--a-border)' }}
            >
              {adminAvatar ? (
                <img
                  src={adminAvatar}
                  alt={adminName}
                  className="w-8 h-8 rounded-full object-cover border"
                  style={{ borderColor: 'var(--a-border-strong)' }}
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0"
                  style={{ background: 'var(--a-accent)', color: 'var(--a-accent-text)' }}
                >
                  {userInitials}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <div className="text-sm font-semibold tracking-tight leading-none mb-0.5" style={{ color: 'var(--a-text)' }}>
                  {adminName}
                </div>
                <div className="text-[11px] font-medium leading-none" style={{ color: 'var(--a-text-muted)' }}>
                  Administrator
                </div>
              </div>
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--a-bg)' }}>
          {children}
        </main>
      </div>

      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#0f172a] border border-[#1E293B] rounded-2xl p-6 shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-white mb-2">Sign Out</h3>
            <p className="text-sm text-slate-400 mb-6">Are you sure you want to sign out of the admin panel?</p>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => { setIsLogoutModalOpen(false); signOut(); }}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer shadow-lg shadow-rose-600/20"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
