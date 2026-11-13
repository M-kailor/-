/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DayBreakdown, Holiday, LeaveCalculationResult, LeaveType } from '../types';

/**
 * Determine the Leave Year (ปีวันลา) from a given date string (YYYY-MM-DD).
 * Rule:
 * Leave year starts November 1 and ends October 31 of next year.
 * e.g. 2026-11-01 to 2027-10-31 is Leave Year 2027.
 * e.g. 2027-11-01 to 2028-10-31 is Leave Year 2028.
 */
export function getLeaveYear(dateString: string): number {
  if (!dateString) return new Date().getFullYear();
  const [yearStr, monthStr] = dateString.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  if (month >= 11) {
    return year + 1;
  }
  return year;
}

/**
 * Get human-readable Leave Year range string
 * e.g. "01/11/2026 - 31/10/2027"
 */
export function getLeaveYearRangeString(leaveYear: number): string {
  const startYear = leaveYear - 1;
  const endYear = leaveYear;
  return `01/11/${startYear} - 31/10/${endYear}`;
}

/**
 * Format date from YYYY-MM-DD to DD/MM/YYYY
 */
export function formatDateThai(dateString?: string): string {
  if (!dateString) return '-';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

/**
 * Parse DD/MM/YYYY to YYYY-MM-DD
 */
export function parseDateThai(dmyString: string): string {
  if (!dmyString) return '';
  const parts = dmyString.split('/');
  if (parts.length !== 3) return dmyString;
  const [d, m, y] = parts;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

/**
 * Get Thai day of week name
 */
export function getThaiDayOfWeek(date: Date): string {
  const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  return days[date.getDay()];
}

/**
 * Check if a date string is Saturday or Sunday
 */
export function isWeekend(dateString: string): boolean {
  const [y, m, d] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const day = date.getUTCDay();
  return day === 0 || day === 6; // 0=Sun, 6=Sat
}

/**
 * Check if a date string matches any registered holiday
 */
export function findHoliday(dateString: string, holidays: Holiday[]): Holiday | undefined {
  return holidays.find((h) => h.date === dateString);
}

/**
 * Generate an array of date strings (YYYY-MM-DD) inclusive between startDate and endDate
 */
export function getDateRange(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  const [sy, sm, sd] = startDateStr.split('-').map(Number);
  const [ey, em, ed] = endDateStr.split('-').map(Number);

  const current = new Date(Date.UTC(sy, sm - 1, sd, 12, 0, 0));
  const end = new Date(Date.UTC(ey, em - 1, ed, 12, 0, 0));

  while (current <= end) {
    const y = current.getUTCFullYear();
    const m = String(current.getUTCMonth() + 1).padStart(2, '0');
    const d = String(current.getUTCDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

export interface CalculationInput {
  startDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endDate: string; // YYYY-MM-DD
  endTime?: string; // HH:mm
  leaveType: LeaveType;
  holidays: Holiday[];
  customHours?: number; // Optional manual override for single-day partial hours
  customHoursByDate?: Record<string, number>; // Optional per-day override for multi-day leave
}

/**
 * Calculate leave hours, validate rules, and build day-by-day breakdown
 */
export function calculateLeave(input: CalculationInput): LeaveCalculationResult {
  const { startDate, endDate, leaveType, holidays, customHours, customHoursByDate } = input;

  if (!startDate || !endDate) {
    return {
      isValid: false,
      errorMessage: 'กรุณาระบุวันที่เริ่มต้นและสิ้นสุดการลา',
      leaveYear: getLeaveYear(startDate || new Date().toISOString().slice(0, 10)),
      totalWorkingHours: 0,
      equivalentDays: 0,
      dayBreakdown: [],
      crossesLeaveYear: false,
    };
  }

  if (startDate > endDate) {
    return {
      isValid: false,
      errorMessage: 'วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุดการลา',
      leaveYear: getLeaveYear(startDate),
      totalWorkingHours: 0,
      equivalentDays: 0,
      dayBreakdown: [],
      crossesLeaveYear: false,
    };
  }

  const startLeaveYear = getLeaveYear(startDate);
  const endLeaveYear = getLeaveYear(endDate);

  // Check 31 October cross-year boundary rule
  if (startLeaveYear !== endLeaveYear) {
    return {
      isValid: false,
      errorMessage:
        'ไม่อนุญาตให้ลาคร่อมรอบปีวันลา (31 ตุลาคม) ข้ามไปปีวันลาใหม่ กรุณาแยกบันทึกรายการลาเป็นคนละปีวันลา เพื่อตรวจสอบสิทธิของแต่ละปีแยกกัน',
      leaveYear: startLeaveYear,
      totalWorkingHours: 0,
      equivalentDays: 0,
      dayBreakdown: [],
      crossesLeaveYear: true,
    };
  }

  const dateList = getDateRange(startDate, endDate);
  const isSingleDay = dateList.length === 1;

  // Single day weekend validation
  if (isSingleDay && isWeekend(startDate)) {
    return {
      isValid: false,
      errorMessage: 'ไม่สามารถบันทึกวันลาในวันเสาร์หรือวันอาทิตย์ได้',
      leaveYear: startLeaveYear,
      totalWorkingHours: 0,
      equivalentDays: 0,
      dayBreakdown: [],
      crossesLeaveYear: false,
    };
  }

  // Single day holiday validation
  if (isSingleDay) {
    const holiday = findHoliday(startDate, holidays);
    if (holiday) {
      return {
        isValid: false,
        errorMessage: `ไม่สามารถบันทึกวันลาในวันหยุดบริษัทได้ (${holiday.name})`,
        leaveYear: startLeaveYear,
        totalWorkingHours: 0,
        equivalentDays: 0,
        dayBreakdown: [],
        crossesLeaveYear: false,
      };
    }
  }

  const dayBreakdown: DayBreakdown[] = [];
  let totalWorkingHours = 0;

  for (const dateStr of dateList) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const dayName = getThaiDayOfWeek(dateObj);
    const weekend = isWeekend(dateStr);
    const holiday = findHoliday(dateStr, holidays);

    let dayHours = 0;
    let note = 'วันทำงานปกติ';

    if (weekend) {
      dayHours = 0;
      note = 'วันหยุดสุดสัปดาห์ (ไม่นับชั่วโมงลา)';
    } else if (holiday) {
      dayHours = 0;
      note = `วันหยุดบริษัท: ${holiday.name} (ไม่นับชั่วโมงลา)`;
    } else {
      // It is a valid working day
      const perDayHours = customHoursByDate?.[dateStr];
      if (!isSingleDay && perDayHours !== undefined) {
        if (perDayHours <= 0 || perDayHours > 8) {
          return {
            isValid: false,
            errorMessage: `ชั่วโมงลาวันที่ ${formatDateThai(dateStr)} ต้องอยู่ระหว่าง ${leaveType.minUnitHours || 0.5} ถึง 8 ชั่วโมง`,
            leaveYear: startLeaveYear,
            totalWorkingHours: 0,
            equivalentDays: 0,
            dayBreakdown,
            crossesLeaveYear: false,
          };
        }
        const minUnit = leaveType.minUnitHours || 0.5;
        const dayRem = Math.round((perDayHours % minUnit) * 1000) / 1000;
        if (perDayHours < minUnit || (dayRem !== 0 && dayRem !== minUnit)) {
          return {
            isValid: false,
            errorMessage: `วันที่ ${formatDateThai(dateStr)}: "${leaveType.name}" ต้องลาขั้นต่ำ ${minUnit} ชม. และเป็นจำนวนเท่าของ ${minUnit} ชม.`,
            leaveYear: startLeaveYear,
            totalWorkingHours: 0,
            equivalentDays: 0,
            dayBreakdown,
            crossesLeaveYear: false,
          };
        }
        dayHours = perDayHours;
        if (perDayHours === 8) {
          note = 'ลางานเต็มวัน (8 ชม.)';
        } else if (perDayHours === 4) {
          note = 'ลาครึ่งวัน (4 ชม.)';
        } else {
          note = `ลาบางส่วน (${perDayHours} ชม.)`;
        }
      } else if (isSingleDay && customHours !== undefined && customHours > 0) {
        dayHours = customHours;
        note = customHours === 8 ? 'ลางานเต็มวัน (8 ชม.)' : customHours === 4 ? 'ลาครึ่งวัน (4 ชม.)' : `ลาบางส่วน (${customHours} ชม.)`;
      } else {
        dayHours = 8; // Standard 8 hours per day
        note = 'ลางานเต็มวัน (8 ชม.)';
      }
    }

    dayBreakdown.push({
      date: dateStr,
      dayOfWeek: dayName,
      isWeekend: weekend,
      isHoliday: !!holiday,
      holidayName: holiday?.name,
      hours: dayHours,
      note,
    });

    totalWorkingHours += dayHours;
  }

  // If entire range resulted in 0 working hours
  if (totalWorkingHours === 0) {
    return {
      isValid: false,
      errorMessage: 'ช่วงวันที่เลือกตรงกับวันหยุดทั้งหมด ไม่มีชั่วโมงการทำงานที่ต้องหักสิทธิวันลา',
      leaveYear: startLeaveYear,
      totalWorkingHours: 0,
      equivalentDays: 0,
      dayBreakdown,
      crossesLeaveYear: false,
    };
  }

  // Validate minimum unit and multiples constraint
  const minUnit = leaveType.minUnitHours || 0.5;
  // Use precision rounding to avoid JavaScript floating point issues (e.g. 0.5 % 0.5)
  const remainder = Math.round((totalWorkingHours % minUnit) * 1000) / 1000;

  if (totalWorkingHours < minUnit) {
    return {
      isValid: false,
      errorMessage: `ประเภทการลา "${leaveType.name}" ต้องลาขั้นต่ำอย่างน้อย ${minUnit} ชั่วโมง`,
      leaveYear: startLeaveYear,
      totalWorkingHours,
      equivalentDays: totalWorkingHours / 8,
      dayBreakdown,
      crossesLeaveYear: false,
    };
  }

  if (remainder !== 0 && remainder !== minUnit) {
    return {
      isValid: false,
      errorMessage: `ประเภทการลา "${leaveType.name}" จำนวนชั่วโมงต้องเป็นจำนวนเท่าของ ${minUnit} ชั่วโมง (จำนวนที่ระบุ: ${totalWorkingHours} ชม.)`,
      leaveYear: startLeaveYear,
      totalWorkingHours,
      equivalentDays: totalWorkingHours / 8,
      dayBreakdown,
      crossesLeaveYear: false,
    };
  }

  return {
    isValid: true,
    leaveYear: startLeaveYear,
    totalWorkingHours,
    equivalentDays: totalWorkingHours / 8,
    dayBreakdown,
    crossesLeaveYear: false,
  };
}

/**
 * Check if a new leave range overlaps with any existing completed leave record
 * for the same employee.
 */
export function checkOverlappingLeave<
  T extends {
    id: string;
    employeeId: string;
    startDate: string;
    endDate: string;
    status: string;
  }
>(
  newRecord: {
    employeeId: string;
    startDate: string;
    endDate: string;
    excludeRecordId?: string;
  },
  existingRecords: T[]
): { hasOverlap: boolean; overlappingRecord?: T } {
  const overlap = existingRecords.find((rec) => {
    if (rec.id === newRecord.excludeRecordId) return false;
    if (rec.employeeId !== newRecord.employeeId) return false;
    if (rec.status === 'CANCELLED') return false;

    // Check date interval overlap: [startA <= endB && endA >= startB]
    return newRecord.startDate <= rec.endDate && newRecord.endDate >= rec.startDate;
  });

  return {
    hasOverlap: !!overlap,
    overlappingRecord: overlap,
  };
}
