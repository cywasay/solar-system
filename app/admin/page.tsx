'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAdmin } from '@/components/admin/AdminProvider';
import {
  Card,
  SectionTitle,
  StatusBadge,
  relativeDate,
  Button,
  SkeletonStatCard,
  SkeletonTableRows,
} from '@/components/admin/ui';

export default function AdminDashboard() {
  const { messages, loading, refresh, setStatus } = useAdmin();
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'REPLIED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{ day: string; count: number; x: number; y: number } | null>(null);

  const total = messages.length;
  const unread = messages.filter((m) => m.status === 'UNREAD').length;
  const replied = messages.filter((m) => m.status === 'REPLIED').length;
  const responseRate = total > 0 ? Math.round((replied / total) * 100) : 100;

  // Filtered recent messages
  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      const matchesStatus = filter === 'ALL' || m.status === filter;
      const matchesSearch =
        searchQuery === '' ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.subject && m.subject.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [messages, filter, searchQuery]);

  const recent = filteredMessages.slice(0, 6);

  // Generate 7-day activity curve data from real messages
  const activityData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    
    messages.forEach((m) => {
      const date = new Date(m.createdAt);
      const dayIdx = (date.getDay() + 6) % 7;
      counts[dayIdx] += 1;
    });

    const maxVal = Math.max(...counts, 4);
    
    return days.map((day, idx) => ({
      day,
      count: counts[idx],
      heightRatio: counts[idx] / maxVal,
    }));
  }, [messages]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* Professional Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-emerald-400 font-medium">
              System Active · Live Data
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
            Dashboard Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time analytics and recent contact portal inquiries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0f172a] border border-[#1E293B] hover:border-[#334155] text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 text-indigo-400 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* Professional KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            {/* Card 1: Total Inquiries */}
            <div className="group relative bg-[#0f172a]/80 backdrop-blur-md border border-[#1E293B] hover:bg-[#1E293B]/40 p-5 rounded-2xl transition-colors duration-200">
              <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-3">
                <span>Total Inquiries</span>
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-semibold text-white tracking-tight">
                {total}
              </div>
              <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="text-slate-300 font-medium">All portal submissions</span>
              </div>
            </div>

            {/* Card 2: Action Needed */}
            <div className="group relative bg-[#0f172a]/80 backdrop-blur-md border border-[#1E293B] hover:bg-[#1E293B]/40 p-5 rounded-2xl transition-colors duration-200">
              <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-3">
                <span>Action Required</span>
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-semibold text-amber-400 tracking-tight">
                {unread}
              </div>
              <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Unread messages</span>
              </div>
            </div>

            {/* Card 3: Replied */}
            <div className="group relative bg-[#0f172a]/80 backdrop-blur-md border border-[#1E293B] hover:bg-[#1E293B]/40 p-5 rounded-2xl transition-colors duration-200">
              <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-3">
                <span>Successfully Replied</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-semibold text-emerald-400 tracking-tight">
                {replied}
              </div>
              <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="text-emerald-400 font-medium">Completed responses</span>
              </div>
            </div>

            {/* Card 4: Response Rate */}
            <div className="group relative bg-[#0f172a]/80 backdrop-blur-md border border-[#1E293B] hover:bg-[#1E293B]/40 p-5 rounded-2xl transition-colors duration-200">
              <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-3">
                <span>Response Rate</span>
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-semibold text-cyan-400 tracking-tight">
                {responseRate}%
              </div>
              <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="text-cyan-400 font-medium">Overall resolution rate</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Professional Interactive SVG Trend Chart */}
      <div className="bg-[#0f172a]/80 backdrop-blur-md border border-[#1E293B] p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm uppercase tracking-wider text-slate-200 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Inquiry Volume Trend
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Weekly breakdown of incoming portal messages.
            </p>
          </div>
          <div className="text-xs text-slate-400 bg-[#020617] px-3 py-1.5 rounded-lg border border-[#1E293B] font-mono">
            7-Day View
          </div>
        </div>

        {/* Lightweight Pure SVG Graph */}
        <div className="relative h-44 w-full pt-4">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 700 140" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[20, 60, 100].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="700"
                y2={y}
                stroke="#1E293B"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            ))}

            {/* Calculate Points */}
            {(() => {
              const points = activityData.map((d, i) => {
                const x = (i / (activityData.length - 1)) * 680 + 10;
                const y = 120 - d.heightRatio * 90;
                return { x, y, day: d.day, count: d.count };
              });

              const pathD = points.reduce((acc, p, i, a) => {
                if (i === 0) return `M ${p.x} ${p.y}`;
                const prev = a[i - 1];
                const cx1 = prev.x + (p.x - prev.x) / 2;
                const cy1 = prev.y;
                const cx2 = prev.x + (p.x - prev.x) / 2;
                const cy2 = p.y;
                return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p.x} ${p.y}`;
              }, '');

              const areaD = `${pathD} L 690 130 L 10 130 Z`;

              return (
                <>
                  {/* Fill Area */}
                  <path d={areaD} fill="url(#chartGradient)" />

                  {/* Main Line */}
                  <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />

                  {/* Interactive Nodes */}
                  {points.map((p, i) => (
                    <g key={i} className="cursor-pointer group/node">
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="6"
                        className="fill-[#090b0f] stroke-indigo-400 stroke-2 group-hover/node:r-8 transition-all"
                        onMouseEnter={() => setHoveredPoint(p)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="3"
                        className="fill-indigo-400"
                      />
                    </g>
                  ))}
                </>
              );
            })()}
          </svg>

          {/* Hover Tooltip */}
          {hoveredPoint && (
            <div
              className="absolute z-20 bg-[#090b0f] border border-indigo-500/50 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-12 transition-all font-mono"
              style={{ left: `${(hoveredPoint.x / 700) * 100}%`, top: `${(hoveredPoint.y / 140) * 100}%` }}
            >
              <span className="text-indigo-400 font-semibold">{hoveredPoint.day}:</span> {hoveredPoint.count} inquiries
            </div>
          )}
        </div>

        {/* X-Axis Labels */}
        <div className="flex justify-between text-[11px] font-mono text-slate-500 px-2 pt-2 border-t border-[#1E293B]">
          {activityData.map((d) => (
            <span key={d.day}>{d.day}</span>
          ))}
        </div>
      </div>

      {/* Recent Inquiries Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight">
              Recent Inquiries
            </h2>
            <p className="text-xs text-slate-400">
              Latest contact form submissions needing attention.
            </p>
          </div>

          {/* Search & Status Filters */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email..."
                className="bg-[#0f172a] border border-[#1E293B] focus:border-indigo-500 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors w-44 sm:w-56"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Chips */}
            <div className="flex bg-[#0f172a] p-1 rounded-xl border border-[#1E293B] text-[11px]">
              {(['ALL', 'UNREAD', 'REPLIED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilter(st)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer capitalize ${
                    filter === st
                      ? 'bg-indigo-600 text-white font-medium shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st.toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Inquiries Table */}
        <div className="bg-[#0f172a]/80 backdrop-blur-md border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <SkeletonTableRows rows={5} />
          ) : recent.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No inquiries found matching your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-[#1E293B] text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-[#090b0f]/60">
                    <th className="px-6 py-3.5">Sender</th>
                    <th className="px-6 py-3.5">Subject</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Received</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]/60 text-xs">
                  {recent.map((msg) => {
                    const initials = msg.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);

                    return (
                      <tr
                        key={msg.id}
                        className="transition-colors hover:bg-slate-800/40 group/row"
                      >
                        <td className="px-6 py-4">
                          <Link href="/admin/messages" className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover/row:scale-105 transition-transform">
                              {initials}
                            </div>
                            <div>
                              <div className="font-medium text-white group-hover/row:text-indigo-300 transition-colors">
                                {msg.name}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {msg.email}
                              </div>
                            </div>
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-slate-300 max-w-xs truncate">
                          {msg.subject || '(No Subject)'}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={msg.status} />
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-slate-400 text-[11px]">
                          {relativeDate(msg.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {msg.status === 'UNREAD' && (
                              <button
                                onClick={() => setStatus(msg.id, 'READ')}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-all cursor-pointer"
                              >
                                Mark Read
                              </button>
                            )}
                            <Link href="/admin/messages">
                              <button className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-[11px] font-medium transition-all cursor-pointer">
                                View →
                              </button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* View All Footer Link */}
        <div className="flex justify-end pt-2">
          <Link href="/admin/messages" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors inline-flex items-center gap-1.5 group">
            <span>View all inquiries in messages</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
