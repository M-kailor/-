/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'ADMIN' | 'EMPLOYEE';

export interface Employee {
  id: string; // e.g., 'EMP001'
  employeeCode: string;
  name: string;
  email: string;
  department: string;
  position: string;
  startDate: string; // YYYY-MM-DD
  status: 'ACTIVE' | 'RESIGNED' | 'PROBATION';
  role: UserRole;
  phone?: string;
}

export interface LeaveType {
  id: string;
  code: string; // 'ANNUAL', 'BUSINESS', 'SICK', etc.
  name: string; // 'พักร้อน', 'กิจธุระ', 'ลาป่วย'
  minUnitHours: number; // 4, 0.5, 4, etc.
  description?: string;
  color: string; // e.g. '#2563eb'
  isActive: boolean;
  order: number;
}

export interface LeaveEntitlement {
  id: string; // `${employeeId}_${leaveYear}_${leaveTypeId}`
  employeeId: string;
  leaveYear: number; // e.g., 2027 (Nov 1, 2026 - Oct 31, 2027)
  leaveTypeId: string;
  totalHours: number; // e.g., 80
  usedHours: number; // e.g., 24
  remainingHours: number; // e.g., 56
  updatedAt: string;
}

export type LeaveStatus = 'COMPLETED' | 'CANCELLED';

export interface DayBreakdown {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // 'จันทร์', 'อังคาร', etc.
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  hours: number;
  note: string;
}

export interface LeaveRecord {
  id: string;
  recordCode: string; // e.g. 'LV-2027-001'
  employeeId: string;
  employeeName: string;
  department: string;
  leaveTypeId: string;
  leaveTypeName: string;
  leaveYear: number;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm e.g. '08:30'
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:mm e.g. '17:30'
  totalHours: number;
  equivalentDays: number; // totalHours / 8
  reason: string;
  status: LeaveStatus;
  createdAt: string; // ISO
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
  dayBreakdown: DayBreakdown[];
}

export interface Holiday {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  description?: string;
  year: number; // Calendar year
  isCompanySpecific?: boolean;
}

export interface WorkingCalendarConfig {
  id: string;
  standardHoursPerDay: number; // 8
  workDays: number[]; // [1, 2, 3, 4, 5] (Monday=1, Sunday=0 or 7)
  defaultStartTime: string; // '08:30'
  defaultEndTime: string; // '17:30'
  lunchBreakHours: number; // 1
  leaveYearStartMonth: number; // 11 (November)
  leaveYearStartDay: number; // 1
  leaveYearEndMonth: number; // 10 (October)
  leaveYearEndDay: number; // 31
}

export interface AuditLog {
  id: string;
  timestamp: string; // ISO
  action: 'CREATE' | 'UPDATE' | 'CANCEL' | 'INIT_ENTITLEMENT' | 'SYSTEM_RESET';
  entity: 'LEAVE_RECORD' | 'EMPLOYEE' | 'ENTITLEMENT' | 'HOLIDAY' | 'LEAVE_TYPE';
  entityId: string;
  performedBy: string;
  performedByName: string;
  details: string;
  previousData?: unknown;
  newData?: unknown;
}

export interface LeaveCalculationResult {
  isValid: boolean;
  errorMessage?: string;
  warningMessage?: string;
  leaveYear: number;
  totalWorkingHours: number;
  equivalentDays: number;
  dayBreakdown: DayBreakdown[];
  crossesLeaveYear: boolean;
}
