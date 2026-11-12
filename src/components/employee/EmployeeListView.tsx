/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Edit,
  Eye,
  Award,
  CheckCircle2,
  Building,
  Briefcase,
  Calendar,
  Phone,
  Mail,
  Shield,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../context/DatabaseContext';
import { Employee, UserRole } from '../../types';
import { formatDateThai } from '../../services/calculationEngine';

interface EmployeeListViewProps {
  onOpenEntitlements?: (empId: string) => void;
  onOpenLeaveModalFor?: (empId: string) => void;
}

export const EmployeeListView: React.FC<EmployeeListViewProps> = ({
  onOpenEntitlements,
  onOpenLeaveModalFor,
}) => {
  const { employees, saveEmployee, entitlements, leaveRecords, selectedYear } = useDatabase();
  const { isAdmin } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    employeeCode: '',
    name: '',
    email: '',
    department: 'Information Technology',
    position: '',
    startDate: new Date().toISOString().slice(0, 10),
    status: 'ACTIVE' as Employee['status'],
    role: 'EMPLOYEE' as UserRole,
    phone: '',
  });

  // Individual Balance Drawer Modal
  const [balanceDrawerEmp, setBalanceDrawerEmp] = useState<Employee | null>(null);

  const departments = Array.from(new Set(employees.map((e) => e.department))).filter(Boolean);

  const filteredEmployees = employees.filter((emp) => {
    if (filterDept !== 'ALL' && emp.department !== filterDept) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const mCode = emp.employeeCode.toLowerCase().includes(q);
      const mName = emp.name.toLowerCase().includes(q);
      const mDept = emp.department.toLowerCase().includes(q);
      const mPos = emp.position.toLowerCase().includes(q);
      if (!mCode && !mName && !mDept && !mPos) return false;
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingEmp(null);
    const nextCode = `EMP${String(employees.length + 1).padStart(3, '0')}`;
    setFormData({
      employeeCode: nextCode,
      name: '',
      email: '',
      department: 'Information Technology',
      position: '',
      startDate: new Date().toISOString().slice(0, 10),
      status: 'ACTIVE',
      role: 'EMPLOYEE',
      phone: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmp(emp);
    setFormData({
      employeeCode: emp.employeeCode,
      name: emp.name,
      email: emp.email,
      department: emp.department,
      position: emp.position,
      startDate: emp.startDate,
      status: emp.status,
      role: emp.role,
      phone: emp.phone || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.employeeCode.trim()) return;

    const empToSave: Employee = {
      id: editingEmp ? editingEmp.id : `EMP_${Date.now()}`,
      employeeCode: formData.employeeCode.trim(),
      name: formData.name.trim(),
      email: formData.email.trim(),
      department: formData.department.trim(),
      position: formData.position.trim(),
      startDate: formData.startDate,
      status: formData.status,
      role: formData.role,
      phone: formData.phone.trim(),
    };

    saveEmployee(empToSave);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            4. ข้อมูลพนักงาน (Employee Management)
          </h2>
          <p className="text-xs text-slate-500">
            จัดการรายชื่อพนักงาน แผนก ตำแหน่ง และสิทธิวันลารายบุคคล
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            <span>+ เพิ่มพนักงานใหม่</span>
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="ค้นหารหัสพนักงาน, ชื่อ-นามสกุล, ตำแหน่ง..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
          <span className="text-slate-500 font-medium">แผนก:</span>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="bg-transparent font-medium text-slate-800 focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">ทุกแผนก ({departments.length})</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((emp) => {
          const empEnts = entitlements.filter(
            (e) => e.employeeId === emp.id && e.leaveYear === selectedYear
          );
          const totalEnt = empEnts.reduce((sum, e) => sum + e.totalHours, 0);
          const usedEnt = empEnts.reduce((sum, e) => sum + e.usedHours, 0);
          const remainingEnt = Math.max(0, totalEnt - usedEnt);

          return (
            <div
              key={emp.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                        emp.role === 'ADMIN' ? 'bg-indigo-600' : 'bg-blue-600'
                      }`}
                    >
                      {emp.name.slice(0, 1)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{emp.name}</h3>
                      <div className="text-[11px] text-blue-700 font-semibold">
                        {emp.employeeCode}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      emp.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {emp.status === 'ACTIVE' ? 'ปฏิบัติงาน' : emp.status}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center space-x-2">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{emp.department}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{emp.position}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>เริ่มงาน: {formatDateThai(emp.startDate)}</span>
                  </div>
                </div>

                {/* Entitlement Summary Bar for this Employee */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-500 font-medium">สิทธิคงเหลือปี {selectedYear}:</span>
                    <span className="font-extrabold text-emerald-700">{remainingEnt} ชม.</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>ใช้ไป {usedEnt} ชม.</span>
                    <span>สิทธิทั้งหมด {totalEnt} ชม.</span>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => setBalanceDrawerEmp(emp)}
                  className="inline-flex items-center text-blue-700 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  <span>ดูยอดสิทธิ</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => handleOpenEdit(emp)}
                    className="inline-flex items-center text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 mr-1" />
                    <span>แก้ไข</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Individual Balance Modal */}
      {balanceDrawerEmp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold">
                  สิทธิและประวัติวันลา: {balanceDrawerEmp.name}
                </h4>
                <p className="text-xs text-slate-300">
                  {balanceDrawerEmp.employeeCode} • {balanceDrawerEmp.department}
                </p>
              </div>
              <button
                onClick={() => setBalanceDrawerEmp(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="font-bold text-slate-800">
                สิทธิวันลาประจำปี {selectedYear}:
              </div>
              <div className="space-y-2">
                {entitlements
                  .filter(
                    (e) =>
                      e.employeeId === balanceDrawerEmp.id && e.leaveYear === selectedYear
                  )
                  .map((ent) => {
                    const pct =
                      ent.totalHours > 0 ? (ent.usedHours / ent.totalHours) * 100 : 0;
                    return (
                      <div
                        key={ent.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            {ent.leaveTypeId.replace('LT_', '')}
                          </span>
                          <span className="font-bold text-emerald-700">
                            คงเหลือ {ent.remainingHours} ชม.
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>ใช้ไป {ent.usedHours} ชม.</span>
                          <span>สิทธิทั้งหมด {ent.totalHours} ชม.</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="text-right pt-2">
                <button
                  onClick={() => setBalanceDrawerEmp(null)}
                  className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h4 className="text-sm font-bold">
                {editingEmp ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    รหัสพนักงาน <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    บทบาทผู้ใช้ (Role)
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as UserRole })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden"
                  >
                    <option value="EMPLOYEE">พนักงาน (Employee)</option>
                    <option value="ADMIN">ผู้ดูแลระบบ (Admin)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น สมชาย ใจดี"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">แผนก</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ตำแหน่ง</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">อีเมล</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">วันที่เริ่มงาน</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">สถานะ</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as Employee['status'],
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden"
                  >
                    <option value="ACTIVE">ACTIVE (ปฏิบัติงาน)</option>
                    <option value="PROBATION">PROBATION (ทดลองงาน)</option>
                    <option value="RESIGNED">RESIGNED (ลาออก)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
