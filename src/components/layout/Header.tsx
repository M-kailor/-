/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Calendar,
  ShieldCheck,
  UserCheck,
  PlusCircle,
  Database,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../context/DatabaseContext';
import { getLeaveYearRangeString } from '../../services/calculationEngine';

interface HeaderProps {
  onOpenLeaveModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenLeaveModal }) => {
  const { currentUser, role, switchUser, availableUsers } = useAuth();
  const { selectedYear, setSelectedYear, availableYears } = useDatabase();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Title & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900 flex items-center justify-center text-white font-bold shadow-sm">
              <Calendar className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Leave Management System
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
                  ระบบบริหารวันลา
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                ระบบคำนวณวันลาและสิทธิอัตโนมัติ • ตัดวันหยุดบริษัท • สิทธิรายปี
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Leave Year Selector */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs sm:text-sm">
              <Calendar className="w-3.5 h-3.5 text-blue-700 mr-1.5" />
              <span className="text-slate-500 mr-1 hidden sm:inline">ปีวันลา:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent font-semibold text-blue-900 focus:outline-hidden cursor-pointer"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    ปี {yr} ({getLeaveYearRangeString(yr)})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Record Leave Button */}
            <button
              onClick={onOpenLeaveModal}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 transition-colors shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              <span>บันทึกวันลา</span>
            </button>

            {/* User Switcher Dropdown */}
            <div className="relative group">
              <div className="flex items-center bg-slate-100 hover:bg-slate-200 transition-colors rounded-lg px-2.5 py-1 cursor-pointer border border-slate-200">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mr-2 ${
                    role === 'ADMIN' ? 'bg-indigo-600' : 'bg-emerald-600'
                  }`}
                >
                  {role === 'ADMIN' ? 'A' : 'E'}
                </div>
                <div className="text-left hidden lg:block mr-2">
                  <div className="text-xs font-semibold text-slate-800 truncate max-w-[140px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {role === 'ADMIN' ? 'ผู้ดูแลระบบ (Admin)' : 'พนักงาน (Employee)'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </div>

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 hidden group-hover:block z-50">
                <div className="px-3 py-1.5 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>สลับบทบาทผู้ใช้ (User Switcher)</span>
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {availableUsers.map((u) => {
                    const isSelected = u.id === currentUser.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => switchUser(u.id)}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          isSelected ? 'bg-blue-50/70 font-semibold text-blue-900' : 'text-slate-700'
                        }`}
                      >
                        <div className="truncate">
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                u.role === 'ADMIN' ? 'bg-indigo-500' : 'bg-emerald-500'
                              }`}
                            />
                            <span className="truncate">{u.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 pl-3.5">
                            {u.department} • {u.role}
                          </div>
                        </div>
                        {isSelected && <span className="text-blue-600 text-xs">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
