/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Filter,
  PlusCircle,
  User,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../context/DatabaseContext';
import { EntitlementCards } from './EntitlementCards';
import { LeaveCharts } from './LeaveCharts';
import { formatDateThai, getLeaveYearRangeString } from '../../services/calculationEngine';

interface DashboardViewProps {
  onOpenLeaveModal: () => void;
  onNavigateHistory: () => void;
  isShareMode?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenLeaveModal,
  onNavigateHistory,
  isShareMode = false,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const {
    employees,
    leaveTypes,
    entitlements,
    leaveRecords,
    selectedYear,
    setSelectedYear,
    availableYears,
  } = useDatabase();

  const adminEmployee = employees.find((e) => e.role === 'ADMIN') || currentUser;

  // Default Employee Filter to Admin's ID (no department aggregation)
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>(
    isAdmin ? adminEmployee.id : currentUser.id
  );
  const [filterTypeId, setFilterTypeId] = useState<string>('ALL');

  // Keep filterEmployeeId valid when currentUser or employees update
  useEffect(() => {
    if (!isAdmin) {
      setFilterEmployeeId(currentUser.id);
    } else if (!employees.some((e) => e.id === filterEmployeeId)) {
      setFilterEmployeeId(adminEmployee.id);
    }
  }, [isAdmin, currentUser.id, employees, filterEmployeeId, adminEmployee.id]);

  const effectiveEmployeeId = isAdmin ? filterEmployeeId : currentUser.id;
  const selectedEmployee =
    employees.find((e) => e.id === effectiveEmployeeId) || currentUser;

  // Filtered records based on selected employee (never department-aggregated)
  const filteredRecords = leaveRecords.filter((rec) => {
    if (rec.leaveYear !== selectedYear) return false;
    if (rec.employeeId !== effectiveEmployeeId) return false;
    if (filterTypeId !== 'ALL' && rec.leaveTypeId !== filterTypeId) return false;
    return true;
  });

  // Filtered entitlements for the selected employee
  const filteredEntitlements = entitlements.filter((ent) => {
    if (ent.leaveYear !== selectedYear) return false;
    if (ent.employeeId !== effectiveEmployeeId) return false;
    if (filterTypeId !== 'ALL' && ent.leaveTypeId !== filterTypeId) return false;
    return true;
  });

  // Summary metrics for the selected employee
  const totalEntitlementHours = filteredEntitlements.reduce((sum, e) => sum + e.totalHours, 0);
  const totalUsedHours = filteredEntitlements.reduce((sum, e) => sum + e.usedHours, 0);
  const totalRemainingHours = Math.max(0, totalEntitlementHours - totalUsedHours);

  // Active leave types for Entitlement vs Used comparison
  const comparisonLeaveTypes = leaveTypes
    .filter((lt) => lt.isActive)
    .filter((lt) => filterTypeId === 'ALL' || lt.id === filterTypeId);

  const comparisonRows = comparisonLeaveTypes.map((lt) => {
    const matched = filteredEntitlements.filter((e) => e.leaveTypeId === lt.id);
    const total = matched.reduce((sum, e) => sum + e.totalHours, 0);
    const used = matched.reduce((sum, e) => sum + e.usedHours, 0);
    const remaining = Math.max(0, total - used);
    return {
      id: lt.id,
      name: lt.name,
      color: lt.color || '#2563eb',
      total,
      used,
      remaining,
    };
  });

  const formatDays = (hours: number) => (hours / 8).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Year Range Info */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-600 text-white">
              {isAdmin ? 'วันลาของเสือ' : 'EMPLOYEE PORTAL'}
            </span>
            <span className="text-xs text-slate-400">
              รอบปีวันลา {selectedYear} ({getLeaveYearRangeString(selectedYear)})
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white mt-1">
            {isAdmin ? adminEmployee.name : currentUser.name}
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            {isShareMode
              ? `มุมมองแชร์ข้อมูล Real-Time • กำลังแสดงข้อมูลของ: ${selectedEmployee.name}`
              : `สรุปสิทธิวันลาและประวัติการลาของ ${selectedEmployee.name} ประจำปีวันลา ${selectedYear}`}
          </p>
        </div>

        {!isShareMode && (
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenLeaveModal}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              <span>บันทึกวันลาใหม่</span>
            </button>
          </div>
        )}
      </div>

      {/* Filters Section (Employee-scoped, no department filter) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-slate-700 font-bold">
          <Filter className="w-4 h-4 text-blue-700" />
          <span>ตัวกรองข้อมูล (Dashboard Filters):</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter Leave Year */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
            <span className="text-slate-500 font-medium">ปีวันลา:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-bold text-blue-900 focus:outline-hidden cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr} ({getLeaveYearRangeString(yr)})
                </option>
              ))}
            </select>
          </div>

          {/* Filter Employee (Default = Admin) */}
          {isAdmin && (
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
              <span className="text-slate-500 font-medium">พนักงาน:</span>
              <select
                value={effectiveEmployeeId}
                onChange={(e) => setFilterEmployeeId(e.target.value)}
                className="bg-transparent font-bold text-slate-900 focus:outline-hidden cursor-pointer max-w-[220px] truncate"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filter Leave Type */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
            <span className="text-slate-500 font-medium">ประเภท:</span>
            <select
              value={filterTypeId}
              onChange={(e) => setFilterTypeId(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">ทุกประเภท (All Types)</option>
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Promoted Top Section: เปรียบเทียบสิทธิและการใช้จริง (Entitlement vs Used) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                เปรียบเทียบสิทธิและการใช้จริง (Entitlement vs Used)
              </h3>
              <div className="flex items-center space-x-1.5 text-xs text-slate-600 mt-0.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-bold text-blue-900">{selectedEmployee.name}</span>
                <span className="text-slate-400">({selectedEmployee.employeeCode})</span>
              </div>
            </div>
          </div>

          {/* Selected Employee Summary Metrics */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-slate-500 mr-1">ใช้ไป:</span>
              <span className="font-extrabold text-amber-700">
                {formatDays(totalUsedHours)} วัน ({totalUsedHours} ชม.)
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-slate-500 mr-1">คงเหลือ:</span>
              <span className="font-extrabold text-emerald-700">
                {formatDays(totalRemainingHours)} วัน ({totalRemainingHours} ชม.)
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200">
              <span className="text-slate-500 mr-1">สิทธิทั้งหมด:</span>
              <span className="font-bold text-slate-800">
                {formatDays(totalEntitlementHours)} วัน ({totalEntitlementHours} ชม.)
              </span>
            </div>
          </div>
        </div>

        {/* Bars per Leave Type */}
        {comparisonRows.length > 0 ? (
          <div className="space-y-4">
            {comparisonRows.map((item) => {
              const usedPct = item.total > 0 ? (item.used / item.total) * 100 : 0;
              return (
                <div key={item.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-bold text-slate-900">{item.name}</span>
                    </div>
                    <div className="space-x-2 text-xs">
                      <span className="text-amber-600 font-bold">
                        ใช้ {formatDays(item.used)} วัน ({item.used} ชม.)
                      </span>
                      <span className="text-slate-300">/</span>
                      <span className="text-slate-500">
                        สิทธิ {formatDays(item.total)} วัน ({item.total} ชม.)
                      </span>
                      <span className="text-emerald-600 font-bold">
                        (เหลือ {formatDays(item.remaining)} วัน ({item.remaining} ชม.))
                      </span>
                    </div>
                  </div>

                  {/* Dual Bar */}
                  <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-amber-500 transition-all duration-300"
                      style={{ width: `${Math.min(usedPct, 100)}%` }}
                      title={`ใช้ไป ${item.used} ชม.`}
                    />
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${item.total > 0 ? Math.max(0, 100 - usedPct) : 0}%` }}
                      title={`คงเหลือ ${item.remaining} ชม.`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">
            ยังไม่มีการกำหนดสิทธิวันลาให้พนักงานคนนี้ในปี {selectedYear}
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-2 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
          <div className="flex items-center space-x-5">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              <span>ใช้ไปแล้ว (Used)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span>คงเหลือ (Remaining)</span>
            </div>
          </div>
          <span>คำนวณตาม 1 วันทำงาน = 8 ชั่วโมง • ข้อมูลเฉพาะ {selectedEmployee.name}</span>
        </div>
      </div>

      {/* Part 1: ภาพรวมสิทธิวันลาแยกตามประเภท (Cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
            <span>ภาพรวมสิทธิวันลาแยกตามประเภท (Leave Entitlements)</span>
            <span className="text-[11px] font-normal text-slate-500 lowercase">
              ({filteredEntitlements.length} รายการที่ตรงเงื่อนไข)
            </span>
          </h3>
        </div>

        <EntitlementCards
          leaveTypes={leaveTypes}
          entitlements={filteredEntitlements}
          selectedYear={selectedYear}
        />
      </div>

      {/* Part 2: กราฟวิเคราะห์ (Charts) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          กราฟวิเคราะห์ข้อมูลการลา (Visual Analytics)
        </h3>
        <LeaveCharts
          leaveTypes={leaveTypes}
          entitlements={filteredEntitlements}
          records={filteredRecords}
          selectedYear={selectedYear}
        />
      </div>

      {/* Part 4: ประวัติการลาล่าสุด (Recent Leave Records) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              ประวัติการลาล่าสุด (Recent Leave Records)
            </h3>
            <p className="text-xs text-slate-400">
              แสดงรายการลาที่บันทึกแล้วและตัดสิทธิทันที
            </p>
          </div>
          <button
            onClick={onNavigateHistory}
            className="text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline cursor-pointer"
          >
            ดูประวัติทั้งหมด →
          </button>
        </div>

        {filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">รหัสรายการ</th>
                  {isAdmin && <th className="px-4 py-3">พนักงาน</th>}
                  <th className="px-4 py-3">ประเภทการลา</th>
                  <th className="px-4 py-3">ช่วงวันที่ลา</th>
                  <th className="px-4 py-3 text-right">จำนวนชั่วโมง</th>
                  <th className="px-4 py-3 text-right">วันเทียบเท่า</th>
                  <th className="px-4 py-3">เหตุผล</th>
                  <th className="px-4 py-3 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.slice(0, 5).map((rec) => {
                  const isCompleted = rec.status === 'COMPLETED';
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {rec.recordCode}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{rec.employeeName}</div>
                          <div className="text-[10px] text-slate-400">{rec.department}</div>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200">
                          {rec.leaveTypeName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDateThai(rec.startDate)}
                        {rec.startDate !== rec.endDate && ` - ${formatDateThai(rec.endDate)}`}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {rec.totalHours} ชม.
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {rec.equivalentDays.toFixed(2)} วัน
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate" title={rec.reason}>
                        {rec.reason}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isCompleted ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            บันทึกสำเร็จ
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            ยกเลิกแล้ว
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            ไม่พบประวัติการลาที่ตรงกับตัวกรองที่เลือก
          </div>
        )}
      </div>
    </div>
  );
};
