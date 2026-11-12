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
  FileCode,
} from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';

export const SettingsView: React.FC = () => {
  const {
    exportDatabaseJSON,
    importDatabaseJSON,
    resetDatabase,
    employees,
    leaveTypes,
    entitlements,
    leaveRecords,
    holidays,
    auditLogs,
  } = useDatabase();

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

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
    if (
      window.confirm(
        'คุณต้องการรีเซ็ตฐานข้อมูลเป็นชุดข้อมูลตัวอย่างองค์กรมาตรฐาน (Demo Dataset) หรือไม่?'
      )
    ) {
      resetDatabase(true);
      setNotification({
        type: 'success',
        message: 'รีเซ็ตข้อมูลเป็นชุดตัวอย่างองค์กรเรียบร้อยแล้ว',
      });
      setTimeout(() => setNotification(null), 3000);
    }
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
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            ● ทำงานปกติ (Active Persistent)
          </span>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-700">
          <div className="font-semibold text-slate-900">
            โหมดจัดเก็บ: Local Persistent Storage Engine (พร้อมระบบ Transaction & Audit Log)
          </div>
          <p className="text-slate-600 leading-relaxed">
            * หมายเหตุตามข้อกำหนด: เนื่องจากผู้ใช้เลือกปฏิเสธการเชื่อมต่อ Firebase Setup
            ระบบจึงทำงานในโหมดจัดเก็บข้อมูลถาวรภายในเบราว์เซอร์อย่างปลอดภัย
            โดยรองรับการทำ Transaction ตัดสิทธิทันที ป้องกันการลาซ้อน และบันทึกประวัติการเปลี่ยนแปลง
            (Audit Log) ครบถ้วนตามมาตรฐานความปลอดภัย
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

      {/* Demo Reset Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span>จัดการชุดข้อมูลตัวอย่าง (Demo Dataset)</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ติดตั้งชุดข้อมูลตัวอย่างองค์กร: สมชาย (พนักงาน A), สมศรี (พนักงาน B), สิทธิปี 2027,
            ปฏิทินวันหยุดไทย, และประวัติการลา
          </p>
        </div>

        <button
          onClick={handleResetDemo}
          className="inline-flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
        >
          <RotateCcw className="w-4 h-4 mr-1.5" />
          <span>รีเซ็ตข้อมูลตัวอย่าง (Reset Demo)</span>
        </button>
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
    </div>
  );
};
