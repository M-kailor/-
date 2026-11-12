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
import { Menu, X, ShieldAlert } from 'lucide-react';

function MainApp() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleSelectTab = (tab: NavigationTab) => {
    if (tab === 'request_leave') {
      setIsLeaveModalOpen(true);
      return;
    }
    setCurrentTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-800">
      {/* Top Header */}
      <Header onOpenLeaveModal={() => setIsLeaveModalOpen(true)} />

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
            />
          )}

          {currentTab === 'history' && (
            <LeaveHistoryView onOpenLeaveModal={() => setIsLeaveModalOpen(true)} />
          )}

          {currentTab === 'employees' && (
            <EmployeeListView
              onOpenEntitlements={() => setCurrentTab('entitlements')}
              onOpenLeaveModalFor={() => setIsLeaveModalOpen(true)}
            />
          )}

          {currentTab === 'entitlements' && <EntitlementView />}

          {currentTab === 'leave_types' && <LeaveTypeView />}

          {currentTab === 'holidays' && <HolidayView />}

          {currentTab === 'reports' && <ReportsView />}

          {currentTab === 'audit_logs' && <AuditLogView />}

          {currentTab === 'acceptance_tests' && <AcceptanceTestView />}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Leave Request Modal */}
      <LeaveRequestModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onSuccess={() => {
          // If user was on another tab, optionally switch to history or stay on dashboard
        }}
      />
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
