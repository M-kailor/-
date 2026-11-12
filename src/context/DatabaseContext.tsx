/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AuditLog,
  Employee,
  Holiday,
  LeaveEntitlement,
  LeaveRecord,
  LeaveType,
} from '../types';
import { dbService, subscribeToDB } from '../services/db';
import { getLeaveYear } from '../services/calculationEngine';
import { useAuth } from './AuthContext';

interface DatabaseContextType {
  employees: Employee[];
  leaveTypes: LeaveType[];
  entitlements: LeaveEntitlement[];
  leaveRecords: LeaveRecord[];
  holidays: Holiday[];
  auditLogs: AuditLog[];
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  availableYears: number[];

  // Actions
  createLeaveRecord: (params: {
    employeeId: string;
    leaveTypeId: string;
    startDate: string;
    startTime?: string;
    endDate: string;
    endTime?: string;
    reason: string;
    customHours?: number;
  }) => { success: boolean; record?: LeaveRecord; error?: string };

  cancelLeaveRecord: (recordId: string, reason: string) => { success: boolean; error?: string };
  saveEmployee: (emp: Employee) => void;
  deleteEmployee: (id: string) => { success: boolean; error?: string };
  saveLeaveType: (lt: LeaveType) => void;
  setEntitlement: (employeeId: string, year: number, typeId: string, totalHours: number) => void;
  saveHoliday: (h: Holiday) => void;
  deleteHoliday: (id: string) => void;
  resetDatabase: (useDemo?: boolean) => void;
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (json: string) => { success: boolean; error?: string };
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [employees, setEmployees] = useState<Employee[]>(() => dbService.getEmployees());
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>(() => dbService.getLeaveTypes());
  const [entitlements, setEntitlements] = useState<LeaveEntitlement[]>(() => dbService.getEntitlements());
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>(() => dbService.getLeaveRecords());
  const [holidays, setHolidays] = useState<Holiday[]>(() => dbService.getHolidays());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => dbService.getAuditLogs());

  // Default to 2027 based on current local date Nov 2026 -> Leave Year 2027
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return getLeaveYear(new Date().toISOString().slice(0, 10));
  });

  const refreshAll = () => {
    setEmployees(dbService.getEmployees());
    setLeaveTypes(dbService.getLeaveTypes());
    setEntitlements(dbService.getEntitlements());
    setLeaveRecords(dbService.getLeaveRecords());
    setHolidays(dbService.getHolidays());
    setAuditLogs(dbService.getAuditLogs());
  };

  useEffect(() => {
    const unsub = subscribeToDB(refreshAll);
    return unsub;
  }, []);

  // Compute list of available leave years in system
  const availableYears = Array.from(
    new Set([
      ...entitlements.map((e) => e.leaveYear),
      ...leaveRecords.map((r) => r.leaveYear),
      2026,
      2027,
      2028,
    ])
  ).sort((a, b) => b - a);

  const createLeaveRecord = (params: {
    employeeId: string;
    leaveTypeId: string;
    startDate: string;
    startTime?: string;
    endDate: string;
    endTime?: string;
    reason: string;
    customHours?: number;
  }) => {
    return dbService.createLeaveRecord(params, currentUser.id, currentUser.name);
  };

  const cancelLeaveRecord = (recordId: string, reason: string) => {
    return dbService.cancelLeaveRecord(recordId, reason, currentUser.id, currentUser.name);
  };

  const saveEmployee = (emp: Employee) => {
    dbService.saveEmployee(emp, currentUser.id, currentUser.name);
  };

  const deleteEmployee = (id: string) => {
    return dbService.deleteEmployee(id, currentUser.id, currentUser.name);
  };

  const saveLeaveType = (lt: LeaveType) => {
    dbService.saveLeaveType(lt, currentUser.id, currentUser.name);
  };

  const setEntitlement = (employeeId: string, year: number, typeId: string, totalHours: number) => {
    dbService.setEntitlement(employeeId, year, typeId, totalHours, currentUser.id, currentUser.name);
  };

  const saveHoliday = (h: Holiday) => {
    dbService.saveHoliday(h, currentUser.id, currentUser.name);
  };

  const deleteHoliday = (id: string) => {
    dbService.deleteHoliday(id, currentUser.id, currentUser.name);
  };

  const resetDatabase = (useDemo = true) => {
    dbService.resetDatabase(useDemo);
  };

  const exportDatabaseJSON = () => {
    return dbService.exportDatabaseJSON();
  };

  const importDatabaseJSON = (json: string) => {
    return dbService.importDatabaseJSON(json);
  };

  return (
    <DatabaseContext.Provider
      value={{
        employees,
        leaveTypes,
        entitlements,
        leaveRecords,
        holidays,
        auditLogs,
        selectedYear,
        setSelectedYear,
        availableYears,
        createLeaveRecord,
        cancelLeaveRecord,
        saveEmployee,
        deleteEmployee,
        saveLeaveType,
        setEntitlement,
        saveHoliday,
        deleteHoliday,
        resetDatabase,
        exportDatabaseJSON,
        importDatabaseJSON,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
