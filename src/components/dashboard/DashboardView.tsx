/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  FileSpreadsheet,
  PlusCircle,
  Users,
  Building,
  TrendingUp,
  Layers,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../context/DatabaseContext';
import { EntitlementCards } from './EntitlementCards';
import { LeaveCharts } from './LeaveCharts';
import { formatDateThai, getLeaveYearRangeString } from '../../services/calculationEngine';
import { LeaveRecord } from '../../types';

interface DashboardViewProps {
  onOpenLeaveModal: () => void;
  onNavigateHistory: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenLeaveModal,
  onNavigateHistory,
}) => {
  const { role, currentUser, isAdmin } = useAuth();
  const {
    employees,
    leaveTypes,
    entitlements,
    leaveRecords,
    selectedYear,
    setSelectedYear,
    availableYears,
  } = useDatabase();

  // Part 5 Filters
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>(
    isAdmin ? 'ALL' : currentUser.id
  );
  const [filterDepartment, setFilterDepartment] = useState<string>('ALL');
  const [filterTypeId, setFilterTypeId] = useState<string>('ALL');

  // Filtered records based on role and selected filters
  const filteredRecords = leaveRecords.filter((rec) => {
    // Leave Year
    if (rec.leaveYear !== selectedYear) return false;

    // Role check: Employee can ONLY view their own records
    if (!isAdmin) {
      if (rec.employeeId !== currentUser.id) return false;
    } else {
      if (filterEmployeeId !== 'ALL' && rec.employeeId !== filterEmployeeId) return false;
      if (filterDepartment !== 'ALL' && rec.department !== filterDepartment) return false;
    }

    if (filterTypeId !== 'ALL' && rec.leaveTypeId !== filterTypeId) return false;

    return true;
  });

  // Filtered entitlements for summary cards and charts
  const filteredEntitlements = entitlements.filter((ent) => {
    if (ent.leaveYear !== selectedYear) return false;

    if (!isAdmin) {
      if (ent.employeeId !== currentUser.id) return false;
    } else {
      if (filterEmployeeId !== 'ALL' && ent.employeeId !== filterEmployeeId) return false;
      if (filterDepartment !== 'ALL') {
        const emp = employees.find((e) => e.id === ent.employeeId);
        if (emp?.department !== filterDepartment) return false;
      }
    }

    if (filterTypeId !== 'ALL' && ent.leaveTypeId !== filterTypeId) return false;

    return true;
  });

  // Part 3: Summary Metrics
  const totalEntitlementHours = filteredEntitlements.reduce((sum, e) => sum + e.totalHours, 0);
  const totalUsedHours = filteredEntitlements.reduce((sum, e) => sum + e.usedHours, 0);
  const totalRemainingHours = Math.max(0, totalEntitlementHours - totalUsedHours);
  const totalEquivalentDays = totalUsedHours / 8;
  const overallUsedPct =
    totalEntitlementHours > 0 ? (totalUsedHours / totalEntitlementHours) * 100 : 0;

  // Departments list for filter
  const departments = Array.from(new Set(employees.map((e) => e.department))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Year Range Info */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-600 text-white">
              {isAdmin ? 'ADMINISTRATOR DASHBOARD' : 'EMPLOYEE PORTAL'}
            </span>
            <span className="text-xs text-slate-400">
              รอบปีวันลา {selectedYear} ({getLeaveYearRangeString(selectedYear)})
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white mt-1">
            วันนี้มีอะไรให้เสือโหยดูแล
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            {isAdmin
              ? 'สรุปภาพรวมสิทธิวันลาและการใช้วันลาของพนักงานในองค์กรแบบ Real-time'
              : `สรุปสิทธิวันลาส่วนบุคคลประจำปีวันลา ${selectedYear}`}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenLeaveModal}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            <span>บันทึกวันลาใหม่</span>
          </button>
        </div>
      </div>

      {/* Part 5: Filters Section */}
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

          {/* Filter Employee (Admin Only) */}
          {isAdmin && (
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
              <span className="text-slate-500 font-medium">พนักงาน:</span>
              <select
                value={filterEmployeeId}
                onChange={(e) => setFilterEmployeeId(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-hidden cursor-pointer max-w-[150px] truncate"
              >
                <option value="ALL">ทุกคน (All Employees)</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filter Department (Admin Only) */}
          {isAdmin && (
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
              <span className="text-slate-500 font-medium">แผนก:</span>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">ทุกแผนก (All)</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
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

      {/* Part 3: สรุปภาพรวม (Summary Overview Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Days Used */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">วันลาที่ใช้ไป (Used)</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {(totalUsedHours / 8).toFixed(2).replace(/\.00$/, '')}{' '}
              <span className="text-xs font-bold text-slate-700">วัน</span>{' '}
              <span className="text-xs font-semibold text-amber-600">({totalUsedHours} ชม.)</span>
            </div>
            <div className="text-[10px] text-amber-600 font-medium mt-0.5">
              ใช้ไปแล้ว {overallUsedPct.toFixed(1)}% ของสิทธิ
            </div>
          </div>
        </div>

        {/* Total Remaining */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">สิทธิคงเหลือทั้งหมด (Remaining)</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight">
              {(totalRemainingHours / 8).toFixed(2).replace(/\.00$/, '')}{' '}
              <span className="text-xs font-bold text-emerald-800">วัน</span>{' '}
              <span className="text-xs font-semibold text-emerald-600">({totalRemainingHours} ชม.)</span>
            </div>
            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
              คงเหลือ {((totalRemainingHours / (totalEntitlementHours || 1)) * 100).toFixed(1)}% ของสิทธิ
            </div>
          </div>
        </div>

        {/* Total Entitlement */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">สิทธิทั้งหมด (Total Entitled)</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {(totalEntitlementHours / 8).toFixed(1).replace(/\.0$/, '')}{' '}
              <span className="text-xs font-bold text-slate-700">วัน</span>{' '}
              <span className="text-xs font-semibold text-slate-500">({totalEntitlementHours} ชม.)</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              คำนวณตาม 1 วัน = 8 ชั่วโมง
            </div>
          </div>
        </div>

        {/* Proportion Used */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">สัดส่วนการใช้สิทธิวันลา</div>
            <div className="text-xl sm:text-2xl font-black text-blue-700 tracking-tight">
              {overallUsedPct.toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              ใช้ {(totalUsedHours / 8).toFixed(1)} จาก {(totalEntitlementHours / 8).toFixed(1)} วัน
            </div>
          </div>
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
