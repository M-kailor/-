/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDateThai } from './calculationEngine';
import { LeaveEntitlement, LeaveRecord } from '../types';

export interface ReportRow {
  [key: string]: string | number;
}

/**
 * Download a CSV file with UTF-8 BOM so Thai text displays correctly in Excel
 */
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  const BOM = '\uFEFF';
  const headerLine = headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(',');
  const rowLines = rows.map((r) =>
    r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
  );
  const csvContent = BOM + [headerLine, ...rowLines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export structured data to an Excel (.xlsx) file
 */
export function exportToExcel(filename: string, sheetName: string, headers: string[], rows: (string | number)[][]): void {
  const data = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  const colWidths = headers.map((h, i) => {
    let maxLen = h.length;
    rows.forEach((r) => {
      const cellLen = String(r[i] ?? '').length;
      if (cellLen > maxLen) maxLen = cellLen;
    });
    return { wch: Math.min(Math.max(maxLen + 4, 12), 40) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Export structured data to a clean printable PDF report
 */
export function exportToPDF(
  filename: string,
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number)[][]
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Header Title
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // Navy
  doc.text(title, 14, 15);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(subtitle, 14, 22);
  doc.text(`Generated at: ${new Date().toLocaleString('th-TH')}`, 14, 27);

  // Table
  autoTable(doc, {
    startY: 32,
    head: [headers],
    body: rows.map((r) => r.map((c) => String(c ?? ''))),
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138], // Navy Blue
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      cellPadding: 2.5,
      overflow: 'linebreak',
    },
  });

  doc.save(`${filename}.pdf`);
}

/**
 * Helper to build Leave Records export dataset
 */
export function formatLeaveRecordsForExport(records: LeaveRecord[]) {
  const headers = [
    'รหัสรายการ',
    'รหัสพนักงาน',
    'ชื่อ-นามสกุล',
    'แผนก',
    'ประเภทการลา',
    'ปีวันลา',
    'วันที่เริ่ม',
    'วันที่สิ้นสุด',
    'ชั่วโมงที่ลา',
    'วันเทียบเท่า',
    'สถานะ',
    'เหตุผล',
    'วันที่บันทึก',
  ];

  const rows = records.map((r) => [
    r.recordCode,
    r.employeeId,
    r.employeeName,
    r.department,
    r.leaveTypeName,
    r.leaveYear,
    formatDateThai(r.startDate),
    formatDateThai(r.endDate),
    r.totalHours,
    r.equivalentDays,
    r.status === 'COMPLETED' ? 'บันทึกสำเร็จ' : 'ยกเลิกแล้ว',
    r.reason,
    new Date(r.createdAt).toLocaleString('th-TH'),
  ]);

  return { headers, rows };
}

/**
 * Helper to build Entitlements summary export dataset
 */
export function formatEntitlementsForExport(
  entitlements: LeaveEntitlement[],
  getEmployeeName: (id: string) => string,
  getLeaveTypeName: (id: string) => string
) {
  const headers = [
    'รหัสพนักงาน',
    'ชื่อ-นามสกุล',
    'ปีวันลา',
    'ประเภทการลา',
    'สิทธิที่ได้รับ (ชม.)',
    'ใช้ไปแล้ว (ชม.)',
    'คงเหลือ (ชม.)',
    'สัดส่วนการใช้สิทธิ (%)',
  ];

  const rows = entitlements.map((e) => {
    const pct = e.totalHours > 0 ? ((e.usedHours / e.totalHours) * 100).toFixed(1) : '0';
    return [
      e.employeeId,
      getEmployeeName(e.employeeId),
      e.leaveYear,
      getLeaveTypeName(e.leaveTypeId),
      e.totalHours,
      e.usedHours,
      e.remainingHours,
      `${pct}%`,
    ];
  });

  return { headers, rows };
}
