/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Employee, UserRole } from '../types';
import { dbService, subscribeToDB } from '../services/db';

interface AuthContextType {
  currentUser: Employee;
  role: UserRole;
  isAdmin: boolean;
  switchUser: (employeeId: string) => void;
  availableUsers: Employee[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>(() => dbService.getEmployees());
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    // Default to HR Admin so the user can immediately explore full capabilities
    return localStorage.getItem('lms_current_user_id') || 'EMP_ADMIN';
  });

  useEffect(() => {
    const unsub = subscribeToDB(() => {
      const list = dbService.getEmployees();
      setEmployees(list);
    });
    return unsub;
  }, []);

  const currentUser =
    employees.find((e) => e.id === currentUserId) ||
    employees[0] || {
      id: 'EMP_ADMIN',
      employeeCode: 'ADM001',
      name: 'ผู้ดูแลระบบ (HR Admin)',
      email: 'admin@company.co.th',
      department: 'HR',
      position: 'HR Admin',
      startDate: '2023-01-01',
      status: 'ACTIVE',
      role: 'ADMIN',
    };

  const switchUser = (id: string) => {
    setCurrentUserId(id);
    localStorage.setItem('lms_current_user_id', id);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser.role,
        isAdmin: currentUser.role === 'ADMIN',
        switchUser,
        availableUsers: employees,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
