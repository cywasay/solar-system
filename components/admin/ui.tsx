'use client';

import React from 'react';
import type { MessageStatus } from './AdminProvider';

/* Small shared primitives. Plain functions, no runtime styling library — every class is
   static Tailwind resolved at build time, so there is no style computation at runtime. */

export function Card({
  children,
  className = '',
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={`a-surface rounded-lg border ${padded ? 'p-5' : ''} ${className}`}
      style={{
        background: 'var(--a-surface)',
        borderColor: 'var(--a-border)',
        boxShadow: 'var(--a-shadow)',
      }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <h1 className="text-[19px] font-semibold tracking-[-0.01em]" style={{ color: 'var(--a-text)' }}>
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-[13px]" style={{ color: 'var(--a-text-muted)' }}>
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

const STATUS_STYLE: Record<MessageStatus, { bg: string; fg: string; label: string }> = {
  UNREAD: { bg: 'var(--a-warning-soft)', fg: 'var(--a-warning)', label: 'Unread' },
  READ: { bg: 'var(--a-surface-2)', fg: 'var(--a-text-muted)', label: 'Read' },
  REPLIED: { bg: 'var(--a-success-soft)', fg: 'var(--a-success)', label: 'Replied' },
};

export function StatusBadge({ status }: { status: MessageStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"
      style={{ background: s.bg, color: s.fg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
      {s.label}
    </span>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
};

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  style,
  ...props
}: ButtonProps) {
  const sizing = size === 'sm' ? 'h-8 px-3 text-[12px]' : 'h-9 px-3.5 text-[13px]';
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors ' +
    'disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const variants: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--a-accent)', color: 'var(--a-accent-text)', border: '1px solid transparent' },
    secondary: { background: 'var(--a-surface)', color: 'var(--a-text)', border: '1px solid var(--a-border-strong)' },
    ghost: { background: 'transparent', color: 'var(--a-text-muted)', border: '1px solid transparent' },
    danger: { background: 'var(--a-danger-soft)', color: 'var(--a-danger)', border: '1px solid transparent' },
  };

  return (
    <button
      data-focusable
      className={`${base} ${sizing} ${className}`}
      style={{ ...variants[variant], ...style }}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--a-text)' }}>
        {label}
      </span>
      {children}
      {hint && (
        <span className="block mt-1.5 text-[12px]" style={{ color: 'var(--a-text-subtle)' }}>
          {hint}
        </span>
      )}
    </label>
  );
}

export const inputStyle: React.CSSProperties = {
  background: 'var(--a-surface)',
  borderColor: 'var(--a-border-strong)',
  color: 'var(--a-text)',
};

export const inputClass =
  'w-full rounded-md border px-3 py-2 text-[13px] placeholder:opacity-50 focus:outline-none';

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="py-16 text-center">
      <p className="text-[14px] font-medium" style={{ color: 'var(--a-text)' }}>
        {title}
      </p>
      <p className="mt-1 text-[13px]" style={{ color: 'var(--a-text-muted)' }}>
        {body}
      </p>
    </div>
  );
}

/** Shimmer box primitive */
export function SkeletonBlock({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{ background: 'var(--a-surface-2)', opacity: 0.8, ...style }}
    />
  );
}

/** Stat card skeleton loader */
export function SkeletonStatCard() {
  return (
    <Card padded={true} className="space-y-3">
      <SkeletonBlock className="h-3.5 w-28" />
      <SkeletonBlock className="h-8 w-16" />
    </Card>
  );
}

/** Inbox sidebar skeleton items */
export function SkeletonInboxList({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y" style={{ borderColor: 'var(--a-border)' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="px-3 py-3 flex items-center gap-3">
          <SkeletonBlock className="w-9 h-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-3.5 w-24" />
              <SkeletonBlock className="h-2.5 w-10" />
            </div>
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-3 w-40" />
              <SkeletonBlock className="h-4 w-12 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Table rows skeleton loader */
export function SkeletonTableRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y" style={{ borderColor: 'var(--a-border)' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-5 py-3.5 gap-4">
          <div className="flex items-center gap-3 w-44 shrink-0">
            <SkeletonBlock className="w-8 h-8 rounded-full shrink-0" />
            <div className="space-y-1 flex-1">
              <SkeletonBlock className="h-3 w-24" />
              <SkeletonBlock className="h-2.5 w-32" />
            </div>
          </div>
          <SkeletonBlock className="h-3 flex-1 max-w-xs" />
          <SkeletonBlock className="h-5 w-16 rounded-full" />
          <SkeletonBlock className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Detail pane skeleton loader */
export function SkeletonDetail() {
  return (
    <Card padded={true} className="space-y-6">
      <div className="border-b pb-5 space-y-3" style={{ borderColor: 'var(--a-border)' }}>
        <div className="flex items-center justify-between">
          <SkeletonBlock className="h-5 w-20 rounded-full" />
          <SkeletonBlock className="h-4 w-32" />
        </div>
        <SkeletonBlock className="h-7 w-3/4" />
        <div className="grid grid-cols-3 gap-4 p-3 rounded-md" style={{ background: 'var(--a-surface-2)' }}>
          <SkeletonBlock className="h-8" />
          <SkeletonBlock className="h-8" />
          <SkeletonBlock className="h-8" />
        </div>
      </div>
      <div className="space-y-2">
        <SkeletonBlock className="h-3 w-28" />
        <SkeletonBlock className="h-24 w-full rounded-md" />
      </div>
    </Card>
  );
}

/** Stable, locale-independent formatting. `toLocaleString` with no locale differs
 *  between server and client and causes hydration warnings. */
export function formatDate(iso: string) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-GB', { month: 'short' });
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${day} ${month} ${d.getFullYear()}, ${time}`;
}

export function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}
