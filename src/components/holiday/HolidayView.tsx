/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CalendarDays,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../context/DatabaseContext';
import { Holiday } from '../../types';
import { formatDateThai, isWeekend, getThaiDayOfWeek } from '../../services/calculationEngine';
import { INITIAL_HOLIDAYS } from '../../services/seedData';

export const HolidayView: React.FC = () => {
  const { holidays, saveHoliday, deleteHoliday } = useDatabase();
  const { isAdmin } = useAuth();

  const [selectedYear, setSelectedYear] = useState<number>(2027);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    name: '',
    description: '',
    isCompanySpecific: true,
  });

  const [notification, setNotification] = useState<string | null>(null);

  const yearHolidays = holidays
    .filter((h) => {
      const hYear = parseInt(h.date.split('-')[0], 10);
      if (selectedYear !== 0 && hYear !== selectedYear) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return h.name.toLowerCase().includes(q) || h.date.includes(q);
      }
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const handleOpenAdd = () => {
    setEditingHoliday(null);
    setFormData({
      date: `${selectedYear}-01-01`,
      name: '',
      description: '',
      isCompanySpecific: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (h: Holiday) => {
    setEditingHoliday(h);
    setFormData({
      date: h.date,
      name: h.name,
      description: h.description || '',
      isCompanySpecific: !!h.isCompanySpecific,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.date) return;

    const y = parseInt(formData.date.split('-')[0], 10);
    const holidayToSave: Holiday = {
      id: editingHoliday ? editingHoliday.id : `H_${Date.now()}`,
      date: formData.date,
      name: formData.name.trim(),
      description: formData.description.trim(),
      year: y,
      isCompanySpecific: formData.isCompanySpecific,
    };

    saveHoliday(holidayToSave);
    setIsModalOpen(false);
    setNotification('บันทึกข้อมูลวันหยุดสำเร็จ');
    setTimeout(() => setNotification(null), 2000);
  };

  const handleDelete = (id: string, name: string) => {
    if (!isAdmin) return;
    if (window.confirm(`ยืนยันการลบวันหยุด "${name}" หรือไม่?`)) {
      deleteHoliday(id);
      setNotification(`ลบวันหยุด "${name}" สำเร็จ`);
      setTimeout(() => setNotification(null), 2000);
    }
  };

  // 1-Click Import Official Thai Holidays
  const handleImportOfficialHolidays = () => {
    let added = 0;
    INITIAL_HOLIDAYS.forEach((seedH) => {
      const exists = holidays.some((h) => h.date === seedH.date);
      if (!exists) {
        saveHoliday(seedH);
        added++;
      }
    });
    setNotification(`นำเข้าปฏิทินวันหยุดราชการและวันหยุดตามประเพณีจำนวน ${added} รายการ สำเร็จ`);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            7. ปฏิทินวันหยุด (Holiday Management)
          </h2>
          <p className="text-xs text-slate-500">
            จัดการวันหยุดบริษัทและวันหยุดนักขัตฤกษ์ • ระบบจะตัดวันเหล่านี้ออกจากการคำนวณชั่วโมงลาอัตโนมัติ
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {isAdmin && (
            <button
              onClick={handleImportOfficialHolidays}
              className="inline-flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              title="นำเข้าวันหยุดราชการไทยมาตรฐาน (2026-2027)"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
              <span>นำเข้าวันหยุดทางการ</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>+ เพิ่มวันหยุดบริษัท</span>
            </button>
          )}
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
          <span className="text-slate-500 font-medium">ปีปฏิทิน:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-transparent font-bold text-blue-900 focus:outline-hidden cursor-pointer"
          >
            <option value={0}>ทุกปี (All)</option>
            <option value={2026}>ปี 2026 (พ.ศ. 2569)</option>
            <option value={2027}>ปี 2027 (พ.ศ. 2570)</option>
            <option value={2028}>ปี 2028 (พ.ศ. 2571)</option>
          </select>
        </div>

        <div className="flex-1 max-w-sm">
          <input
            type="text"
            placeholder="ค้นหาชื่อวันหยุด หรือ วันที่..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Holiday Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">วันที่</th>
                <th className="px-4 py-3">วันในสัปดาห์</th>
                <th className="px-4 py-3">ชื่อวันหยุด</th>
                <th className="px-4 py-3">ประเภท</th>
                <th className="px-4 py-3">คำอธิบาย</th>
                {isAdmin && <th className="px-4 py-3 text-center">จัดการ</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {yearHolidays.length > 0 ? (
                yearHolidays.map((h) => {
                  const [y, m, d] = h.date.split('-').map(Number);
                  const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
                  const dayName = getThaiDayOfWeek(dateObj);
                  const fallsOnWeekend = isWeekend(h.date);

                  return (
                    <tr key={h.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        {formatDateThai(h.date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`font-medium ${
                            fallsOnWeekend ? 'text-amber-600' : 'text-slate-700'
                          }`}
                        >
                          {dayName} {fallsOnWeekend && '(ตรงวันหยุดสุดสัปดาห์)'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">{h.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {h.isCompanySpecific ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            วันหยุดบริษัท
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            วันหยุดตามประเพณี
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{h.description || '-'}</td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleOpenEdit(h)}
                              className="p-1 rounded text-slate-500 hover:text-blue-700 hover:bg-slate-100 cursor-pointer"
                              title="แก้ไข"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(h.id, h.name)}
                              className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                              title="ลบ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-12 text-center text-slate-400">
                    ไม่พบวันหยุดในปฏิทินที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h4 className="text-sm font-bold">
                {editingHoliday ? 'แก้ไขวันหยุด' : 'เพิ่มวันหยุดใหม่'}
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
                  วันที่ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ชื่อวันหยุด <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น วันสถาปนาบริษัท, วันสงกรานต์"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">คำอธิบาย</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isCompCheck"
                  checked={formData.isCompanySpecific}
                  onChange={(e) =>
                    setFormData({ ...formData, isCompanySpecific: e.target.checked })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isCompCheck" className="text-slate-800 font-medium cursor-pointer">
                  เป็นวันหยุดพิเศษเฉพาะของบริษัท (Company Specific)
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
                  บันทึกวันหยุด
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
