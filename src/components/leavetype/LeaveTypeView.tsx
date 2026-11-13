/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Tags, Plus, Edit, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../context/DatabaseContext';
import { LeaveType } from '../../types';

export const LeaveTypeView: React.FC = () => {
  const { leaveTypes, saveLeaveType } = useDatabase();
  const { isAdmin } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    minUnitHours: 4,
    description: '',
    color: '#2563eb',
    isActive: true,
  });

  const handleOpenAdd = () => {
    setEditingType(null);
    setFormData({
      code: `LT_CUSTOM_${Date.now().toString(36).toUpperCase()}`,
      name: '',
      minUnitHours: 4,
      description: '',
      color: '#3b82f6',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lt: LeaveType) => {
    setEditingType(lt);
    setFormData({
      code: lt.code,
      name: lt.name,
      minUnitHours: lt.minUnitHours,
      description: lt.description || '',
      color: lt.color || '#2563eb',
      isActive: lt.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const typeToSave: LeaveType = {
      id: editingType ? editingType.id : `LT_${Date.now()}`,
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      minUnitHours: Number(formData.minUnitHours) || 0.5,
      description: formData.description.trim(),
      color: formData.color,
      isActive: formData.isActive,
      order: editingType ? editingType.order : leaveTypes.length + 1,
    };

    saveLeaveType(typeToSave);
    setIsModalOpen(false);
  };

  const handleToggleStatus = (lt: LeaveType) => {
    if (!isAdmin) return;
    saveLeaveType({
      ...lt,
      isActive: !lt.isActive,
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            6. ประเภทการลา (Leave Types)
          </h2>
          <p className="text-xs text-slate-500">
            กำหนดประเภทการลา หน่วยขั้นต่ำ (ชั่วโมง) และสถานะการเปิด/ปิดการใช้งาน
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>+ เพิ่มประเภทการลาใหม่</span>
          </button>
        )}
      </div>

      {/* Grid of Leave Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {leaveTypes.map((lt) => {
          return (
            <div
              key={lt.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs transition-all relative overflow-hidden flex flex-col justify-between ${
                lt.isActive ? 'border-slate-200' : 'border-slate-200 bg-slate-50/60 opacity-70'
              }`}
            >
              {/* Left Color Accent Bar */}
              <div
                className="absolute left-0 inset-y-0 w-2"
                style={{ backgroundColor: lt.color || '#2563eb' }}
              />

              <div className="pl-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: lt.color || '#2563eb' }}
                    />
                    <h3 className="text-sm font-bold text-slate-900">{lt.name}</h3>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      lt.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {lt.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1.5 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">หน่วยขั้นต่ำในการลา:</span>
                    <span className="font-bold text-blue-700">{lt.minUnitHours} ชั่วโมง</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">เงื่อนไขการคำนวณ:</span>
                    <span className="font-medium text-slate-800">
                      ต้องเป็นเท่าของ {lt.minUnitHours} ชม.
                    </span>
                  </div>
                </div>

                {lt.description && (
                  <p className="text-[11px] text-slate-400 mt-2 bg-slate-50 p-2 rounded-lg">
                    {lt.description}
                  </p>
                )}
              </div>

              {/* Actions Footer */}
              {isAdmin && (
                <div className="mt-4 pt-3 border-t border-slate-100 pl-2 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleToggleStatus(lt)}
                    className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                  >
                    {lt.isActive ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน'}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(lt)}
                    className="inline-flex items-center text-blue-700 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 mr-1" />
                    <span>แก้ไข</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h4 className="text-sm font-bold">
                {editingType ? 'แก้ไขประเภทการลา' : 'เพิ่มประเภทการลาใหม่'}
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ชื่อประเภทการลา <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น พักร้อน, กิจธุระ, ลาป่วย"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    หน่วยขั้นต่ำ (ชั่วโมง) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    value={formData.minUnitHours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minUnitHours: parseFloat(e.target.value) || 0.5,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden"
                    required
                  />
                  <span className="text-[10px] text-slate-400">เช่น 4 ชม., 0.5 ชม.</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">สีประจำประเภท</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                    />
                    <span className="font-mono text-slate-600">{formData.color}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">คำอธิบาย</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="ระบุข้อกำหนดเพิ่มเติม..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActiveCheck" className="text-slate-800 font-medium cursor-pointer">
                  เปิดใช้งานประเภทนี้ (Active)
                </label>
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
                  บันทึกประเภทการลา
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
