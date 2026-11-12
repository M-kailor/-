/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Info,
  CalendarCheck,
  Building,
  User,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../context/DatabaseContext';
import { calculateLeave, formatDateThai, getLeaveYear } from '../../services/calculationEngine';

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialEmployeeId?: string;
}

export const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialEmployeeId,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const {
    employees,
    leaveTypes,
    entitlements,
    holidays,
    createLeaveRecord,
  } = useDatabase();

  // Employee Selection (Admin can choose for anyone, Employee records for self)
  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    initialEmployeeId || (isAdmin ? 'EMP_A' : currentUser.id)
  );

  // Leave Type
  const activeLeaveTypes = leaveTypes.filter((lt) => lt.isActive);
  const [selectedTypeId, setSelectedTypeId] = useState<string>(
    activeLeaveTypes[0]?.id || 'LT_ANNUAL'
  );

  // Dates & Times
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [startTime, setStartTime] = useState<string>('08:30');
  const [endTime, setEndTime] = useState<string>('17:30');

  // Single Day Partial Hours (e.g. 0.5, 1, 2, 4, 8)
  const [durationPreset, setDurationPreset] = useState<'FULL' | 'MORNING' | 'AFTERNOON' | 'CUSTOM'>('FULL');
  const [customHours, setCustomHours] = useState<number>(4);

  // Reason
  const [reason, setReason] = useState<string>('');

  // Status / Feedback
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setSelectedEmpId(initialEmployeeId || (isAdmin ? 'EMP_A' : currentUser.id));
      setSubmissionError(null);
      setSubmissionSuccess(null);
    }
  }, [isOpen, initialEmployeeId, isAdmin, currentUser.id]);

  if (!isOpen) return null;

  const currentEmployee = employees.find((e) => e.id === selectedEmpId) || currentUser;
  const currentLeaveType = leaveTypes.find((lt) => lt.id === selectedTypeId) || activeLeaveTypes[0];

  const isSingleDay = startDate === endDate;

  // Determine hours for single day based on preset
  let effectiveCustomHours: number | undefined = undefined;
  if (isSingleDay) {
    if (durationPreset === 'FULL') {
      effectiveCustomHours = 8;
    } else if (durationPreset === 'MORNING') {
      effectiveCustomHours = 4;
    } else if (durationPreset === 'AFTERNOON') {
      effectiveCustomHours = 4;
    } else {
      effectiveCustomHours = customHours;
    }
  }

  // Real-time calculation engine preview
  const calcResult = calculateLeave({
    startDate,
    startTime,
    endDate,
    endTime,
    leaveType: currentLeaveType,
    holidays,
    customHours: effectiveCustomHours,
  });

  // Fetch current entitlement
  const leaveYear = calcResult.leaveYear || getLeaveYear(startDate);
  const entitlement = entitlements.find(
    (e) =>
      e.employeeId === currentEmployee.id &&
      e.leaveYear === leaveYear &&
      e.leaveTypeId === currentLeaveType.id
  );

  const totalEntitlement = entitlement?.totalHours || 0;
  const remainingBefore = entitlement?.remainingHours ?? 0;
  const hoursToDeduct = calcResult.isValid ? calcResult.totalWorkingHours : 0;
  const remainingAfter = remainingBefore - hoursToDeduct;
  const hasEnoughBalance = remainingAfter >= 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    if (!calcResult.isValid) {
      setSubmissionError(calcResult.errorMessage || 'ข้อมูลการลาไม่ถูกต้อง');
      return;
    }

    if (!hasEnoughBalance) {
      setSubmissionError(
        `สิทธิวันลาไม่เพียงพอ! คงเหลือ ${remainingBefore} ชั่วโมง แต่ต้องการลา ${hoursToDeduct} ชั่วโมง`
      );
      return;
    }

    const res = createLeaveRecord({
      employeeId: currentEmployee.id,
      leaveTypeId: currentLeaveType.id,
      startDate,
      startTime,
      endDate,
      endTime,
      reason: reason.trim() || 'ไม่ได้ระบุเหตุผล',
      customHours: effectiveCustomHours,
    });

    if (res.success && res.record) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });
      setSubmissionSuccess(
        `บันทึกสำเร็จ! รหัสรายการ ${res.record.recordCode} (ตัดสิทธิ ${res.record.totalHours} ชม. เรียบร้อยแล้ว)`
      );
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1400);
    } else {
      setSubmissionError(res.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">บันทึกคำขอวันลา (Leave Request)</h3>
              <p className="text-xs text-slate-300">
                ระบบคำนวณและตัดสิทธิวันลาทันที • ไม่ต้องรอการอนุมัติ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Success Banner */}
          {submissionSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-medium">{submissionSuccess}</span>
            </div>
          )}

          {/* Error Banner */}
          {submissionError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{submissionError}</span>
            </div>
          )}

          {/* Employee & Department info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
                <User className="w-3.5 h-3.5 mr-1 text-blue-700" /> พนักงานที่ขอลา
              </label>
              {isAdmin ? (
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeCode}) - {emp.department}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                  {currentEmployee.name} ({currentEmployee.employeeCode})
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
                <Building className="w-3.5 h-3.5 mr-1 text-blue-700" /> แผนก / ตำแหน่ง
              </label>
              <div className="text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 truncate">
                {currentEmployee.department} • {currentEmployee.position}
              </div>
            </div>
          </div>

          {/* Leave Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ประเภทการลา (Leave Type) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {activeLeaveTypes.map((lt) => {
                const isSelected = lt.id === selectedTypeId;
                return (
                  <button
                    type="button"
                    key={lt.id}
                    onClick={() => setSelectedTypeId(lt.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: lt.color }}
                      />
                      <span className="text-xs font-bold text-slate-900 truncate">{lt.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      ขั้นต่ำ: {lt.minUnitHours} ชม.
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วันที่เริ่มลา (Start Date) <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) setEndDate(e.target.value);
                }}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วันที่สิ้นสุด (End Date) <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          {/* Duration Presets for Single Day */}
          {isSingleDay ? (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                ระยะเวลาการลาสำหรับ 1 วัน ({formatDateThai(startDate)})
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDurationPreset('FULL');
                    setStartTime('08:30');
                    setEndTime('17:30');
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center cursor-pointer transition-colors ${
                    durationPreset === 'FULL'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  เต็มวัน (8 ชม.)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDurationPreset('MORNING');
                    setStartTime('08:30');
                    setEndTime('12:30');
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center cursor-pointer transition-colors ${
                    durationPreset === 'MORNING'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  เช้า (4 ชม.)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDurationPreset('AFTERNOON');
                    setStartTime('13:30');
                    setEndTime('17:30');
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center cursor-pointer transition-colors ${
                    durationPreset === 'AFTERNOON'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  บ่าย (4 ชม.)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDurationPreset('CUSTOM');
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center cursor-pointer transition-colors ${
                    durationPreset === 'CUSTOM'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  กำหนดชม. เอง
                </button>
              </div>

              {durationPreset === 'CUSTOM' && (
                <div className="pt-2 flex items-center space-x-3">
                  <div className="flex-1">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      ระบุจำนวนชั่วโมง (ต้องเป็นเท่าของ {currentLeaveType.minUnitHours} ชม.)
                    </label>
                    <input
                      type="number"
                      step={currentLeaveType.minUnitHours}
                      min={currentLeaveType.minUnitHours}
                      max={8}
                      value={customHours}
                      onChange={(e) => setCustomHours(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-blue-900 focus:outline-hidden"
                    />
                  </div>
                  <div className="flex-1 text-[11px] text-slate-500 pt-3">
                    = {(customHours / 8).toFixed(4)} วันทำงาน
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-center space-x-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                การลาหลายวันติดต่อกัน: ระบบจะคำนวณวันละ 8 ชั่วโมงเฉพาะวันทำงานปกติ และตัดวันหยุดเสาร์-อาทิตย์ รวมถึงวันหยุดบริษัทออกอัตโนมัติ
              </span>
            </div>
          )}

          {/* Reason Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              เหตุผลการลา (Reason)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="เช่น ติดต่อหน่วยงานราชการ, มีนัดแพทย์, พักผ่อนประจำปี"
              className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Live Calculation Preview Card */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
              <span className="font-semibold text-slate-300">ผลการคำนวณโดย Calculation Engine</span>
              <span className="text-[11px] text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-800">
                รอบปีวันลา {leaveYear}
              </span>
            </div>

            {calcResult.isValid ? (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-slate-800/80 rounded-lg">
                  <div className="text-[10px] text-slate-400">ชั่วโมงที่ลา</div>
                  <div className="text-lg font-extrabold text-blue-400">
                    {calcResult.totalWorkingHours}{' '}
                    <span className="text-xs font-normal text-slate-300">ชม.</span>
                  </div>
                </div>

                <div className="p-2 bg-slate-800/80 rounded-lg">
                  <div className="text-[10px] text-slate-400">วันเทียบเท่า</div>
                  <div className="text-lg font-extrabold text-amber-400">
                    {calcResult.equivalentDays.toFixed(2)}{' '}
                    <span className="text-xs font-normal text-slate-300">วัน</span>
                  </div>
                </div>

                <div className="p-2 bg-slate-800/80 rounded-lg">
                  <div className="text-[10px] text-slate-400">คงเหลือหลังลา</div>
                  <div
                    className={`text-lg font-extrabold ${
                      remainingAfter >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {remainingAfter}{' '}
                    <span className="text-xs font-normal text-slate-300">ชม.</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-rose-950/60 border border-rose-800/60 rounded-lg text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{calcResult.errorMessage}</span>
              </div>
            )}

            {/* Entitlement Summary Bar */}
            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-300 border-t border-slate-800/60">
              <div>
                สิทธิเดิม: <span className="font-semibold text-white">{remainingBefore}</span> / {totalEntitlement} ชม.
              </div>
              <div className="flex items-center space-x-1">
                <span>หัก {hoursToDeduct} ชม.</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span
                  className={`font-bold ${
                    remainingAfter >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  เหลือ {remainingAfter} ชม.
                </span>
              </div>
            </div>
          </div>

          {/* Day-by-Day Breakdown for Multi-day */}
          {calcResult.dayBreakdown.length > 1 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 flex justify-between">
                <span>รายละเอียดการตัดสิทธิแยกรายวัน</span>
                <span className="text-[10px] text-slate-500">
                  {calcResult.dayBreakdown.length} วัน
                </span>
              </div>
              <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 text-xs">
                {calcResult.dayBreakdown.map((day) => (
                  <div
                    key={day.date}
                    className={`px-3 py-1.5 flex items-center justify-between ${
                      day.isWeekend || day.isHoliday ? 'bg-slate-50 text-slate-400' : 'bg-white text-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{formatDateThai(day.date)}</span>
                      <span className="text-[11px]">({day.dayOfWeek})</span>
                      <span className="text-[10px] text-slate-400 italic">• {day.note}</span>
                    </div>
                    <span
                      className={`font-bold ${
                        day.hours > 0 ? 'text-blue-700' : 'text-slate-400'
                      }`}
                    >
                      {day.hours} ชม.
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={!calcResult.isValid || !hasEnoughBalance || !!submissionSuccess}
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ยืนยันบันทึกและตัดสิทธิทันที</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
