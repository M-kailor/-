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
  Trash2,
  AlertTriangle,
  CheckSquare,
  Square,
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
  const { employees, saveEmployee, deleteEmployee, entitlements, leaveRecords, selectedYear } = useDatabase();
  const { isAdmin, currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');

  // Multi-selection state
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [deleteModalData, setDeleteModalData] = useState<{ isOpen: boolean; employees: Employee[] }>({
    isOpen: false,
    employees: [],
  });
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const toggleSelectEmp = (id: string) => {
    setSelectedEmpIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedEmpIds.length === filteredEmployees.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(filteredEmployees.map((e) => e.id));
    }
  };

  const handleOpenDeleteSingle = (emp: Employee) => {
    setDeleteModalData({
      isOpen: true,
      employees: [emp],
    });
  };

  const handleOpenDeleteSelected = () => {
    const targets = employees.filter((e) => selectedEmpIds.includes(e.id));
    if (targets.length === 0) return;
    setDeleteModalData({
      isOpen: true,
      employees: targets,
    });
  };

  const confirmDeleteEmployees = () => {
    const toDelete = deleteModalData.employees;
    if (toDelete.length === 0) return;

    let successCount = 0;
    let failedNames: string[] = [];

    toDelete.forEach((emp) => {
      const res = deleteEmployee(emp.id);
      if (res.success) {
        successCount++;
      } else {
        failedNames.push(`${emp.name} (${res.error || 'ไม่สามารถลบได้'})`);
      }
    });

    // Remove deleted IDs from selection
    setSelectedEmpIds((prev) =>
      prev.filter((id) => !toDelete.some((d) => d.id === id && !failedNames.some((f) => f.includes(d.name))))
    );

    setDeleteModalData({ isOpen: false, employees: [] });

    if (failedNames.length > 0) {
      setAlertMessage({
        type: 'error',
        message: `ลบสำเร็จ ${successCount} คน, แต่ไม่สามารถลบได้ ${failedNames.length} คน: ${failedNames.join(', ')}`,
      });
    } else {
      setAlertMessage({
        type: 'success',
        message: `ลบพนักงานจำนวน ${successCount} คน ออกจากระบบสำเร็จเรียบร้อยแล้ว`,
      });
    }

    setTimeout(() => {
      setAlertMessage(null);
    }, 4000);
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

      {/* Alert Notification */}
      {alertMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center space-x-2 ${
            alertMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {alertMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{alertMessage.message}</span>
        </div>
      )}

      {/* Bulk Selection Action Bar (Sticky / Highlighted when items selected) */}
      {isAdmin && selectedEmpIds.length > 0 && (
        <div className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center space-x-3 text-xs">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              {selectedEmpIds.length}
            </span>
            <span className="font-semibold text-slate-200">
              เลือกพนักงานอยู่ {selectedEmpIds.length} คน
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => setSelectedEmpIds([])}
              className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium transition-colors cursor-pointer"
            >
              ยกเลิกการเลือก
            </button>
            <button
              onClick={handleOpenDeleteSelected}
              className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors cursor-pointer flex items-center space-x-1.5 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ลบพนักงานที่เลือก ({selectedEmpIds.length})</span>
            </button>
          </div>
        </div>
      )}

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

        <div className="flex items-center space-x-2">
          {isAdmin && (
            <button
              onClick={toggleSelectAll}
              className="flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium cursor-pointer transition-colors"
              title="เลือกทั้งหมด"
            >
              {selectedEmpIds.length === filteredEmployees.length && filteredEmployees.length > 0 ? (
                <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>
                {selectedEmpIds.length === filteredEmployees.length && filteredEmployees.length > 0
                  ? 'ยกเลิกเลือกทั้งหมด'
                  : 'เลือกทั้งหมด'}
              </span>
            </button>
          )}

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
          const isSelected = selectedEmpIds.includes(emp.id);

          return (
            <div
              key={emp.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/10'
                  : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {isAdmin && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectEmp(emp.id)}
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                        title="เลือกพนักงาน"
                      />
                    )}
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
                    <span className="font-extrabold text-emerald-700">
                      {(remainingEnt / 8).toFixed(2).replace(/\.00$/, '')} วัน ({remainingEnt} ชม.)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>ใช้ไป {(usedEnt / 8).toFixed(2).replace(/\.00$/, '')} วัน ({usedEnt} ชม.)</span>
                    <span>สิทธิทั้งหมด {(totalEnt / 8).toFixed(1).replace(/\.0$/, '')} วัน ({totalEnt} ชม.)</span>
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
                  <div className="flex items-center space-x-2.5">
                    <button
                      onClick={() => handleOpenEdit(emp)}
                      className="inline-flex items-center text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                      title="แก้ไขข้อมูลพนักงาน"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" />
                      <span>แก้ไข</span>
                    </button>

                    <button
                      onClick={() => handleOpenDeleteSingle(emp)}
                      className="inline-flex items-center text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                      title="ลบพนักงาน"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      <span>ลบ</span>
                    </button>
                  </div>
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
                            คงเหลือ {(ent.remainingHours / 8).toFixed(2).replace(/\.00$/, '')} วัน ({ent.remainingHours} ชม.)
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>ใช้ไป {(ent.usedHours / 8).toFixed(2).replace(/\.00$/, '')} วัน ({ent.usedHours} ชม.)</span>
                          <span>สิทธิทั้งหมด {(ent.totalHours / 8).toFixed(1).replace(/\.0$/, '')} วัน ({ent.totalHours} ชม.)</span>
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

      {/* Delete Confirmation Modal */}
      {deleteModalData.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-rose-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-300" />
                <h4 className="text-sm font-bold">ยืนยันการลบพนักงาน (Confirm Deletion)</h4>
              </div>
              <button
                onClick={() => setDeleteModalData({ isOpen: false, employees: [] })}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-700 leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการลบพนักงานจำนวน{' '}
                <strong className="text-rose-700 font-bold">{deleteModalData.employees.length} คน</strong>{' '}
                ต่อไปนี้ออกจากระบบ?
              </p>

              {/* List of selected employees */}
              <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/70">
                {deleteModalData.employees.map((emp) => {
                  const isCurrent = emp.id === currentUser.id;
                  return (
                    <div key={emp.id} className="p-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                          <span>{emp.name}</span>
                          <span className="text-[10px] text-blue-700">({emp.employeeCode})</span>
                        </div>
                        <div className="text-[10px] text-slate-500">{emp.department} • {emp.position}</div>
                      </div>
                      {isCurrent && (
                        <span className="text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                          กำลังเข้าใช้งาน (ไม่สามารถลบได้)
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {deleteModalData.employees.some((emp) => emp.id === currentUser.id) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] leading-relaxed">
                  ⚠️ มีบัญชีของคุณที่กำลังล็อกอินใช้งานอยู่ ระบบจะข้ามการลบบัญชีนี้ และลบเฉพาะพนักงานคนอื่นที่เลือก
                </div>
              )}

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] leading-relaxed">
                <strong>คำเตือน:</strong> การลบพนักงานจะนำข้อมูลและสิทธิวันลาออกจากระบบอย่างถาวร (บันทึกใน Audit Log) และไม่สามารถกู้คืนได้
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalData({ isOpen: false, employees: [] })}
                  className="px-3.5 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteEmployees}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>ยืนยันการลบ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
