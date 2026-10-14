import React, { Suspense } from 'react';
import DashboardShell from '@/components/DashboardShell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07070D]" />}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
