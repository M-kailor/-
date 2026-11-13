/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DatabaseProvider } from './context/DatabaseContext';
import { Header } from './components/layout/Header';
import { Sidebar, NavigationTab } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { LeaveRequestModal } from './components/leave/LeaveRequestModal';
import { LeaveHistoryView } from './components/leave/LeaveHistoryView';
import { EmployeeListView } from './components/employee/EmployeeListView';
import { EntitlementView } from './components/entitlement/EntitlementView';
import { LeaveTypeView } from './components/leavetype/LeaveTypeView';
import { HolidayView } from './components/holiday/HolidayView';
import { ReportsView } from './components/reports/ReportsView';
import { AuditLogView } from './components/audit/AuditLogView';
import { AcceptanceTestView } from './components/tests/AcceptanceTestView';
import { SettingsView } from './components/settings/SettingsView';
import { Menu, X, Radio, ArrowLeft } from 'lucide-react';

function MainApp() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isShareMode, setIsShareMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('share') === 'live';
  });

  const handleToggleShareMode = (enable: boolean) => {
    setIsShareMode(enable);
    if (enable) {
      setCurrentTab('dashboard');
      window.history.replaceState(null, '', '/?share=live');
    } else {
      window.history.replaceState(null, '', '/');
    }
  };

  const handleSelectTab = (tab: NavigationTab) => {
    if (tab === 'request_leave') {
      if (!isShareMode) setIsLeaveModalOpen(true);
      return;
    }
    setCurrentTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-800">
      {isShareMode && (
        <div className="bg-emerald-900 text-white text-xs px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radio className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
            <span className="font-semibold">
              โหมดแชร์ข้อมูล Real-Time (Live Read-Only View) — อัปเดตอัตโนมัติทันทีที่มีการเปลี่ยนแปลง
            </span>
          </div>
          <button
            onClick={() => handleToggleShareMode(false)}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>ออกจากโหมดแชร์</span>
          </button>
        </div>
      )}

      {/* Top Header */}
      <Header
        onOpenLeaveModal={() => setIsLeaveModalOpen(true)}
        isShareMode={isShareMode}
        onToggleSharePreview={handleToggleShareMode}
      />

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto relative">
        {/* Mobile Hamburger Toggle */}
        <div className="md:hidden fixed bottom-4 right-4 z-50">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-3 bg-blue-900 text-white rounded-full shadow-xl focus:outline-hidden"
          >
            {isMobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isShareMode={isShareMode}
        />

        {/* Mobile Backdrop */}
        {isMobileSidebarOpen && (
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 md:hidden"
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              onOpenLeaveModal={() => setIsLeaveModalOpen(true)}
              onNavigateHistory={() => setCurrentTab('history')}
              isShareMode={isShareMode}
            />
          )}

          {currentTab === 'history' && (
            <LeaveHistoryView
              onOpenLeaveModal={() => setIsLeaveModalOpen(true)}
              isShareMode={isShareMode}
            />
          )}

          {currentTab === 'employees' && !isShareMode && (
            <EmployeeListView
              onOpenEntitlements={() => setCurrentTab('entitlements')}
              onOpenLeaveModalFor={() => setIsLeaveModalOpen(true)}
            />
          )}

          {currentTab === 'entitlements' && !isShareMode && <EntitlementView />}

          {currentTab === 'leave_types' && !isShareMode && <LeaveTypeView />}

          {currentTab === 'holidays' && <HolidayView />}

          {currentTab === 'reports' && <ReportsView />}

          {currentTab === 'audit_logs' && !isShareMode && <AuditLogView />}

          {currentTab === 'acceptance_tests' && <AcceptanceTestView />}

          {currentTab === 'settings' && !isShareMode && <SettingsView />}
        </main>
      </div>

      {/* Global Leave Request Modal */}
      {!isShareMode && (
        <LeaveRequestModal
          isOpen={isLeaveModalOpen}
          onClose={() => setIsLeaveModalOpen(false)}
          onSuccess={() => {
            // Live sync handles refreshing across views
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DatabaseProvider>
        <MainApp />
      </DatabaseProvider>
    </AuthProvider>
  );
}
