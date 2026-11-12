/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  FileText,
  Calendar,
  Users,
  Tags,
  Building,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../context/DatabaseContext';
import { formatDateThai, getLeaveYearRangeString } from '../../services/calculationEngine';
import { exportToCSV, exportToExcel, exportToPDF } from '../../services/exportService';

type ReportType =
  | 'BY_EMPLOYEE'
  | 'BY_TYPE'
  | 'BY_DEPARTMENT'
  | 'ENTITLEMENT_BALANCE'
  | 'YEAR_END'
  | 'HISTORICAL';

export const ReportsView: React.FC = () => {
  const { employees, leaveTypes, entitlements, leaveRecords, selectedYear, setSelectedYear, availableYears } =
    useDatabase();
  const { isAdmin, currentUser } = useAuth();

  const [activeReport, setActiveReport] = useState<ReportType>('BY_EMPLOYEE');

  // Filter records and entitlements by year and permissions
  const relevantRecords = leaveRecords.filter((r) => {
    if (r.leaveYear !== selectedYear) return false;
    if (!isAdmin && r.employeeId !== currentUser.id) return false;
    return true;
  });

  const relevantEntitlements = entitlements.filter((e) => {
    if (e.leaveYear !== selectedYear) return false;
    if (!isAdmin && e.employeeId !== currentUser.id) return false;
    return true;
  });

  // 1. Report: By Employee
  const reportByEmployeeData = employees
    .filter((emp) => isAdmin || emp.id === currentUser.id)
    .map((emp) => {
      const empRecords = relevantRecords.filter(
        (r) => r.employeeId === emp.id && r.status === 'COMPLETED'
      );
      const empEnts = relevantEntitlements.filter((e) => e.employeeId === emp.id);

      const totalEnt = empEnts.reduce((sum, e) => sum + e.totalHours, 0);
      const usedHours = empRecords.reduce((sum, r) => sum + r.totalHours, 0);
      const remainingHours = Math.max(0, totalEnt - usedHours);

      return {
        id: emp.id,
        code: emp.employeeCode,
        name: emp.name,
        department: emp.department,
        totalEnt,
        usedHours,
        remainingHours,
        usedDays: usedHours / 8,
        recordCount: empRecords.length,
      };
    });

  // 2. Report: By Leave Type
  const reportByTypeData = leaveTypes.map((lt) => {
    const typeRecords = relevantRecords.filter(
      (r) => r.leaveTypeId === lt.id && r.status === 'COMPLETED'
    );
    const typeEnts = relevantEntitlements.filter((e) => e.leaveTypeId === lt.id);

    const totalEnt = typeEnts.reduce((sum, e) => sum + e.totalHours, 0);
    const usedHours = typeRecords.reduce((sum, r) => sum + r.totalHours, 0);
    const remainingHours = Math.max(0, totalEnt - usedHours);
    const usedPct = totalEnt > 0 ? (usedHours / totalEnt) * 100 : 0;

    return {
      id: lt.id,
      name: lt.name,
      minUnit: lt.minUnitHours,
      totalEnt,
      usedHours,
      remainingHours,
      usedDays: usedHours / 8,
      recordCount: typeRecords.length,
      usedPct,
    };
  });

  // 3. Report: By Department
  const departments = Array.from(new Set(employees.map((e) => e.department))).filter(Boolean);
  const reportByDeptData = departments.map((dept) => {
    const deptEmployees = employees.filter((e) => e.department === dept);
    const deptEmpIds = new Set(deptEmployees.map((e) => e.id));

    const deptRecords = relevantRecords.filter(
      (r) => deptEmpIds.has(r.employeeId) && r.status === 'COMPLETED'
    );
    const deptEnts = relevantEntitlements.filter((e) => deptEmpIds.has(e.employeeId));

    const totalEnt = deptEnts.reduce((sum, e) => sum + e.totalHours, 0);
    const usedHours = deptRecords.reduce((sum, r) => sum + r.totalHours, 0);
    const remainingHours = Math.max(0, totalEnt - usedHours);

    return {
      department: dept,
      employeeCount: deptEmployees.length,
      totalEnt,
      usedHours,
      remainingHours,
      usedDays: usedHours / 8,
      recordCount: deptRecords.length,
    };
  });

  // 4. Report: Entitlement & Balance Matrix
  const reportBalanceData = relevantEntitlements.map((ent) => {
    const emp = employees.find((e) => e.id === ent.employeeId);
    const lt = leaveTypes.find((t) => t.id === ent.leaveTypeId);
    const usedPct = ent.totalHours > 0 ? (ent.usedHours / ent.totalHours) * 100 : 0;

    return {
      id: ent.id,
      employeeCode: emp?.employeeCode || ent.employeeId,
      employeeName: emp?.name || ent.employeeId,
      department: emp?.department || '-',
      leaveTypeName: lt?.name || ent.leaveTypeId,
      totalHours: ent.totalHours,
      usedHours: ent.usedHours,
      remainingHours: ent.remainingHours,
      usedDays: ent.usedHours / 8,
      remainingDays: ent.remainingHours / 8,
      usedPct: `${usedPct.toFixed(1)}%`,
    };
  });

  // 5. Report: Year-End Summary
  const reportYearEndData = employees
    .filter((emp) => isAdmin || emp.id === currentUser.id)
    .map((emp) => {
      const empEnts = relevantEntitlements.filter((e) => e.employeeId === emp.id);
      const totalEnt = empEnts.reduce((sum, e) => sum + e.totalHours, 0);
      const usedHours = empEnts.reduce((sum, e) => sum + e.usedHours, 0);
      const expiredHours = Math.max(0, totalEnt - usedHours);

      return {
        code: emp.employeeCode,
        name: emp.name,
        department: emp.department,
        totalEnt,
        usedHours,
        expiredHours,
        expiredDays: expiredHours / 8,
        note: 'สิทธิคงเหลือสิ้นสุด 31 ต.ค. ไม่ทบไปปีใหม่',
      };
    });

  // Universal Export Handler
  const handleExport = (format: 'EXCEL' | 'CSV' | 'PDF') => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let title = '';

    if (activeReport === 'BY_EMPLOYEE') {
      title = `รายงานวันลาแยกตามพนักงาน_ปี_${selectedYear}`;
      headers = [
        'รหัสพนักงาน',
        'ชื่อ-นามสกุล',
        'แผนก',
        'สิทธิรวม (ชม.)',
        'ใช้ไป (ชม.)',
        'คงเหลือ (ชม.)',
        'วันเทียบเท่า (วัน)',
        'จำนวนครั้งที่ลา',
      ];
      rows = reportByEmployeeData.map((d) => [
        d.code,
        d.name,
        d.department,
        d.totalEnt,
        d.usedHours,
        d.remainingHours,
        d.usedDays.toFixed(2),
        d.recordCount,
      ]);
    } else if (activeReport === 'BY_TYPE') {
      title = `รายงานวันลาแยกตามประเภท_ปี_${selectedYear}`;
      headers = [
        'ประเภทการลา',
        'หน่วยขั้นต่ำ (ชม.)',
        'สิทธิรวมทั้งหมด (ชม.)',
        'ใช้ไปแล้ว (ชม.)',
        'คงเหลือ (ชม.)',
        'สัดส่วนการใช้สิทธิ (%)',
        'จำนวนรายการ',
      ];
      rows = reportByTypeData.map((d) => [
        d.name,
        d.minUnit,
        d.totalEnt,
        d.usedHours,
        d.remainingHours,
        `${d.usedPct.toFixed(1)}%`,
        d.recordCount,
      ]);
    } else if (activeReport === 'BY_DEPARTMENT') {
      title = `รายงานวันลาแยกตามแผนก_ปี_${selectedYear}`;
      headers = [
        'แผนก',
        'จำนวนพนักงาน',
        'สิทธิรวมแผนก (ชม.)',
        'ใช้ไปแล้ว (ชม.)',
        'คงเหลือ (ชม.)',
        'วันเทียบเท่า (วัน)',
        'จำนวนรายการ',
      ];
      rows = reportByDeptData.map((d) => [
        d.department,
        d.employeeCount,
        d.totalEnt,
        d.usedHours,
        d.remainingHours,
        d.usedDays.toFixed(2),
        d.recordCount,
      ]);
    } else if (activeReport === 'ENTITLEMENT_BALANCE') {
      title = `รายงานสิทธิและยอดคงเหลือ_ปี_${selectedYear}`;
      headers = [
        'รหัสพนักงาน',
        'ชื่อ-นามสกุล',
        'แผนก',
        'ประเภทการลา',
        'สิทธิที่ได้รับ (ชม.)',
        'ใช้ไปแล้ว (ชม.)',
        'คงเหลือ (ชม.)',
        'สัดส่วนการใช้สิทธิ',
      ];
      rows = reportBalanceData.map((d) => [
        d.employeeCode,
        d.employeeName,
        d.department,
        d.leaveTypeName,
        d.totalHours,
        d.usedHours,
        d.remainingHours,
        d.usedPct,
      ]);
    } else if (activeReport === 'YEAR_END') {
      title = `รายงานวันลาสิ้นสุดปี_ปี_${selectedYear}`;
      headers = [
        'รหัสพนักงาน',
        'ชื่อ-นามสกุล',
        'แผนก',
        'สิทธิรวมทั้งปี (ชม.)',
        'ใช้จริง (ชม.)',
        'สิทธิที่หมดอายุ (ชม.)',
        'วันเทียบเท่าที่หมดอายุ',
        'หมายเหตุ',
      ];
      rows = reportYearEndData.map((d) => [
        d.code,
        d.name,
        d.department,
        d.totalEnt,
        d.usedHours,
        d.expiredHours,
        d.expiredDays.toFixed(2),
        d.note,
      ]);
    } else {
      // Historical Records
      title = `รายงานประวัติการลาแบบละเอียด_ปี_${selectedYear}`;
      headers = [
        'รหัสรายการ',
        'รหัสพนักงาน',
        'ชื่อ-นามสกุล',
        'แผนก',
        'ประเภทการลา',
        'วันที่เริ่ม',
        'วันที่สิ้นสุด',
        'ชั่วโมงที่ลา',
        'วันเทียบเท่า',
        'สถานะ',
        'เหตุผล',
      ];
      rows = relevantRecords.map((r) => [
        r.recordCode,
        r.employeeId,
        r.employeeName,
        r.department,
        r.leaveTypeName,
        formatDateThai(r.startDate),
        formatDateThai(r.endDate),
        r.totalHours,
        r.equivalentDays.toFixed(2),
        r.status === 'COMPLETED' ? 'บันทึกสำเร็จ' : 'ยกเลิกแล้ว',
        r.reason,
      ]);
    }

    if (format === 'EXCEL') {
      exportToExcel(title, 'รายงาน', headers, rows);
    } else if (format === 'CSV') {
      exportToCSV(title, headers, rows);
    } else {
      exportToPDF(
        title,
        title.replace(/_/g, ' '),
        `รอบปีวันลา ${selectedYear} (${getLeaveYearRangeString(selectedYear)})`,
        headers,
        rows
      );
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            8. รายงานวันลา (Leave Reports & Analytics)
          </h2>
          <p className="text-xs text-slate-500">
            วิเคราะห์ข้อมูลวันลาแยกมิติ พร้อมส่งออก Excel (.xlsx), CSV (UTF-8 BOM), และ PDF ได้ทันที
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Format Export Buttons */}
          <button
            onClick={() => handleExport('EXCEL')}
            className="inline-flex items-center px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => handleExport('CSV')}
            className="inline-flex items-center px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            <span>CSV (UTF-8)</span>
          </button>

          <button
            onClick={() => handleExport('PDF')}
            className="inline-flex items-center px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 mr-1" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Year Selector Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
          <Calendar className="w-4 h-4 text-blue-700" />
          <span className="font-semibold text-slate-700">ปีวันลาของรายงาน:</span>
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
        <div className="text-[11px] text-slate-500 hidden sm:block">
          รอบปีวันลา: 01 พฤศจิกายน ถึง 31 ตุลาคม
        </div>
      </div>

      {/* Navigation Sub-tabs for 6 Reports */}
      <div className="flex overflow-x-auto space-x-2 pb-1 text-xs">
        <button
          onClick={() => setActiveReport('BY_EMPLOYEE')}
          className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
            activeReport === 'BY_EMPLOYEE'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          1. แยกตามพนักงาน
        </button>

        <button
          onClick={() => setActiveReport('BY_TYPE')}
          className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
            activeReport === 'BY_TYPE'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          2. แยกตามประเภทการลา
        </button>

        <button
          onClick={() => setActiveReport('BY_DEPARTMENT')}
          className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
            activeReport === 'BY_DEPARTMENT'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          3. แยกตามแผนก
        </button>

        <button
          onClick={() => setActiveReport('ENTITLEMENT_BALANCE')}
          className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
            activeReport === 'ENTITLEMENT_BALANCE'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          4. สิทธิและยอดคงเหลือ
        </button>

        <button
          onClick={() => setActiveReport('YEAR_END')}
          className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
            activeReport === 'YEAR_END'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          5. สิ้นสุดปีวันลา
        </button>

        <button
          onClick={() => setActiveReport('HISTORICAL')}
          className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
            activeReport === 'HISTORICAL'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          6. ประวัติการลาแบบละเอียด
        </button>
      </div>

      {/* Table Preview Based on Active Report */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {activeReport === 'BY_EMPLOYEE' && (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">รหัส</th>
                  <th className="px-4 py-3">ชื่อ-นามสกุล</th>
                  <th className="px-4 py-3">แผนก</th>
                  <th className="px-4 py-3 text-right">สิทธิรวม (ชม.)</th>
                  <th className="px-4 py-3 text-right">ใช้ไป (ชม.)</th>
                  <th className="px-4 py-3 text-right">คงเหลือ (ชม.)</th>
                  <th className="px-4 py-3 text-right">วันเทียบเท่า</th>
                  <th className="px-4 py-3 text-center">จำนวนครั้งที่ลา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportByEmployeeData.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-semibold text-slate-900">{d.code}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{d.name}</td>
                    <td className="px-4 py-3 text-slate-600">{d.department}</td>
                    <td className="px-4 py-3 text-right font-medium">{d.totalEnt} ชม.</td>
                    <td className="px-4 py-3 text-right font-bold text-amber-600">
                      {d.usedHours} ชม.
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-emerald-700">
                      {d.remainingHours} ชม.
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500">
                      {d.usedDays.toFixed(2)} วัน
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-blue-700">
                      {d.recordCount} ครั้ง
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'BY_TYPE' && (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">ประเภทการลา</th>
                  <th className="px-4 py-3">หน่วยขั้นต่ำ</th>
                  <th className="px-4 py-3 text-right">สิทธิรวมทั้งหมด</th>
                  <th className="px-4 py-3 text-right">ใช้ไปแล้ว</th>
                  <th className="px-4 py-3 text-right">คงเหลือ</th>
                  <th className="px-4 py-3 text-right">สัดส่วนการใช้</th>
                  <th className="px-4 py-3 text-center">จำนวนรายการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportByTypeData.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-bold text-slate-900">{d.name}</td>
                    <td className="px-4 py-3 text-slate-500">{d.minUnit} ชม.</td>
                    <td className="px-4 py-3 text-right font-medium">{d.totalEnt} ชม.</td>
                    <td className="px-4 py-3 text-right font-bold text-amber-600">
                      {d.usedHours} ชม.
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-emerald-700">
                      {d.remainingHours} ชม.
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {d.usedPct.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-blue-700">
                      {d.recordCount} รายการ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'BY_DEPARTMENT' && (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">แผนก</th>
                  <th className="px-4 py-3 text-center">จำนวนพนักงาน</th>
                  <th className="px-4 py-3 text-right">สิทธิรวมแผนก</th>
                  <th className="px-4 py-3 text-right">ใช้ไปแล้ว</th>
                  <th className="px-4 py-3 text-right">คงเหลือ</th>
                  <th className="px-4 py-3 text-right">วันเทียบเท่า</th>
                  <th className="px-4 py-3 text-center">จำนวนรายการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportByDeptData.map((d) => (
                  <tr key={d.department} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-bold text-slate-900">{d.department}</td>
                    <td className="px-4 py-3 text-center font-medium">{d.employeeCount} คน</td>
                    <td className="px-4 py-3 text-right font-medium">{d.totalEnt} ชม.</td>
                    <td className="px-4 py-3 text-right font-bold text-amber-600">
                      {d.usedHours} ชม.
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-emerald-700">
                      {d.remainingHours} ชม.
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500">
                      {d.usedDays.toFixed(2)} วัน
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-blue-700">
                      {d.recordCount} รายการ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'ENTITLEMENT_BALANCE' && (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">รหัสพนักงาน</th>
                  <th className="px-4 py-3">ชื่อ-นามสกุล</th>
                  <th className="px-4 py-3">แผนก</th>
                  <th className="px-4 py-3">ประเภทการลา</th>
                  <th className="px-4 py-3 text-right">สิทธิทั้งหมด</th>
                  <th className="px-4 py-3 text-right">ใช้ไปแล้ว</th>
                  <th className="px-4 py-3 text-right">คงเหลือ</th>
                  <th className="px-4 py-3 text-right">สัดส่วนที่ใช้</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportBalanceData.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-semibold text-slate-900">{d.employeeCode}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{d.employeeName}</td>
                    <td className="px-4 py-3 text-slate-600">{d.department}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                        {d.leaveTypeName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{d.totalHours} ชม.</td>
                    <td className="px-4 py-3 text-right font-bold text-amber-600">
                      {d.usedHours} ชม.
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-emerald-700">
                      {d.remainingHours} ชม.
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">{d.usedPct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'YEAR_END' && (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">รหัสพนักงาน</th>
                  <th className="px-4 py-3">ชื่อ-นามสกุล</th>
                  <th className="px-4 py-3">แผนก</th>
                  <th className="px-4 py-3 text-right">สิทธิรวมทั้งปี</th>
                  <th className="px-4 py-3 text-right">ใช้จริง</th>
                  <th className="px-4 py-3 text-right">สิทธิที่หมดอายุ (31 ต.ค.)</th>
                  <th className="px-4 py-3">เงื่อนไขการตัดยอด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportYearEndData.map((d) => (
                  <tr key={d.code} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-semibold text-slate-900">{d.code}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{d.name}</td>
                    <td className="px-4 py-3 text-slate-600">{d.department}</td>
                    <td className="px-4 py-3 text-right font-medium">{d.totalEnt} ชม.</td>
                    <td className="px-4 py-3 text-right font-bold text-amber-600">
                      {d.usedHours} ชม.
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-rose-700">
                      {d.expiredHours} ชม. ({d.expiredDays.toFixed(2)} วัน)
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-500 italic">{d.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'HISTORICAL' && (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">รหัสรายการ</th>
                  <th className="px-4 py-3">พนักงาน</th>
                  <th className="px-4 py-3">ประเภท</th>
                  <th className="px-4 py-3">ช่วงวันที่</th>
                  <th className="px-4 py-3 text-right">ชั่วโมง</th>
                  <th className="px-4 py-3 text-right">วันเทียบเท่า</th>
                  <th className="px-4 py-3">เหตุผล</th>
                  <th className="px-4 py-3 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {relevantRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-semibold text-slate-900">{r.recordCode}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{r.employeeName}</td>
                    <td className="px-4 py-3">{r.leaveTypeName}</td>
                    <td className="px-4 py-3">
                      {formatDateThai(r.startDate)} - {formatDateThai(r.endDate)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {r.totalHours} ชม.
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500">
                      {r.equivalentDays.toFixed(2)} วัน
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.reason}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {r.status === 'COMPLETED' ? 'บันทึกสำเร็จ' : 'ยกเลิกแล้ว'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
