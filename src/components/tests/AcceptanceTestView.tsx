/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCw,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Terminal,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { runAllAcceptanceTests, TestCaseResult } from '../../services/testRunner';

export const AcceptanceTestView: React.FC = () => {
  const [results, setResults] = useState<TestCaseResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [lastRunTime, setLastRunTime] = useState<string>('');

  const executeTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const testResults = runAllAcceptanceTests();
      setResults(testResults);
      setIsRunning(false);
      setLastRunTime(new Date().toLocaleTimeString('th-TH'));

      const allPassed = testResults.every((t) => t.passed);
      if (allPassed) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }, 400);
  };

  useEffect(() => {
    executeTests();
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const passCount = results.filter((r) => r.passed).length;
  const failCount = results.filter((r) => !r.passed).length;
  const totalCount = results.length;

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500 text-slate-950">
              SECTION 16: ACCEPTANCE VERIFICATION
            </span>
            <span className="text-xs text-slate-400">ระบบทดสอบความถูกต้องอัตโนมัติ 12 ข้อ</span>
          </div>
          <h2 className="text-base sm:text-xl font-extrabold text-white mt-1">
            Acceptance Test Suite (ชุดทดสอบการยอมรับระบบ)
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            ทดสอบ Leave Calculation Engine, วันหยุดบริษัท, การข้ามรอบปี 31 ต.ค., และการคืนสิทธิอัตโนมัติ
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={executeTests}
            disabled={isRunning}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            {isRunning ? (
              <RotateCw className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-1.5 fill-current" />
            )}
            <span>{isRunning ? 'กำลังทดสอบ...' : 'รันการทดสอบทั้งหมด (Run All)'}</span>
          </button>
        </div>
      </div>

      {/* Summary Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">ผลการทดสอบที่ผ่าน (Passed)</div>
            <div className="text-2xl font-black text-emerald-700">
              {passCount} / {totalCount}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold">
              อัตราความถูกต้อง {((passCount / (totalCount || 1)) * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">ข้อผิดพลาด (Failed)</div>
            <div className="text-2xl font-black text-rose-600">{failCount}</div>
            <div className="text-[10px] text-slate-400">
              {failCount === 0 ? 'ไร้ข้อผิดพลาดทั้งหมด' : 'ต้องแก้ไขก่อนส่งมอบ'}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">สถานะ Engine & Validation</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">READY FOR PRODUCTION</div>
            <div className="text-[10px] text-slate-400">
              ทดสอบล่าสุดเมื่อ: {lastRunTime || 'เพิ่งรัน'}
            </div>
          </div>
        </div>
      </div>

      {/* Tests List */}
      <div className="space-y-3">
        {results.map((t) => {
          const isExpanded = expandedIds.includes(t.id);
          return (
            <div
              key={t.id}
              className={`bg-white rounded-2xl border transition-all overflow-hidden shadow-xs ${
                t.passed ? 'border-slate-200 hover:border-emerald-200' : 'border-rose-300 bg-rose-50/20'
              }`}
            >
              <div
                onClick={() => toggleExpand(t.id)}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-start space-x-3">
                  <div className="pt-0.5">
                    {t.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">{t.title}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                          t.passed
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {t.passed ? 'PASS (ผ่าน)' : 'FAIL (ไม่ผ่าน)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-400">
                  <span className="hidden sm:inline font-mono">
                    {t.passed ? 'Assertion OK' : 'Assertion Failed'}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expandable Step-by-Step details */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-1 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <div className="font-bold text-slate-500 text-[11px] mb-1">
                        ผลลัพธ์ที่คาดหวัง (Expected Output):
                      </div>
                      <div className="font-semibold text-slate-800">{t.expected}</div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <div className="font-bold text-slate-500 text-[11px] mb-1">
                        ผลลัพธ์ที่คำนวณจริง (Actual Output):
                      </div>
                      <div
                        className={`font-semibold ${
                          t.passed ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {t.actual}
                      </div>
                    </div>
                  </div>

                  {t.details && t.details.length > 0 && (
                    <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-1">
                      <div className="text-slate-400 font-bold mb-1 flex items-center">
                        <Terminal className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Execution Trace:
                      </div>
                      {t.details.map((line, idx) => (
                        <div key={idx} className="text-slate-300">
                          {line}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
