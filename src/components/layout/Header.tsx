/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Calendar,
  UserCheck,
  PlusCircle,
  ChevronDown,
  Share2,
  Copy,
  Check,
  Radio,
  X,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../context/DatabaseContext';
import { getLeaveYearRangeString } from '../../services/calculationEngine';

interface HeaderProps {
  onOpenLeaveModal: () => void;
  isShareMode?: boolean;
  onToggleSharePreview?: (enable: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenLeaveModal,
  isShareMode = false,
  onToggleSharePreview,
}) => {
  const { currentUser, role, switchUser, availableUsers, isAdmin } = useAuth();
  const {
    selectedYear,
    setSelectedYear,
    availableYears,
    isRealtimeConnected,
    lastSyncedAt,
  } = useDatabase();

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isShareModalOpen) return;
    const fallbackOrigin = window.location.origin;
    fetch('/api/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((cfg: { appUrl?: string } | null) => {
        const base =
          cfg?.appUrl && cfg.appUrl !== 'MY_APP_URL' && cfg.appUrl.startsWith('http')
            ? cfg.appUrl.replace(/\/$/, '')
            : fallbackOrigin;
        setShareUrl(`${base}/?share=live`);
      })
      .catch(() => {
        setShareUrl(`${fallbackOrigin}/?share=live`);
      });
  }, [isShareModalOpen]);

  const handleCopyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const input = document.getElementById('share-link-input') as HTMLInputElement | null;
      if (input) {
        input.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  return (
    <>
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
                    วันลาของเสือ
                  </h1>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
                    พัฒนาโดย เสือโหย
                  </span>
                  <span
                    className={`hidden md:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isRealtimeConnected
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                    title={
                      lastSyncedAt
                        ? `ซิงค์ล่าสุด: ${new Date(lastSyncedAt).toLocaleTimeString('th-TH')}`
                        : 'กำลังซิงค์ข้อมูล'
                    }
                  >
                    <Radio className="w-3 h-3" />
                    <span>{isRealtimeConnected ? 'Real-Time' : 'Sync'}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden md:block">
                  ระบบคำนวณวันลาและสิทธิอัตโนมัติ • ตัดวันหยุดบริษัท • อัปเดต Real-Time
                </p>
              </div>
            </div>

            {/* Right Action Controls */}
            <div className="flex items-center space-x-2 sm:space-x-2.5">
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

              {/* Share Real-Time Link Button */}
              {!isShareMode && isAdmin && (
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                  title="สร้างลิงก์แชร์ข้อมูล Real-Time"
                >
                  <Share2 className="w-4 h-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">แชร์ Real-Time</span>
                </button>
              )}

              {/* Quick Record Leave Button */}
              {!isShareMode && (
                <button
                  onClick={onOpenLeaveModal}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 transition-colors shadow-xs cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  <span>บันทึกวันลา</span>
                </button>
              )}

              {/* User Switcher Dropdown */}
              {!isShareMode && (
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
                                {u.employeeCode} • {u.role}
                              </div>
                            </div>
                            {isSelected && <span className="text-blue-600 text-xs">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Real-Time Share Link Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Share2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="text-sm font-bold">แชร์ลิงก์ดูข้อมูลแบบ Real-Time</h4>
                  <p className="text-[11px] text-slate-300">
                    ผู้ที่ได้รับลิงก์สามารถเปิดดูสิทธิวันลาและประวัติการลาที่อัปเดตตรงกันทันที
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-800">
                  <Radio className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">
                    สถานะ Real-Time Server:{' '}
                    {isRealtimeConnected ? 'ออนไลน์ (ซิงค์อัตโนมัติ)' : 'พร้อมซิงค์ข้อมูล'}
                  </span>
                </div>
                {lastSyncedAt > 0 && (
                  <span className="text-[11px] text-emerald-700">
                    อัปเดต {new Date(lastSyncedAt).toLocaleTimeString('th-TH')}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700">
                  ลิงก์สำหรับแชร์ (Live Read-Only View):
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    id="share-link-input"
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className={`px-3.5 py-2 rounded-lg font-bold text-white flex items-center space-x-1.5 cursor-pointer transition-colors ${
                      copied ? 'bg-emerald-600' : 'bg-blue-700 hover:bg-blue-800'
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                * เมื่อผู้ดูแลระบบบันทึกวันลา แก้ไขสิทธิ หรือล้างข้อมูล Demo ผู้ที่เปิดลิงก์นี้จะเห็นข้อมูลเปลี่ยนแปลงแบบ Real-Time ทันที โดยไม่สามารถแก้ไขข้อมูลหลังบ้านได้
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                {onToggleSharePreview ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsShareModalOpen(false);
                      onToggleSharePreview(true);
                    }}
                    className="inline-flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    <span>ทดลองดูมุมมองผู้ชมแชร์</span>
                  </button>
                ) : (
                  <span />
                )}

                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
