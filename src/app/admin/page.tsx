'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar, AdminSectionTab } from '@/components/admin/AdminSidebar';
import { AdminMfaGate } from '@/components/admin/AdminMfaGate';
import { AdminOverviewSection } from '@/components/admin/AdminOverviewSection';
import { AdminEventsSection } from '@/components/admin/AdminEventsSection';
import { AdminUsersSection } from '@/components/admin/AdminUsersSection';
import { AdminContactSection } from '@/components/admin/AdminContactSection';
import { AdminMailLogSection } from '@/components/admin/AdminMailLogSection';
import { AdminNotificationsSection } from '@/components/admin/AdminNotificationsSection';
import { AdminSettingsSection } from '@/components/admin/AdminSettingsSection';
import { AdminOnBehalfSection } from '@/components/admin/AdminOnBehalfSection';
import { AdminExportSection } from '@/components/admin/AdminExportSection';
import { Loader2 } from 'lucide-react';

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useLanguage();
  const isIt = locale === 'it';

  // Read current tab from URL or default to 'overview'
  const tabParam = (searchParams.get('tab') as AdminSectionTab) || 'overview';
  const [currentTab, setCurrentTab] = useState<AdminSectionTab>(tabParam);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Auth and MFA Gate state
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authStatus, setAuthStatus] = useState<{
    authenticated: boolean;
    email: string | null;
    isMfaVerified: boolean;
    mfaStatus: { isEnrolled: boolean; hasRecoveryCodes: boolean };
    adminEmailConfigured: string;
  }>({
    authenticated: false,
    email: null,
    isMfaVerified: false,
    mfaStatus: { isEnrolled: false, hasRecoveryCodes: false },
    adminEmailConfigured: 'admin@openstage.it',
  });

  // Global badges for sidebar
  const [openReportsCount, setOpenReportsCount] = useState(0);
  const [newTicketsCount, setNewTicketsCount] = useState(0);
  const [mailFailuresCount, setMailFailuresCount] = useState(0);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  const checkAuth = async () => {
    try {
      setCheckingAuth(true);
      const res = await fetch('/api/admin/auth');
      const json = await res.json();
      setAuthStatus(json);

      if (json.authenticated && json.isMfaVerified) {
        fetchSidebarBadges();
      }
    } catch (err) {
      console.error('Error verifying admin auth', err);
    } finally {
      setCheckingAuth(false);
    }
  };

  const fetchSidebarBadges = async () => {
    try {
      // 1. Events reports
      const evRes = await fetch('/api/admin/events?view=reports');
      const evJson = await evRes.json();
      const openRep = (evJson.reports || []).filter((r: any) => r.status === 'open').length;
      setOpenReportsCount(openRep);

      // 2. Contact tickets
      const ctRes = await fetch('/api/admin/contact?status=new');
      const ctJson = await ctRes.json();
      setNewTicketsCount((ctJson.tickets || []).length);

      // 3. Mail failures
      const mlRes = await fetch('/api/admin/maillog?status=failed');
      const mlJson = await mlRes.json();
      setMailFailuresCount(mlJson.failuresLast24h || 0);

      // 4. Notifications
      const ntRes = await fetch('/api/admin/notifications');
      const ntJson = await ntRes.json();
      setUnreadNotifsCount(ntJson.unreadCount || 0);
    } catch {}
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const param = searchParams.get('tab') as AdminSectionTab;
    if (param && param !== currentTab) {
      setCurrentTab(param);
    }
  }, [searchParams]);

  const handleSelectTab = (tab: AdminSectionTab) => {
    setCurrentTab(tab);
    router.push(`/admin?tab=${tab}`);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      window.location.href = '/';
    } catch {}
  };

  if (checkingAuth) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <AdminMfaGate
      authenticated={authStatus.authenticated}
      isMfaVerified={authStatus.isMfaVerified}
      mfaStatus={authStatus.mfaStatus}
      adminEmailConfigured={authStatus.adminEmailConfigured}
      userEmail={authStatus.email}
      onVerified={() => checkAuth()}
    >
      <div className="min-h-screen bg-[#07070D] text-slate-100 flex flex-col">
        {/* Dedicated Admin Header */}
        <AdminHeader
          adminEmail={authStatus.email || authStatus.adminEmailConfigured}
          onLogout={handleLogout}
          onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onNavigateToNotifications={() => handleSelectTab('notifications')}
        />

        <div className="flex-1 flex w-full max-w-7xl mx-auto">
          {/* Sidebar */}
          <AdminSidebar
            currentTab={currentTab}
            onSelectTab={handleSelectTab}
            openReportsCount={openReportsCount}
            newTicketsCount={newTicketsCount}
            mailFailuresCount={mailFailuresCount}
            unreadNotifsCount={unreadNotifsCount}
            isOpenMobile={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />

          {/* Main Content Area */}
          <main className="flex-1 p-4 sm:p-8 min-w-0 overflow-y-auto">
            {currentTab === 'overview' && <AdminOverviewSection />}
            {currentTab === 'events' && <AdminEventsSection />}
            {currentTab === 'users' && <AdminUsersSection />}
            {currentTab === 'contact' && <AdminContactSection />}
            {currentTab === 'maillog' && <AdminMailLogSection />}
            {currentTab === 'notifications' && <AdminNotificationsSection />}
            {currentTab === 'settings' && <AdminSettingsSection />}
            {currentTab === 'on-behalf' && <AdminOnBehalfSection />}
            {currentTab === 'export' && <AdminExportSection />}
          </main>
        </div>
      </div>
    </AdminMfaGate>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
