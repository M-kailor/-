/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../context/DatabaseContext';
import { formatDateThai } from '../../services/calculationEngine';
import { exportToCSV, exportToExcel, exportToPDF, formatLeaveRecordsForExport } from '../../services/exportService';
import { LeaveRecord } from '../../types';

interface LeaveHistoryViewProps {
  onOpenLeaveModal: () => void;
}

export const LeaveHistoryView: React.FC<LeaveHistoryViewProps> = ({ onOpenLeaveModal }) => {
  const { role, currentUser, isAdmin } = useAuth();
  const {
    employees,
    leaveTypes,
    leaveRecords,
    selectedYear,
    setSelectedYear,
    availableYears,
    cancelLeaveRecord,
  } = useDatabase();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>(
    isAdmin ? 'ALL' : currentUser.id
  );
  const [filterTypeId, setFilterTypeId] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Selected Record for Detail Modal
  const [viewRecord, setViewRecord] = useState<LeaveRecord | null>(null);

  // Cancellation Modal State
  const [cancelModalRecord, setCancelModalRecord] = useState<LeaveRecord | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

  // Filter records
  const filtered = leaveRecords.filter((rec) => {
    if (selectedYear !== 0 && rec.leaveYear !== selectedYear) return false;

    if (!isAdmin) {
      if (rec.employeeId !== currentUser.id) return false;
    } else {
      if (filterEmployeeId !== 'ALL' && rec.employeeId !== filterEmployeeId) return false;
    }

    if (filterTypeId !== 'ALL' && rec.leaveTypeId !== filterTypeId) return false;
    if (filterStatus !== 'ALL' && rec.status !== filterStatus) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchCode = rec.recordCode.toLowerCase().includes(q);
      const matchName = rec.employeeName.toLowerCase().includes(q);
      const matchReason = rec.reason.toLowerCase().includes(q);
      const matchDept = rec.department.toLowerCase().includes(q);
      if (!matchCode && !matchName && !matchReason && !matchDept) return false;
    }

    return true;
  });

  const handleConfirmCancel = () => {
    if (!cancelModalRecord) return;
    setCancelError(null);

    const res = cancelLeaveRecord(cancelModalRecord.id, cancelReason.trim());
    if (res.success) {
      setCancelSuccess(
        `ยกเลิกรายการ [${cancelModalRecord.recordCode}] สำเร็จ และคืนสิทธิ ${cancelModalRecord.totalHours} ชั่วโมง เรียบร้อยแล้ว`
      );
      setTimeout(() => {
        setCancelModalRecord(null);
        setCancelReason('');
        setCancelSuccess(null);
      }, 1200);
    } else {
      setCancelError(res.error || 'เกิดข้อผิดพลาดในการยกเลิก');
    }
  };

  // Export handlers
  const handleExportExcel = () => {
    const { headers, rows } = formatLeaveRecordsForExport(filtered);
    exportToExcel(`Leave_History_${selectedYear}`, 'ประวัติการลา', headers, rows);
  };

  const handleExportCSV = () => {
    const { headers, rows } = formatLeaveRecordsForExport(filtered);
    exportToCSV(`Leave_History_${selectedYear}`, headers, rows);
  };

  const handleExportPDF = () => {
    const { headers, rows } = formatLeaveRecordsForExport(filtered);
    exportToPDF(
      `Leave_History_${selectedYear}`,
      'รายงานประวัติการลาพนักงาน (Leave Records History)',
      `รอบปีวันลา ${selectedYear} • ข้อมูล ณ วันที่ ${new Date().toLocaleDateString('th-TH')}`,
      headers,
      rows
    );
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            3. ประวัติการลา (Leave History & Records)
          </h2>
          <p className="text-xs text-slate-500">
            ตรวจสอบรายการลาย้อนหลัง แยกรายวัน และสามารถขอยกเลิกเพื่อคืนสิทธิได้ทันที
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Export Dropdown / Buttons */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
            title="ส่งออกไฟล์ Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
            <span>Excel</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
            title="ส่งออกไฟล์ CSV"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
            title="ส่งออกไฟล์ PDF"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            <span>PDF</span>
          </button>

          <button
            onClick={onOpenLeaveModal}
            className="inline-flex items-center px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
          >
            + บันทึกวันลา
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหารหัส, ชื่อ, เหตุผล..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden"
            />
          </div>

          {/* Year */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
            <span className="text-slate-500 mr-1.5">ปี:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-bold text-blue-900 focus:outline-hidden cursor-pointer w-full"
            >
              <option value={0}>ทุกปี (All Years)</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  ปี {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Employee Filter (Admin) */}
          {isAdmin ? (
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
              <span className="text-slate-500 mr-1.5">พนักงาน:</span>
              <select
                value={filterEmployeeId}
                onChange={(e) => setFilterEmployeeId(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-hidden cursor-pointer w-full truncate"
              >
                <option value="ALL">ทุกคน</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-600 font-medium">
              <span>พนักงาน: {currentUser.name}</span>
            </div>
          )}

          {/* Leave Type */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
            <span className="text-slate-500 mr-1.5">ประเภท:</span>
            <select
              value={filterTypeId}
              onChange={(e) => setFilterTypeId(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-hidden cursor-pointer w-full"
            >
              <option value="ALL">ทุกประเภท</option>
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
            <span className="text-slate-500 mr-1.5">สถานะ:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-hidden cursor-pointer w-full"
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="COMPLETED">บันทึกสำเร็จ (ตัดสิทธิแล้ว)</option>
              <option value="CANCELLED">ยกเลิกแล้ว (คืนสิทธิแล้ว)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">รหัสรายการ</th>
                {isAdmin && <th className="px-4 py-3">พนักงาน / แผนก</th>}
                <th className="px-4 py-3">ประเภทการลา</th>
                <th className="px-4 py-3">ช่วงวันที่ลา</th>
                <th className="px-4 py-3 text-right">จำนวนชั่วโมง</th>
                <th className="px-4 py-3 text-right">วันเทียบเท่า</th>
                <th className="px-4 py-3">เหตุผล</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((rec) => {
                  const isCompleted = rec.status === 'COMPLETED';
                  const canCancel =
                    isCompleted && (isAdmin || rec.employeeId === currentUser.id);

                  return (
                    <tr
                      key={rec.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        !isCompleted ? 'bg-slate-50/40 text-slate-400' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        {rec.recordCode}
                      </td>

                      {isAdmin && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{rec.employeeName}</div>
                          <div className="text-[10px] text-slate-400">{rec.department}</div>
                        </td>
                      )}

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200">
                          {rec.leaveTypeName}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>
                          {formatDateThai(rec.startDate)}
                          {rec.startDate !== rec.endDate && ` - ${formatDateThai(rec.endDate)}`}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {rec.startTime} - {rec.endTime} น.
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        {rec.totalHours} ชม.
                      </td>

                      <td className="px-4 py-3 text-right text-slate-500 whitespace-nowrap">
                        {rec.equivalentDays.toFixed(2)} วัน
                      </td>

                      <td
                        className="px-4 py-3 max-w-[180px] truncate text-slate-600"
                        title={rec.reason}
                      >
                        {rec.reason}
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
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

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* View details */}
                          <button
                            onClick={() => setViewRecord(rec)}
                            className="p-1 rounded text-slate-500 hover:text-blue-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="ดูรายละเอียดแยกรายวัน"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Cancel button */}
                          {canCancel && (
                            <button
                              onClick={() => {
                                setCancelModalRecord(rec);
                                setCancelReason('');
                                setCancelError(null);
                                setCancelSuccess(null);
                              }}
                              className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="ยกเลิกรายการ (คืนสิทธิ)"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="py-12 text-center text-slate-400">
                    ไม่พบรายการลาที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View Day-by-Day Breakdown */}
      {viewRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold">
                  รายละเอียดรายการลา [{viewRecord.recordCode}]
                </h4>
                <p className="text-xs text-slate-300">
                  {viewRecord.employeeName} • {viewRecord.leaveTypeName}
                </p>
              </div>
              <button
                onClick={() => setViewRecord(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400">ช่วงวันที่:</span>
                  <div className="font-bold text-slate-900">
                    {formatDateThai(viewRecord.startDate)} - {formatDateThai(viewRecord.endDate)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">รวมชั่วโมง:</span>
                  <div className="font-bold text-blue-700">
                    {viewRecord.totalHours} ชม. ({viewRecord.equivalentDays.toFixed(2)} วัน)
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">เหตุผล:</span>
                  <div className="text-slate-800">{viewRecord.reason}</div>
                </div>
                <div>
                  <span className="text-slate-400">บันทึกเมื่อ:</span>
                  <div className="text-slate-800">
                    {new Date(viewRecord.createdAt).toLocaleString('th-TH')}
                  </div>
                </div>
              </div>

              {/* Day Breakdown list */}
              <div>
                <div className="font-bold text-slate-800 mb-1.5">
                  ตารางคำนวณชั่วโมงแยกรายวัน:
                </div>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {viewRecord.dayBreakdown.map((d) => (
                    <div
                      key={d.date}
                      className={`p-2.5 flex items-center justify-between ${
                        d.isWeekend || d.isHoliday ? 'bg-slate-50 text-slate-400' : 'bg-white'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-slate-900">
                          {formatDateThai(d.date)} ({d.dayOfWeek})
                        </div>
                        <div className="text-[10px] text-slate-500">{d.note}</div>
                      </div>
                      <div className="font-bold text-blue-700">{d.hours} ชม.</div>
                    </div>
                  ))}
                </div>
              </div>

              {viewRecord.status === 'CANCELLED' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                  <div className="font-bold">รายการนี้ถูกยกเลิกแล้ว</div>
                  <div className="text-[11px] mt-0.5">
                    เหตุผล: {viewRecord.cancelReason || '-'} • เมื่อ:{' '}
                    {viewRecord.cancelledAt
                      ? new Date(viewRecord.cancelledAt).toLocaleString('th-TH')
                      : '-'}
                  </div>
                </div>
              )}

              <div className="text-right pt-2">
                <button
                  onClick={() => setViewRecord(null)}
                  className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cancel Confirmation */}
      {cancelModalRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-rose-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-300" />
                <h4 className="text-sm font-bold">ยืนยันการยกเลิกรายการลา</h4>
              </div>
              <button
                onClick={() => setCancelModalRecord(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {cancelSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-medium">
                  {cancelSuccess}
                </div>
              )}

              {cancelError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-medium">
                  {cancelError}
                </div>
              )}

              <p className="text-slate-600 leading-relaxed">
                คุณต้องการยกเลิกรายการลา{' '}
                <strong className="text-slate-900">[{cancelModalRecord.recordCode}]</strong> ของ{' '}
                <strong className="text-slate-900">{cancelModalRecord.employeeName}</strong>{' '}
                ใช่หรือไม่?
              </p>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
                <div className="font-bold">ระบบจะคืนสิทธิให้อัตโนมัติ:</div>
                <div className="mt-1">
                  • คืนสิทธิ {cancelModalRecord.leaveTypeName}:{' '}
                  <strong className="text-blue-700">+{cancelModalRecord.totalHours} ชั่วโมง</strong>
                </div>
                <div>• ประวัติจะเปลี่ยนสถานะเป็น "ยกเลิกแล้ว" พร้อมบันทึกใน Audit Log</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ระบุเหตุผลในการยกเลิก <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="เช่น ยกเลิกแผนการเดินทาง, เปลี่ยนวันลา"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-hidden"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalRecord(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={!cancelReason.trim() || !!cancelSuccess}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ยืนยันยกเลิกและคืนสิทธิ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
