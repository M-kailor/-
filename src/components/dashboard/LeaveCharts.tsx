/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LeaveRecord, LeaveType, LeaveEntitlement } from '../../types';

interface LeaveChartsProps {
  leaveTypes: LeaveType[];
  entitlements: LeaveEntitlement[];
  records: LeaveRecord[];
  selectedYear: number;
}

export const LeaveCharts: React.FC<LeaveChartsProps> = ({
  leaveTypes,
  entitlements,
  records,
  selectedYear,
}) => {
  // 1. Data for Donut Chart: Usage by Leave Type
  const usageByType = leaveTypes.map((lt) => {
    const totalUsed = entitlements
      .filter((e) => e.leaveTypeId === lt.id && e.leaveYear === selectedYear)
      .reduce((sum, e) => sum + e.usedHours, 0);

    return {
      id: lt.id,
      name: lt.name,
      color: lt.color || '#2563eb',
      hours: totalUsed,
    };
  });

  const totalUsedAll = usageByType.reduce((sum, item) => sum + item.hours, 0);

  // 2. Data for Bar Chart: Total Entitlement vs Actual Used
  const barData = leaveTypes.map((lt) => {
    const totalEnt = entitlements
      .filter((e) => e.leaveTypeId === lt.id && e.leaveYear === selectedYear)
      .reduce((sum, e) => sum + e.totalHours, 0);
    const used = entitlements
      .filter((e) => e.leaveTypeId === lt.id && e.leaveYear === selectedYear)
      .reduce((sum, e) => sum + e.usedHours, 0);

    return {
      name: lt.name,
      color: lt.color,
      total: totalEnt,
      used,
      remaining: Math.max(0, totalEnt - used),
    };
  });

  const maxBarValue = Math.max(...barData.map((d) => Math.max(d.total, 1)), 50);

  // 3. Data for Monthly Trend Chart: Nov of prev year to Oct of current year
  // Leave Year cycle: Month 11 (Nov), 12 (Dec), 1 (Jan), ..., 10 (Oct)
  const monthLabels = [
    { m: 11, label: 'พ.ย.' },
    { m: 12, label: 'ธ.ค.' },
    { m: 1, label: 'ม.ค.' },
    { m: 2, label: 'ก.พ.' },
    { m: 3, label: 'มี.ค.' },
    { m: 4, label: 'เม.ย.' },
    { m: 5, label: 'พ.ค.' },
    { m: 6, label: 'มิ.ย.' },
    { m: 7, label: 'ก.ค.' },
    { m: 8, label: 'ส.ค.' },
    { m: 9, label: 'ก.ย.' },
    { m: 10, label: 'ต.ค.' },
  ];

  const monthlyHours = monthLabels.map(({ m, label }) => {
    const hours = records
      .filter((r) => r.status === 'COMPLETED' && r.leaveYear === selectedYear)
      .filter((r) => {
        const recMonth = parseInt(r.startDate.split('-')[1], 10);
        return recMonth === m;
      })
      .reduce((sum, r) => sum + r.totalHours, 0);

    return { label, month: m, hours };
  });

  const maxMonthHours = Math.max(...monthlyHours.map((d) => d.hours), 20);

  // SVG Donut calculation
  let cumulativeAngle = 0;
  const donutSlices = usageByType.map((item) => {
    const fraction = totalUsedAll > 0 ? item.hours / totalUsedAll : 0;
    const angle = fraction * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;
    return { ...item, fraction, startAngle, angle };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Pie / Donut Chart */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            สัดส่วนการใช้วันลา (Leave Distribution)
          </h4>
          <span className="text-[10px] text-slate-400">ตามประเภท</span>
        </div>

        {totalUsedAll > 0 ? (
          <div className="flex flex-col items-center justify-center my-auto py-2">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {donutSlices.map((slice, i) => {
                  if (slice.fraction === 0) return null;
                  const strokeDasharray = `${slice.fraction * 251.2} 251.2`;
                  // Calculate dash offset based on accumulated fractions
                  const prevFractions = donutSlices
                    .slice(0, i)
                    .reduce((sum, s) => sum + s.fraction, 0);
                  const strokeDashoffset = -prevFractions * 251.2;

                  return (
                    <circle
                      key={slice.id}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth="16"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-300"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-extrabold text-slate-900">
                  {(totalUsedAll / 8).toFixed(1).replace(/\.0$/, '')} วัน
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">({totalUsedAll} ชม.)</span>
              </div>
            </div>

            {/* Legend */}
            <div className="w-full grid grid-cols-2 gap-2 mt-4 text-xs">
              {usageByType.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-2 py-1 rounded bg-slate-50">
                  <div className="flex items-center space-x-1.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-700 font-medium truncate">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 ml-1">
                    {(item.hours / 8).toFixed(1).replace(/\.0$/, '')} วัน ({item.hours}h)
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            ยังไม่มีประวัติการใช้วันลาในปีนี้
          </div>
        )}
      </div>

      {/* 2. Bar Chart: Entitlement vs Used */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            เปรียบเทียบสิทธิและการใช้จริง (Entitlement vs Used)
          </h4>
          <span className="text-[10px] text-slate-400">หน่วย: วัน (ชั่วโมง)</span>
        </div>

        <div className="space-y-3.5 my-auto">
          {barData.map((item) => {
            const usedPct = item.total > 0 ? (item.used / item.total) * 100 : 0;
            return (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                  <span className="font-semibold text-slate-800">{item.name}</span>
                  <div className="space-x-1.5 text-[11px]">
                    <span className="text-amber-600 font-bold">
                      ใช้ {(item.used / 8).toFixed(1).replace(/\.0$/, '')} วัน ({item.used} ชม.)
                    </span>
                    <span className="text-slate-300">/</span>
                    <span className="text-slate-500">
                      สิทธิ {(item.total / 8).toFixed(1).replace(/\.0$/, '')} วัน ({item.total} ชม.)
                    </span>
                    <span className="text-emerald-600 font-semibold">
                      (เหลือ {(item.remaining / 8).toFixed(1).replace(/\.0$/, '')} วัน ({item.remaining} ชม.))
                    </span>
                  </div>
                </div>

                {/* Dual Bar */}
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className="h-full rounded-l-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${Math.min(usedPct, 100)}%` }}
                    title={`ใช้ไป ${item.used} ชม.`}
                  />
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${Math.max(0, 100 - usedPct)}%` }}
                    title={`คงเหลือ ${item.remaining} ชม.`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center space-x-5 text-[11px] pt-3 border-t border-slate-100 text-slate-500">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            <span>ใช้ไปแล้ว (Used)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span>คงเหลือ (Remaining)</span>
          </div>
        </div>
      </div>

      {/* 3. Monthly Trend Chart: Nov to Oct */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            แนวโน้มการลาแต่ละเดือน (Monthly Leave Trend)
          </h4>
          <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
            รอบปี 1 พ.ย. - 31 ต.ค.
          </span>
        </div>

        {/* Column Bar Visual */}
        <div className="h-36 flex items-end justify-between gap-1 pt-6 pb-2 px-1">
          {monthlyHours.map((item, idx) => {
            const heightPct = (item.hours / maxMonthHours) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                <span className="text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-bold">
                  {item.hours > 0 ? `${item.hours}h` : ''}
                </span>
                <div
                  className={`w-full rounded-t-sm transition-all duration-300 ${
                    item.hours > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-100'
                  }`}
                  style={{ height: `${Math.max(heightPct, 4)}%` }}
                />
                <span className="text-[9px] text-slate-500 mt-1.5 font-medium">{item.label}</span>
              </div>
            );
          })}
        </div>

        <div className="text-[11px] text-slate-500 text-center pt-2 border-t border-slate-100">
          แสดงสถิติชั่วโมงการลาแยกตามเดือนตลอดรอบปีวันลา {selectedYear}
        </div>
      </div>
    </div>
  );
};
