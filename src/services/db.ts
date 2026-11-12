/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AuditLog,
  Employee,
  Holiday,
  LeaveEntitlement,
  LeaveRecord,
  LeaveType,
} from '../types';
import { calculateLeave, checkOverlappingLeave, getLeaveYear } from './calculationEngine';
import {
  INITIAL_EMPLOYEES,
  INITIAL_ENTITLEMENTS_2027,
  INITIAL_HOLIDAYS,
  INITIAL_LEAVE_RECORDS,
  INITIAL_LEAVE_TYPES,
} from './seedData';

const DB_KEYS = {
  EMPLOYEES: 'lms_employees_v1',
  LEAVE_TYPES: 'lms_leave_types_v1',
  ENTITLEMENTS: 'lms_entitlements_v1',
  LEAVE_RECORDS: 'lms_leave_records_v1',
  HOLIDAYS: 'lms_holidays_v1',
  AUDIT_LOGS: 'lms_audit_logs_v1',
  INITIALIZED: 'lms_initialized_v1',
};

type DBChangeCallback = () => void;
const listeners: Set<DBChangeCallback> = new Set();

export function subscribeToDB(callback: DBChangeCallback): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function notifyListeners() {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error('Error notifying DB subscriber:', e);
    }
  });
}

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Failed to parse ${key} from storage:`, e);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to write ${key} to storage:`, e);
  }
}

/**
 * Initialize Database with Seed Data if empty
 */
export function initDatabase(forceReset = false): void {
  const isInit = localStorage.getItem(DB_KEYS.INITIALIZED);
  if (!isInit || forceReset) {
    setItem(DB_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    setItem(DB_KEYS.LEAVE_TYPES, INITIAL_LEAVE_TYPES);
    setItem(DB_KEYS.ENTITLEMENTS, INITIAL_ENTITLEMENTS_2027);
    setItem(DB_KEYS.LEAVE_RECORDS, INITIAL_LEAVE_RECORDS);
    setItem(DB_KEYS.HOLIDAYS, INITIAL_HOLIDAYS);

    const initialAudit: AuditLog[] = [
      {
        id: 'AUDIT_INIT',
        timestamp: new Date().toISOString(),
        action: 'SYSTEM_RESET',
        entity: 'LEAVE_RECORD',
        entityId: 'SYSTEM',
        performedBy: 'ADM001',
        performedByName: 'ระบบ (System Auto-Seed)',
        details: 'เริ่มต้นระบบและติดตั้งชุดข้อมูลตัวอย่างมาตรฐาน (Initial Corporate Seed Data)',
      },
    ];
    setItem(DB_KEYS.AUDIT_LOGS, initialAudit);
    localStorage.setItem(DB_KEYS.INITIALIZED, 'true');
    notifyListeners();
  }
}

// Ensure database is initialized at startup
initDatabase();

export const dbService = {
  // ---------------- EMPLOYEES ----------------
  getEmployees(): Employee[] {
    return getItem<Employee[]>(DB_KEYS.EMPLOYEES, []);
  },

  getEmployeeById(id: string): Employee | undefined {
    return this.getEmployees().find((e) => e.id === id);
  },

  saveEmployee(employee: Employee, performerId: string, performerName: string): Employee {
    const list = this.getEmployees();
    const existingIndex = list.findIndex((e) => e.id === employee.id);
    let isNew = false;
    let oldData: Employee | undefined;

    if (existingIndex >= 0) {
      oldData = list[existingIndex];
      list[existingIndex] = { ...employee };
    } else {
      isNew = true;
      list.push(employee);
    }

    setItem(DB_KEYS.EMPLOYEES, list);

    this.addAuditLog({
      action: isNew ? 'CREATE' : 'UPDATE',
      entity: 'EMPLOYEE',
      entityId: employee.id,
      performedBy: performerId,
      performedByName: performerName,
      details: isNew
        ? `เพิ่มพนักงานใหม่: ${employee.name} (${employee.employeeCode}) แผนก ${employee.department}`
        : `แก้ไขข้อมูลพนักงาน: ${employee.name} (${employee.employeeCode})`,
      previousData: oldData,
      newData: employee,
    });

    notifyListeners();
    return employee;
  },

  // ---------------- LEAVE TYPES ----------------
  getLeaveTypes(onlyActive = false): LeaveType[] {
    const list = getItem<LeaveType[]>(DB_KEYS.LEAVE_TYPES, []);
    return onlyActive ? list.filter((lt) => lt.isActive) : list;
  },

  getLeaveTypeById(id: string): LeaveType | undefined {
    return this.getLeaveTypes().find((lt) => lt.id === id);
  },

  saveLeaveType(leaveType: LeaveType, performerId: string, performerName: string): LeaveType {
    const list = this.getLeaveTypes();
    const idx = list.findIndex((lt) => lt.id === leaveType.id);
    let isNew = false;
    let oldData: LeaveType | undefined;

    if (idx >= 0) {
      oldData = list[idx];
      list[idx] = { ...leaveType };
    } else {
      isNew = true;
      list.push(leaveType);
    }

    setItem(DB_KEYS.LEAVE_TYPES, list);

    this.addAuditLog({
      action: isNew ? 'CREATE' : 'UPDATE',
      entity: 'LEAVE_TYPE',
      entityId: leaveType.id,
      performedBy: performerId,
      performedByName: performerName,
      details: isNew
        ? `เพิ่มประเภทการลาใหม่: ${leaveType.name} (หน่วยขั้นต่ำ ${leaveType.minUnitHours} ชม.)`
        : `แก้ไขประเภทการลา: ${leaveType.name}`,
      previousData: oldData,
      newData: leaveType,
    });

    notifyListeners();
    return leaveType;
  },

  // ---------------- HOLIDAYS ----------------
  getHolidays(year?: number): Holiday[] {
    const list = getItem<Holiday[]>(DB_KEYS.HOLIDAYS, []);
    return year ? list.filter((h) => h.year === year) : list;
  },

  saveHoliday(holiday: Holiday, performerId: string, performerName: string): Holiday {
    const list = this.getHolidays();
    const idx = list.findIndex((h) => h.id === holiday.id);
    let isNew = false;
    let oldData: Holiday | undefined;

    if (idx >= 0) {
      oldData = list[idx];
      list[idx] = { ...holiday };
    } else {
      isNew = true;
      list.push(holiday);
    }

    setItem(DB_KEYS.HOLIDAYS, list);

    this.addAuditLog({
      action: isNew ? 'CREATE' : 'UPDATE',
      entity: 'HOLIDAY',
      entityId: holiday.id,
      performedBy: performerId,
      performedByName: performerName,
      details: isNew
        ? `เพิ่มวันหยุดบริษัท: ${holiday.name} (${holiday.date})`
        : `แก้ไขวันหยุด: ${holiday.name} (${holiday.date})`,
      previousData: oldData,
      newData: holiday,
    });

    notifyListeners();
    return holiday;
  },

  deleteHoliday(holidayId: string, performerId: string, performerName: string): boolean {
    const list = this.getHolidays();
    const holiday = list.find((h) => h.id === holidayId);
    if (!holiday) return false;

    const filtered = list.filter((h) => h.id !== holidayId);
    setItem(DB_KEYS.HOLIDAYS, filtered);

    this.addAuditLog({
      action: 'CANCEL',
      entity: 'HOLIDAY',
      entityId: holidayId,
      performedBy: performerId,
      performedByName: performerName,
      details: `ลบวันหยุด: ${holiday.name} วันที่ ${holiday.date}`,
      previousData: holiday,
    });

    notifyListeners();
    return true;
  },

  // ---------------- ENTITLEMENTS ----------------
  getEntitlements(filter?: { employeeId?: string; leaveYear?: number }): LeaveEntitlement[] {
    let list = getItem<LeaveEntitlement[]>(DB_KEYS.ENTITLEMENTS, []);
    if (filter?.employeeId) {
      list = list.filter((e) => e.employeeId === filter.employeeId);
    }
    if (filter?.leaveYear) {
      list = list.filter((e) => e.leaveYear === filter.leaveYear);
    }
    return list;
  },

  getEntitlement(employeeId: string, leaveYear: number, leaveTypeId: string): LeaveEntitlement | undefined {
    return this.getEntitlements().find(
      (e) => e.employeeId === employeeId && e.leaveYear === leaveYear && e.leaveTypeId === leaveTypeId
    );
  },

  setEntitlement(
    employeeId: string,
    leaveYear: number,
    leaveTypeId: string,
    totalHours: number,
    performerId: string,
    performerName: string
  ): LeaveEntitlement {
    const list = this.getEntitlements();
    const id = `${employeeId}_${leaveYear}_${leaveTypeId}`;
    const idx = list.findIndex((e) => e.id === id);

    let ent: LeaveEntitlement;
    let isNew = false;
    let oldData: LeaveEntitlement | undefined;

    if (idx >= 0) {
      oldData = { ...list[idx] };
      const used = oldData.usedHours;
      ent = {
        ...oldData,
        totalHours,
        remainingHours: totalHours - used,
        updatedAt: new Date().toISOString(),
      };
      list[idx] = ent;
    } else {
      isNew = true;
      ent = {
        id,
        employeeId,
        leaveYear,
        leaveTypeId,
        totalHours,
        usedHours: 0,
        remainingHours: totalHours,
        updatedAt: new Date().toISOString(),
      };
      list.push(ent);
    }

    setItem(DB_KEYS.ENTITLEMENTS, list);

    this.addAuditLog({
      action: isNew ? 'CREATE' : 'UPDATE',
      entity: 'ENTITLEMENT',
      entityId: id,
      performedBy: performerId,
      performedByName: performerName,
      details: `กำหนดสิทธิวันลา พนักงาน ${employeeId} ปี ${leaveYear} ประเภท ${leaveTypeId}: ${totalHours} ชั่วโมง`,
      previousData: oldData,
      newData: ent,
    });

    notifyListeners();
    return ent;
  },

  // ---------------- LEAVE RECORDS (TRANSACTIONAL) ----------------
  getLeaveRecords(filter?: { employeeId?: string; leaveYear?: number; status?: string }): LeaveRecord[] {
    let list = getItem<LeaveRecord[]>(DB_KEYS.LEAVE_RECORDS, []);
    if (filter?.employeeId) {
      list = list.filter((r) => r.employeeId === filter.employeeId);
    }
    if (filter?.leaveYear) {
      list = list.filter((r) => r.leaveYear === filter.leaveYear);
    }
    if (filter?.status) {
      list = list.filter((r) => r.status === filter.status);
    }
    // Return sorted newest first
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getLeaveRecordById(id: string): LeaveRecord | undefined {
    return this.getLeaveRecords().find((r) => r.id === id);
  },

  /**
   * Transactional Leave Creation:
   * 1. Validates working days, holidays, min units, and cross-year.
   * 2. Checks overlapping leaves for the employee.
   * 3. Checks remaining entitlement balance.
   * 4. Deducts hours immediately.
   * 5. Saves record & creates audit log.
   */
  createLeaveRecord(
    params: {
      employeeId: string;
      leaveTypeId: string;
      startDate: string;
      startTime?: string;
      endDate: string;
      endTime?: string;
      reason: string;
      customHours?: number;
    },
    performerId: string,
    performerName: string
  ): { success: boolean; record?: LeaveRecord; error?: string } {
    const employee = this.getEmployeeById(params.employeeId);
    if (!employee) {
      return { success: false, error: 'ไม่พบข้อมูลพนักงานในระบบ' };
    }

    const leaveType = this.getLeaveTypeById(params.leaveTypeId);
    if (!leaveType) {
      return { success: false, error: 'ไม่พบประเภทการลาที่ระบุ' };
    }

    if (!leaveType.isActive) {
      return { success: false, error: `ประเภทการลา "${leaveType.name}" ถูกปิดการใช้งานอยู่` };
    }

    const holidays = this.getHolidays();

    // 1. Calculate leave hours and check calendar constraints
    const calc = calculateLeave({
      startDate: params.startDate,
      startTime: params.startTime,
      endDate: params.endDate,
      endTime: params.endTime,
      leaveType,
      holidays,
      customHours: params.customHours,
    });

    if (!calc.isValid) {
      return { success: false, error: calc.errorMessage };
    }

    const leaveYear = calc.leaveYear;

    // 2. Check Overlapping with active leave records
    const existingRecords = this.getLeaveRecords();
    const overlapCheck = checkOverlappingLeave(
      {
        employeeId: params.employeeId,
        startDate: params.startDate,
        endDate: params.endDate,
      },
      existingRecords
    );

    if (overlapCheck.hasOverlap && overlapCheck.overlappingRecord) {
      const o = overlapCheck.overlappingRecord;
      return {
        success: false,
        error: `พบรายการลาซ้อนทับกับช่วงเวลาเดิม: [${o.recordCode}] วันที่ ${o.startDate} ถึง ${o.endDate} (${o.leaveTypeName})`,
      };
    }

    // 3. Entitlement Balance Validation
    const entitlement = this.getEntitlement(params.employeeId, leaveYear, params.leaveTypeId);
    if (!entitlement) {
      return {
        success: false,
        error: `พนักงานยังไม่ได้รับการกำหนดสิทธิสำหรับ "${leaveType.name}" ในปีวันลา ${leaveYear}`,
      };
    }

    if (entitlement.remainingHours < calc.totalWorkingHours) {
      return {
        success: false,
        error: `สิทธิวันลาคงเหลือไม่เพียงพอ! คงเหลือเพียง ${entitlement.remainingHours} ชั่วโมง แต่ต้องการลา ${calc.totalWorkingHours} ชั่วโมง`,
      };
    }

    // 4. Atomic Deduct Entitlement
    const updatedEntitlements = this.getEntitlements().map((ent) => {
      if (ent.id === entitlement.id) {
        const newUsed = ent.usedHours + calc.totalWorkingHours;
        return {
          ...ent,
          usedHours: newUsed,
          remainingHours: ent.totalHours - newUsed,
          updatedAt: new Date().toISOString(),
        };
      }
      return ent;
    });
    setItem(DB_KEYS.ENTITLEMENTS, updatedEntitlements);

    // 5. Create Leave Record
    const recordCode = `LV-${leaveYear}-${String(existingRecords.length + 1).padStart(3, '0')}`;
    const newRecord: LeaveRecord = {
      id: `REC_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      recordCode,
      employeeId: employee.id,
      employeeName: employee.name,
      department: employee.department,
      leaveTypeId: leaveType.id,
      leaveTypeName: leaveType.name,
      leaveYear,
      startDate: params.startDate,
      startTime: params.startTime || '08:30',
      endDate: params.endDate,
      endTime: params.endTime || '17:30',
      totalHours: calc.totalWorkingHours,
      equivalentDays: calc.equivalentDays,
      reason: params.reason || '-',
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      createdBy: performerId,
      dayBreakdown: calc.dayBreakdown,
    };

    const updatedRecords = [newRecord, ...existingRecords];
    setItem(DB_KEYS.LEAVE_RECORDS, updatedRecords);

    // 6. Audit Log
    this.addAuditLog({
      action: 'CREATE',
      entity: 'LEAVE_RECORD',
      entityId: newRecord.id,
      performedBy: performerId,
      performedByName: performerName,
      details: `บันทึกวันลาสำเร็จ: ${employee.name} ลา "${leaveType.name}" ${calc.totalWorkingHours} ชม. (${params.startDate} ถึง ${params.endDate}) รหัสรายการ ${recordCode}`,
      newData: newRecord,
    });

    notifyListeners();
    return { success: true, record: newRecord };
  },

  /**
   * Transactional Cancellation:
   * 1. Check if record exists and is not already cancelled.
   * 2. Refund deducted hours back to entitlement immediately.
   * 3. Set status to CANCELLED (never hard-deleted).
   * 4. Save audit log.
   */
  cancelLeaveRecord(
    recordId: string,
    cancelReason: string,
    performerId: string,
    performerName: string
  ): { success: boolean; error?: string } {
    const records = this.getLeaveRecords();
    const recordIndex = records.findIndex((r) => r.id === recordId);
    if (recordIndex < 0) {
      return { success: false, error: 'ไม่พบรายการลาที่ต้องการยกเลิก' };
    }

    const record = records[recordIndex];
    if (record.status === 'CANCELLED') {
      return { success: false, error: 'รายการนี้ถูกยกเลิกไปแล้ว' };
    }

    // Refund hours to entitlement
    const entitlement = this.getEntitlement(record.employeeId, record.leaveYear, record.leaveTypeId);
    if (entitlement) {
      const updatedEntitlements = this.getEntitlements().map((ent) => {
        if (ent.id === entitlement.id) {
          const newUsed = Math.max(0, ent.usedHours - record.totalHours);
          return {
            ...ent,
            usedHours: newUsed,
            remainingHours: ent.totalHours - newUsed,
            updatedAt: new Date().toISOString(),
          };
        }
        return ent;
      });
      setItem(DB_KEYS.ENTITLEMENTS, updatedEntitlements);
    }

    // Mark as CANCELLED
    const cancelledRecord: LeaveRecord = {
      ...record,
      status: 'CANCELLED',
      cancelledAt: new Date().toISOString(),
      cancelledBy: performerId,
      cancelReason: cancelReason || 'ยกเลิกรายการโดยผู้ใช้',
    };
    records[recordIndex] = cancelledRecord;
    setItem(DB_KEYS.LEAVE_RECORDS, records);

    // Audit Log
    this.addAuditLog({
      action: 'CANCEL',
      entity: 'LEAVE_RECORD',
      entityId: record.id,
      performedBy: performerId,
      performedByName: performerName,
      details: `ยกเลิกรายการลา [${record.recordCode}] คืนสิทธิ ${record.totalHours} ชั่วโมง ให้แก่ ${record.employeeName}. เหตุผล: ${cancelReason}`,
      previousData: record,
      newData: cancelledRecord,
    });

    notifyListeners();
    return { success: true };
  },

  // ---------------- AUDIT LOGS ----------------
  getAuditLogs(): AuditLog[] {
    const list = getItem<AuditLog[]>(DB_KEYS.AUDIT_LOGS, []);
    return list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  },

  addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const list = this.getAuditLogs();
    const newEntry: AuditLog = {
      ...entry,
      id: `AUDIT_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    setItem(DB_KEYS.AUDIT_LOGS, [newEntry, ...list]);
  },

  // ---------------- BACKUP & EXPORT/RESTORE DB ----------------
  exportDatabaseJSON(): string {
    const dump = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      employees: this.getEmployees(),
      leaveTypes: this.getLeaveTypes(),
      entitlements: this.getEntitlements(),
      leaveRecords: this.getLeaveRecords(),
      holidays: this.getHolidays(),
      auditLogs: this.getAuditLogs(),
    };
    return JSON.stringify(dump, null, 2);
  },

  importDatabaseJSON(jsonString: string): { success: boolean; error?: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data.employees || !data.leaveTypes || !data.entitlements) {
        return { success: false, error: 'โครงสร้างไฟล์สำรองข้อมูลไม่ถูกต้อง' };
      }
      setItem(DB_KEYS.EMPLOYEES, data.employees);
      setItem(DB_KEYS.LEAVE_TYPES, data.leaveTypes);
      setItem(DB_KEYS.ENTITLEMENTS, data.entitlements);
      setItem(DB_KEYS.LEAVE_RECORDS, data.leaveRecords || []);
      setItem(DB_KEYS.HOLIDAYS, data.holidays || []);
      setItem(DB_KEYS.AUDIT_LOGS, data.auditLogs || []);
      notifyListeners();
      return { success: true };
    } catch (e) {
      return { success: false, error: `เกิดข้อผิดพลาดในการนำเข้าข้อมูล: ${String(e)}` };
    }
  },

  resetDatabase(useDemo = true): void {
    localStorage.clear();
    initDatabase(true);
    notifyListeners();
  },
};
