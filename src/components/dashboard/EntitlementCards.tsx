/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LeaveEntitlement, LeaveType } from '../../types';
import { CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

interface EntitlementCardsProps {
  leaveTypes: LeaveType[];
  entitlements: LeaveEntitlement[];
  selectedYear: number;
}

export const EntitlementCards: React.FC<EntitlementCardsProps> = ({
  leaveTypes,
  entitlements,
  selectedYear,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {leaveTypes
        .filter((lt) => lt.isActive)
        .map((lt) => {
          // Aggregate or single entitlement based on filtered entitlements
          const matchedEnts = entitlements.filter(
            (e) => e.leaveTypeId === lt.id && e.leaveYear === selectedYear
          );

          const totalHours = matchedEnts.reduce((sum, e) => sum + e.totalHours, 0);
          const usedHours = matchedEnts.reduce((sum, e) => sum + e.usedHours, 0);
          const remainingHours = Math.max(0, totalHours - usedHours);
          const usedPct = totalHours > 0 ? (usedHours / totalHours) * 100 : 0;

          // Color theme based on remaining status
          let badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
          let progressColor = 'bg-emerald-500';
          if (remainingHours === 0 && totalHours > 0) {
            badgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
            progressColor = 'bg-rose-500';
          } else if (usedPct > 70) {
            badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
            progressColor = 'bg-amber-500';
          }

          return (
            <div
              key={lt.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
            >
              {/* Top Accent Line */}
              <div
                className="absolute top-0 inset-x-0 h-1.5"
                style={{ backgroundColor: lt.color || '#2563eb' }}
              />

              {/* Title & Badge */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: lt.color || '#2563eb' }}
                    />
                    <h3 className="text-sm font-bold text-slate-900">{lt.name}</h3>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}
                  >
                    ใช้ไป {usedPct.toFixed(1)}%
                  </span>
                </div>

                {/* Main Stats: Remaining vs Total */}
                <div className="my-2">
                  <div className="text-[11px] text-slate-500 font-medium">สิทธิคงเหลือ (Remaining)</div>
                  <div className="flex items-baseline space-x-1.5 flex-wrap">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {(remainingHours / 8).toFixed(2).replace(/\.00$/, '')} วัน
                    </span>
                    <span className="text-xs font-semibold text-emerald-600">
                      ({remainingHours} ชม.)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    สิทธิทั้งหมด {(totalHours / 8).toFixed(1).replace(/\.0$/, '')} วัน ({totalHours} ชม.)
                  </div>
                </div>
              </div>

              {/* Breakdown Details & Progress Bar */}
              <div className="pt-3 border-t border-slate-100 mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">ใช้ไปแล้ว:</span>
                  <span className="font-bold text-amber-600">
                    {(usedHours / 8).toFixed(2).replace(/\.00$/, '')} วัน ({usedHours} ชม.)
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                    style={{ width: `${Math.min(usedPct, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>ขั้นต่ำ {lt.minUnitHours} ชม.</span>
                  <span>รอบปี {selectedYear}</span>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
};
