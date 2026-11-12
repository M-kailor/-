/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Award,
  Calendar,
  Save,
  Copy,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Users,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../context/DatabaseContext';
import { getLeaveYearRangeString } from '../../services/calculationEngine';
import { exportToCSV, exportToExcel, formatEntitlementsForExport } from '../../services/exportService';

export const EntitlementView: React.FC = () => {
  const { employees, leaveTypes, entitlements, setEntitlement, selectedYear, setSelectedYear, availableYears } =
    useDatabase();
  const { isAdmin } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDays, setEditingDays] = useState<number>(0);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const activeLeaveTypes = leaveTypes.filter((lt) => lt.isActive);

  const filteredEmployees = employees.filter((emp) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        emp.name.toLowerCase().includes(q) ||
        emp.employeeCode.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStartEdit = (empId: string, typeId: string, currentTotalHours: number) => {
    setEditingId(`${empId}_${typeId}`);
    setEditingDays(currentTotalHours / 8);
  };

  const handleSaveEdit = (empId: string, typeId: string) => {
    const days = Number(editingDays) || 0;
    const totalHours = days * 8;
    setEntitlement(empId, selectedYear, typeId, totalHours);
    setEditingId(null);
    setSuccessMsg(`กำหนดสิทธิ ${days} วัน (${totalHours} ชม.) สำเร็จ และคำนวณยอดคงเหลือใหม่ทันที`);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  // Batch Copy Entitlements to New Year (e.g. 2028)
  const handleCopyFromPreviousYear = () => {
    const prevYear = selectedYear - 1;
    let count = 0;
    employees.forEach((emp) => {
      activeLeaveTypes.forEach((lt) => {
        const prevEnt = entitlements.find(
          (e) => e.employeeId === emp.id && e.leaveYear === prevYear && e.leaveTypeId === lt.id
        );
        if (prevEnt) {
          // Initialize new year with fresh total hours (no leftover carry over)
          setEntitlement(emp.id, selectedYear, lt.id, prevEnt.totalHours);
          count++;
        }
      });
    });
    setSuccessMsg(`คัดลอกโครงสร้างสิทธิจากปี ${prevYear} จำนวน ${count} รายการ สำเร็จ (เริ่มรอบปีใหม่โดยไม่ทบยอด)`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Export
  const handleExportExcel = () => {
    const { headers, rows } = formatEntitlementsForExport(
      entitlements.filter((e) => e.leaveYear === selectedYear),
      (id) => employees.find((e) => e.id === id)?.name || id,
      (id) => leaveTypes.find((lt) => lt.id === id)?.name || id
    );
    exportToExcel(`Leave_Entitlements_${selectedYear}`, `สิทธิปี_${selectedYear}`, headers, rows);
  };

  const handleExportCSV = () => {
    const { headers, rows } = formatEntitlementsForExport(
      entitlements.filter((e) => e.leaveYear === selectedYear),
      (id) => employees.find((e) => e.id === id)?.name || id,
      (id) => leaveTypes.find((lt) => lt.id === id)?.name || id
    );
    exportToCSV(`Leave_Entitlements_${selectedYear}`, headers, rows);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            5. กำหนดสิทธิวันลา (Leave Entitlement Management)
          </h2>
          <p className="text-xs text-slate-500">
            กำหนดจำนวนวันสิทธิการลาแยกตามพนักงานและประเภทการลา (1 วัน = 8 ชม.) • ไม่ทบยอดข้ามปี (หมดอายุ 31 ต.ค.)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {isAdmin && (
            <button
              onClick={handleCopyFromPreviousYear}
              className="inline-flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              title="คัดลอกสิทธิเริ่มต้นจากปีก่อนหน้ามายังปีนี้ (ไม่รวมยอดคงเหลือ)"
            >
              <Copy className="w-3.5 h-3.5 mr-1.5 text-blue-300" />
              <span>คัดลอกสิทธิจากปีก่อน</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
            <span>Excel</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
          <Calendar className="w-4 h-4 text-blue-700" />
          <span className="font-semibold text-slate-700">เลือกรอบปีวันลา:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-transparent font-bold text-blue-900 focus:outline-hidden cursor-pointer"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                ปี {yr} ({getLeaveYearRangeString(yr)})
              </option>
            ))}
          </select>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="ค้นหาพนักงาน..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 sticky left-0 bg-slate-50 z-10">พนักงาน</th>
                <th className="px-4 py-3">แผนก</th>
                {activeLeaveTypes.map((lt) => (
                  <th key={lt.id} className="px-4 py-3 text-center border-l border-slate-200">
                    <div className="flex items-center justify-center space-x-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: lt.color }}
                      />
                      <span>{lt.name} (วัน)</span>
                    </div>
                    <div className="text-[9px] text-blue-800 font-semibold normal-case mt-0.5">
                      [สิทธิ / ใช้ไป / เหลือ (วัน)]
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 sticky left-0 bg-white hover:bg-slate-50 z-10 whitespace-nowrap">
                    <div>{emp.name}</div>
                    <div className="text-[10px] text-slate-400">{emp.employeeCode}</div>
                  </td>

                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{emp.department}</td>

                  {activeLeaveTypes.map((lt) => {
                    const ent = entitlements.find(
                      (e) =>
                        e.employeeId === emp.id &&
                        e.leaveYear === selectedYear &&
                        e.leaveTypeId === lt.id
                    );

                    const total = ent?.totalHours || 0;
                    const used = ent?.usedHours || 0;
                    const remaining = Math.max(0, total - used);
                    const isEditing = editingId === `${emp.id}_${lt.id}`;

                    const totalDays = (total / 8).toFixed(1).replace(/\.0$/, '');
                    const usedDays = (used / 8).toFixed(2).replace(/\.00$/, '');
                    const remainingDays = (remaining / 8).toFixed(2).replace(/\.00$/, '');

                    return (
                      <td
                        key={lt.id}
                        className="px-3 py-3 text-center border-l border-slate-100 whitespace-nowrap"
                      >
                        {isEditing ? (
                          <div className="flex flex-col items-center space-y-1">
                            <div className="flex items-center justify-center space-x-1">
                              <input
                                type="number"
                                min={0}
                                step={0.5}
                                value={editingDays}
                                onChange={(e) => setEditingDays(parseFloat(e.target.value) || 0)}
                                className="w-16 bg-white border border-blue-500 rounded px-1.5 py-0.5 text-center font-bold text-xs focus:outline-hidden"
                                placeholder="วัน"
                                autoFocus
                              />
                              <span className="text-[11px] font-bold text-slate-700">วัน</span>
                              <button
                                onClick={() => handleSaveEdit(emp.id, lt.id)}
                                className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                                title="บันทึกสิทธิ"
                              >
                                <Save className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1 rounded bg-slate-200 text-slate-600 hover:bg-slate-300 cursor-pointer"
                                title="ยกเลิก"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="text-[10px] text-blue-700 font-medium">
                              = {((Number(editingDays) || 0) * 8)} ชม.
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => isAdmin && handleStartEdit(emp.id, lt.id, total)}
                            className={`p-1.5 rounded-lg inline-block transition-colors ${
                              isAdmin ? 'cursor-pointer hover:bg-blue-50/70 group' : ''
                            }`}
                            title={isAdmin ? 'คลิกเพื่อกำหนดจำนวนวันสิทธิการลา' : undefined}
                          >
                            <div className="flex items-center justify-center space-x-1.5 text-xs">
                              <span className="font-extrabold text-slate-900">{totalDays} วัน</span>
                              <span className="text-slate-300">/</span>
                              <span className="text-amber-600 font-bold">{usedDays} วัน</span>
                              <span className="text-slate-300">/</span>
                              <span className="text-emerald-700 font-extrabold">{remainingDays} วัน</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              ({total} / {used} / {remaining} ชม.)
                            </div>
                            {isAdmin && (
                              <div className="text-[9px] text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                                คลิกเพื่อแก้ไข (กำหนดเป็นวัน)
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
