/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileClock, Search, ShieldCheck, ArrowRight, Eye } from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';
import { AuditLog } from '../../types';

export const AuditLogView: React.FC = () => {
  const { auditLogs } = useDatabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = auditLogs.filter((log) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        log.performedByName.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.entity.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            ระบบบันทึกประวัติการเปลี่ยนแปลง (Audit Log Trail)
          </h2>
          <p className="text-xs text-slate-500">
            เก็บบันทึกประวัติการสร้าง แก้ไข ยกเลิก และปรับปรุงสิทธิทุกรายการอย่างถาวร (Immutable Log)
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>บันทึกแล้ว {auditLogs.length} รายการ</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs">
        <div className="relative max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="ค้นหาผู้ดำเนินการ, การกระทำ, รายละเอียด..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">วัน-เวลา</th>
                <th className="px-4 py-3">การกระทำ (Action)</th>
                <th className="px-4 py-3">เป้าหมาย (Entity)</th>
                <th className="px-4 py-3">ผู้ดำเนินการ</th>
                <th className="px-4 py-3">รายละเอียดเหตุการณ์</th>
                <th className="px-4 py-3 text-center">ดู Data Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  let actionBadge = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (log.action === 'CREATE') {
                    actionBadge = 'bg-blue-50 text-blue-700 border-blue-200';
                  } else if (log.action === 'UPDATE') {
                    actionBadge = 'bg-amber-50 text-amber-700 border-amber-200';
                  } else if (log.action === 'CANCEL') {
                    actionBadge = 'bg-rose-50 text-rose-700 border-rose-200';
                  }

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString('th-TH')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${actionBadge}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800">
                        {log.entity}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-900">
                        {log.performedByName}
                      </td>
                      <td className="px-4 py-3 text-slate-700 max-w-md truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {(log.previousData || log.newData) ? (
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="text-blue-700 hover:text-blue-900 font-semibold inline-flex items-center space-x-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>ดูการเปลี่ยนแปลง</span>
                          </button>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    ไม่พบบันทึก Audit Log ที่ตรงกับคำค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View Log Details / Data Diff */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold">รายละเอียดการเปลี่ยนแปลง (Audit Log Diff)</h4>
                <p className="text-xs text-slate-300">
                  {selectedLog.action} • {selectedLog.entity} • {selectedLog.performedByName}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800">
                <span className="font-bold">รายละเอียด:</span> {selectedLog.details}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Previous Data */}
                <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl space-y-1">
                  <div className="font-bold text-rose-800">ข้อมูลก่อนหน้า (Previous State):</div>
                  {selectedLog.previousData ? (
                    <pre className="text-[11px] bg-white p-2.5 rounded-lg border border-rose-100 overflow-x-auto text-slate-800 font-mono max-h-56">
                      {JSON.stringify(selectedLog.previousData, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-slate-400 italic">ไม่มีข้อมูลก่อนหน้า (สร้างรายการใหม่)</div>
                  )}
                </div>

                {/* New Data */}
                <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1">
                  <div className="font-bold text-emerald-800">ข้อมูลใหม่ (New State):</div>
                  {selectedLog.newData ? (
                    <pre className="text-[11px] bg-white p-2.5 rounded-lg border border-emerald-100 overflow-x-auto text-slate-800 font-mono max-h-56">
                      {JSON.stringify(selectedLog.newData, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-slate-400 italic">ไม่มีข้อมูลหลังแก้ไข</div>
                  )}
                </div>
              </div>

              <div className="text-right pt-2">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-1.5 bg-slate-800 text-white rounded-lg font-semibold cursor-pointer"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
