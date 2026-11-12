/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  CalendarPlus,
  History,
  Users,
  Award,
  Tags,
  CalendarDays,
  FileSpreadsheet,
  Settings,
  CheckCircle2,
  FileClock,
  Shield,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavigationTab =
  | 'dashboard'
  | 'request_leave'
  | 'history'
  | 'employees'
  | 'entitlements'
  | 'leave_types'
  | 'holidays'
  | 'reports'
  | 'audit_logs'
  | 'acceptance_tests'
  | 'settings';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { role, currentUser } = useAuth();
  const isAdmin = role === 'ADMIN';

  const navItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: '1. Dashboard ภาพรวม',
      icon: LayoutDashboard,
      badge: 'สรุปยอด',
    },
    {
      id: 'request_leave' as NavigationTab,
      label: '2. บันทึกวันลา',
      icon: CalendarPlus,
      highlight: true,
    },
    {
      id: 'history' as NavigationTab,
      label: '3. ประวัติการลา',
      icon: History,
    },
    {
      id: 'employees' as NavigationTab,
      label: '4. จัดการพนักงาน',
      icon: Users,
      adminOnly: true,
    },
    {
      id: 'entitlements' as NavigationTab,
      label: '5. กำหนดสิทธิวันลา',
      icon: Award,
      adminOnly: true,
    },
    {
      id: 'leave_types' as NavigationTab,
      label: '6. ประเภทการลา',
      icon: Tags,
      adminOnly: true,
    },
    {
      id: 'holidays' as NavigationTab,
      label: '7. ปฏิทินวันหยุด',
      icon: CalendarDays,
    },
    {
      id: 'reports' as NavigationTab,
      label: '8. รายงานวันลา',
      icon: FileSpreadsheet,
    },
    {
      id: 'audit_logs' as NavigationTab,
      label: 'Audit Log ประวัติระบบ',
      icon: FileClock,
      adminOnly: true,
    },
    {
      id: 'acceptance_tests' as NavigationTab,
      label: 'ระบบทดสอบ (Test 1-12)',
      icon: CheckCircle2,
      special: true,
    },
    {
      id: 'settings' as NavigationTab,
      label: '9. ตั้งค่า & สำรองข้อมูล',
      icon: Settings,
      adminOnly: true,
    },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 md:static ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-0 max-md:-translate-x-full'
      }`}
    >
      {/* Top Brand Logo */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800 bg-slate-950/60">
        <Building2 className="w-6 h-6 text-blue-400 mr-2 shrink-0" />
        <div className="leading-tight truncate">
          <div className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
            LEAVE PORTAL by เสือโหย V.00
          </div>
          <div className="text-[11px] text-blue-300">ระบบบริหารวันลาพนักงาน</div>
        </div>
      </div>

      {/* User Info Card */}
      <div className="p-4 mx-3 my-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center space-x-3">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-sm ${
            isAdmin ? 'bg-indigo-600' : 'bg-emerald-600'
          }`}
        >
          {isAdmin ? 'AD' : 'EM'}
        </div>
        <div className="truncate min-w-0">
          <div className="text-xs font-semibold text-white truncate">{currentUser.name}</div>
          <div className="flex items-center space-x-1.5 mt-0.5">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                isAdmin ? 'bg-indigo-400' : 'bg-emerald-400'
              }`}
            />
            <span className="text-[10px] text-slate-400 font-medium tracking-tight">
              {isAdmin ? 'ADMIN (สิทธิ์ทั้งหมด)' : 'EMPLOYEE (ดูเฉพาะตนเอง)'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
        <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          เมนูหลัก (Navigation)
        </div>

        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : item.special
                  ? 'text-emerald-400 hover:bg-slate-800 hover:text-emerald-300'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? 'text-white'
                      : item.special
                      ? 'text-emerald-400'
                      : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && !isActive && (
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md">
                  {item.badge}
                </span>
              )}
              {item.adminOnly && !isActive && (
                <span className="text-[9px] bg-slate-800/80 text-indigo-300 border border-indigo-900/40 px-1.5 py-0.5 rounded-sm">
                  Admin
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Database & Policy Footer */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/40">
        <div className="flex items-center space-x-1.5 text-slate-300 font-medium">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span>รอบปีวันลา: 1 พ.ย. - 31 ต.ค.</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
          ไม่ทบวันลาข้ามปี • ตัดสิทธิทันที • ห้ามลาคร่อม 31 ต.ค.
        </p>
      </div>
    </aside>
  );
};
