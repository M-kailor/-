/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Settings,
  Database,
  Download,
  Upload,
  RotateCcw,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Info,
  Server,
  Trash2,
} from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';

export const SettingsView: React.FC = () => {
  const {
    exportDatabaseJSON,
    importDatabaseJSON,
    clearDemoData,
    resetDatabase,
    employees,
    leaveTypes,
    entitlements,
    leaveRecords,
    holidays,
    auditLogs,
    isRealtimeConnected,
  } = useDatabase();

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [confirmClearDemoOpen, setConfirmClearDemoOpen] = useState(false);
  const [clearAllRecords, setClearAllRecords] = useState(false);
  const [removeDemoEmployees, setRemoveDemoEmployees] = useState(false);

  const handleExportJSON = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leave_management_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotification({
      type: 'success',
      message: 'สำรองข้อมูลฐานข้อมูลสำเร็จ (JSON Backup Created)',
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importDatabaseJSON(content);
      if (res.success) {
        setNotification({
          type: 'success',
          message: 'นำเข้าข้อมูลฐานข้อมูลสำเร็จ ข้อมูลถูกปรับปรุงเรียบร้อย',
        });
      } else {
        setNotification({
          type: 'error',
          message: res.error || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล',
        });
      }
      setTimeout(() => setNotification(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetDemo = () => {
    setConfirmResetOpen(true);
  };

  const confirmResetAction = () => {
    resetDatabase(true);
    setConfirmResetOpen(false);
    setNotification({
      type: 'success',
      message: 'รีเซ็ตข้อมูลเป็นชุดตัวอย่างองค์กรเรียบร้อยแล้ว',
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const confirmClearDemoAction = () => {
    const res = clearDemoData({
      clearAllLeaveRecords: clearAllRecords,
      removeDemoEmployees,
    });
    setConfirmClearDemoOpen(false);
    setNotification({
      type: 'success',
      message: `ล้างข้อมูล Demo เรียบร้อยแล้ว (ลบประวัติการลา ${res.removedRecords} รายการ${
        res.removedEmployees > 0 ? `, ลบพนักงานตัวอย่าง ${res.removedEmployees} คน` : ''
      })`,
    });
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            9. ตั้งค่าระบบ & จัดการฐานข้อมูล (Settings & Database)
          </h2>
          <p className="text-xs text-slate-500">
            ตรวจสอบสถาปัตยกรรมฐานข้อมูล สำรองข้อมูล (Backup) นำเข้า (Restore) และจัดการข้อมูล Demo
          </p>
        </div>
      </div>

      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center space-x-2 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Database Status Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                สถานะระบบฐานข้อมูล (Database Architecture)
              </h3>
              <p className="text-xs text-slate-500">
                สถาปัตยกรรมการจัดเก็บข้อมูลและการจำลอง Transaction
              </p>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
              isRealtimeConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {isRealtimeConnected ? '● เชื่อมต่อ Real-Time Server แล้ว' : '● โหมดซิงค์อัตโนมัติ'}
          </span>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-700">
          <div className="font-semibold text-slate-900">
            โหมดจัดเก็บ: Server Persistent JSON + Real-Time SSE Sync (พร้อม Audit Log)
          </div>
          <p className="text-slate-600 leading-relaxed">
            ระบบจัดเก็บข้อมูลถาวรบนเซิร์ฟเวอร์และซิงค์ข้อมูลแบบ Real-Time ผ่าน Server-Sent Events (SSE)
            เพื่อให้ผู้ที่เปิดลิงก์แชร์สามารถเห็นยอดสิทธิวันลาและประวัติการลาที่อัปเดตตรงกันทันทีทุกอุปกรณ์
          </p>
        </div>

        {/* Database Collection Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">พนักงาน</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">{employees.length}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">ประเภทการลา</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">{leaveTypes.length}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">การกำหนดสิทธิ</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">{entitlements.length}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">รายการลา</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">{leaveRecords.length}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">วันหยุดในปฏิทิน</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">{holidays.length}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">Audit Logs</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">{auditLogs.length}</div>
          </div>
        </div>
      </div>

      {/* Backup and Restore */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Backup */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm mb-1">
              <Download className="w-4 h-4 text-blue-700" />
              <span>สำรองข้อมูลระบบทั้งหมด (Full JSON Backup)</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              ส่งออกโครงสร้างข้อมูลทั้งหมด (พนักงาน, สิทธิ, ประวัติการลา, วันหยุด, Audit Logs) เป็นไฟล์ JSON
              เพื่อเก็บบันทึกความปลอดภัยหรือย้ายเครื่อง
            </p>
          </div>
          <button
            onClick={handleExportJSON}
            className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <Download className="w-4 h-4" />
            <span>ดาวน์โหลดไฟล์สำรองข้อมูล (.json)</span>
          </button>
        </div>

        {/* Restore */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm mb-1">
              <Upload className="w-4 h-4 text-emerald-700" />
              <span>นำเข้าข้อมูลจากไฟล์สำรอง (Restore Backup)</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              กู้คืนฐานข้อมูลจากไฟล์สำรองข้อมูล .json ที่เคยส่งออกไว้ก่อนหน้า
            </p>
          </div>
          <label className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center space-x-1.5 text-center">
            <Upload className="w-4 h-4" />
            <span>เลือกไฟล์ JSON เพื่อกู้คืน</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Demo Cleanup & Reset Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
              <Trash2 className="w-4 h-4 text-amber-600" />
              <span>ล้างข้อมูล Demo เพื่อเริ่มใช้งานจริง</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              ลบประวัติการลาตัวอย่างออกและคำนวณยอดใช้ไป-คงเหลือใหม่ให้สะอาดพร้อมใช้งานจริง
            </p>
          </div>

          <button
            onClick={() => setConfirmClearDemoOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            <span>ล้างข้อมูล Demo (เริ่มใช้งานจริง)</span>
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
              <RotateCcw className="w-4 h-4 text-slate-600" />
              <span>รีเซ็ตเป็นชุดข้อมูลตัวอย่าง (Reset Demo)</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              กู้คืนชุดข้อมูลตัวอย่างองค์กรมาตรฐาน (พนักงานตัวอย่าง, สิทธิปี 2027, วันหยุด และประวัติตัวอย่าง)
            </p>
          </div>

          <button
            onClick={handleResetDemo}
            className="inline-flex items-center justify-center px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            <span>รีเซ็ตข้อมูลตัวอย่าง (Reset Demo)</span>
          </button>
        </div>
      </div>

      {/* System Policy Parameters Summary */}
      <div className="bg-slate-900 text-slate-300 p-5 rounded-2xl border border-slate-800 text-xs space-y-3">
        <div className="text-sm font-bold text-white flex items-center space-x-2">
          <Shield className="w-4 h-4 text-blue-400" />
          <span>กฎและนโยบายวันลาของระบบ (System Business Rules)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
          <div className="space-y-1">
            <div className="font-semibold text-white">• รอบปีวันลา (Leave Year):</div>
            <p className="text-[11px] text-slate-400">
              1 พฤศจิกายน ถึง 31 ตุลาคมของปีถัดไป สิทธิคงเหลือหมดอายุทันที ไม่มีการทบยอด
            </p>
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-white">• ปฏิทินวันทำงาน:</div>
            <p className="text-[11px] text-slate-400">
              จันทร์ - ศุกร์ วันละ 8 ชั่วโมง (ตัดเสาร์ อาทิตย์ และวันหยุดบริษัทออกอัตโนมัติ)
            </p>
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-white">• การลาคร่อม 31 ตุลาคม:</div>
            <p className="text-[11px] text-slate-400">
              ห้ามลาคร่อมรอบปีในรายการเดียว ต้องแยกเป็นคนละปีวันลาเพื่อคำนวณสิทธิแยกกัน
            </p>
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-white">• ขั้นตอนอนุมัติ:</div>
            <p className="text-[11px] text-slate-400">
              ไม่ต้องผ่านการอนุมัติ เมื่อบันทึกจะตัดสิทธิทันที และเมื่อยกเลิกจะคืนสิทธิทันที
            </p>
          </div>
        </div>
      </div>
      {/* Modal: Clear Demo Data */}
      {confirmClearDemoOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-amber-700 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trash2 className="w-5 h-5 text-amber-200" />
                <h4 className="text-sm font-bold">ยืนยันล้างข้อมูล Demo เพื่อเริ่มใช้งานจริง</h4>
              </div>
              <button
                onClick={() => setConfirmClearDemoOpen(false)}
                className="text-amber-100 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                ลบรายการประวัติการลาตัวอย่างออกและคำนวณยอดวันลาคงเหลือใหม่ให้ตรงกับข้อมูลจริง
              </p>
              <div className="space-y-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clearAllRecords}
                    onChange={(e) => setClearAllRecords(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-blue-600"
                  />
                  <span className="font-semibold text-slate-900">
                    ล้างประวัติการลาทั้งหมด (เริ่มยอดใช้ไปที่ 0 ชม. ทุกคน)
                  </span>
                </label>
                <label className="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={removeDemoEmployees}
                    onChange={(e) => setRemoveDemoEmployees(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-blue-600"
                  />
                  <span className="font-semibold text-slate-900">
                    ลบรายชื่อพนักงานตัวอย่างด้วย (คงไว้เฉพาะ Admin และพนักงานที่เพิ่มเอง)
                  </span>
                </label>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setConfirmClearDemoOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmClearDemoAction}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold cursor-pointer"
                >
                  ยืนยันล้างข้อมูล Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reset Demo Confirmation */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-5 h-5 text-blue-300" />
                <h4 className="text-sm font-bold">ยืนยันรีเซ็ตข้อมูลตัวอย่าง</h4>
              </div>
              <button
                onClick={() => setConfirmResetOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                คุณต้องการรีเซ็ตฐานข้อมูลทั้งหมดกลับเป็นชุดข้อมูลตัวอย่างองค์กรมาตรฐาน (Demo Dataset) ใช่หรือไม่?
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setConfirmResetOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmResetAction}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold cursor-pointer"
                >
                  ยืนยันรีเซ็ตข้อมูล
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
