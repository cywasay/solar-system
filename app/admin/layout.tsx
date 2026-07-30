import React from 'react';
import './admin.css';
import AdminProvider from '@/components/admin/AdminProvider';
import { ProtectedShell } from '@/components/admin/ProtectedShell';

export const metadata = {
  title: 'Thessaris Operations',
  description: 'Admin dashboard for Thessaris.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <ProtectedShell>{children}</ProtectedShell>
    </AdminProvider>
  );
}
