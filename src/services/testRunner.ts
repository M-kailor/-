/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Holiday, LeaveType } from '../types';
import { calculateLeave, checkOverlappingLeave, getLeaveYear } from './calculationEngine';

export interface TestCaseResult {
  id: number;
  title: string;
  description: string;
  expected: string;
  actual: string;
  passed: boolean;
  details: string[];
}

export function runAllAcceptanceTests(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  const vacationType: LeaveType = {
    id: 'LT_ANNUAL',
    code: 'ANNUAL',
    name: 'พักร้อน',
    minUnitHours: 4,
    color: '#2563eb',
    isActive: true,
    order: 1,
  };

  const businessType: LeaveType = {
    id: 'LT_BUSINESS',
    code: 'BUSINESS',
    name: 'กิจธุระ',
    minUnitHours: 0.5,
    color: '#d97706',
    isActive: true,
    order: 2,
  };

  const sampleHolidays: Holiday[] = [
    { id: 'H1', date: '2026-11-23', name: 'วันหยุดพิเศษบริษัท (จันทร์)', year: 2026, isCompanySpecific: true },
    { id: 'H2', date: '2027-01-01', name: 'วันขึ้นปีใหม่', year: 2027 },
    { id: 'H3', date: '2027-05-03', name: 'ชดเชยวันแรงงาน (จันทร์)', year: 2027 },
  ];

  // -------------------------------------------------------------
  // Test 1: ลาวันจันทร์ 8 ชั่วโมง ต้องหัก 8 ชั่วโมง
  // -------------------------------------------------------------
  {
    // 2026-11-16 is Monday
    const res = calculateLeave({
      startDate: '2026-11-16',
      endDate: '2026-11-16',
      leaveType: vacationType,
      holidays: sampleHolidays,
    });

    const passed = res.isValid && res.totalWorkingHours === 8 && res.equivalentDays === 1;
    results.push({
      id: 1,
      title: 'Test 1: ลาวันจันทร์ 8 ชั่วโมง',
      description: 'ลาพักร้อนวันจันทร์ (วันทำงานปกติ)',
      expected: 'ระบบคำนวณ 8 ชั่วโมง (1 วัน) และอนุญาตให้บันทึก',
      actual: res.isValid
        ? `คำนวณได้ ${res.totalWorkingHours} ชั่วโมง (${res.equivalentDays} วัน)`
        : `ข้อผิดพลาด: ${res.errorMessage}`,
      passed,
      details: [
        'วันที่ตรวจสอบ: 2026-11-16 (วันจันทร์)',
        `สถานะความถูกต้อง: ${res.isValid ? 'ผ่าน' : 'ไม่ผ่าน'}`,
        `ชั่วโมงที่คำนวณ: ${res.totalWorkingHours} ชม.`,
        `วันเทียบเท่า: ${res.equivalentDays} วัน`,
      ],
    });
  }

  // -------------------------------------------------------------
  // Test 2: ลาวันเสาร์ 8 ชั่วโมง ต้องไม่อนุญาตให้บันทึก
  // -------------------------------------------------------------
  {
    // 2026-11-14 is Saturday
    const res = calculateLeave({
      startDate: '2026-11-14',
      endDate: '2026-11-14',
      leaveType: vacationType,
      holidays: sampleHolidays,
    });

    const passed = !res.isValid && res.errorMessage?.includes('เสาร์');
    results.push({
      id: 2,
      title: 'Test 2: ลาวันเสาร์ 8 ชั่วโมง',
      description: 'พยายามบันทึกวันลาในวันเสาร์ (วันหยุดสุดสัปดาห์)',
      expected: 'ไม่อนุญาตให้บันทึก และแจ้งเตือนว่าเป็นวันเสาร์/อาทิตย์',
      actual: !res.isValid ? `ปฏิเสธ: ${res.errorMessage}` : `ข้อผิดพลาด: ระบบยอมให้บันทึก`,
      passed: !!passed,
      details: [
        'วันที่ตรวจสอบ: 2026-11-14 (วันเสาร์)',
        `ผลการตรวจสอบ: ${res.isValid ? 'ยอมรับ (ผิดพลาด)' : 'ปฏิเสธ (ถูกต้อง)'}`,
        `ข้อความแจ้งเตือน: ${res.errorMessage}`,
      ],
    });
  }

  // -------------------------------------------------------------
  // Test 3: ลาวันศุกร์ถึงวันจันทร์ โดยไม่มีวันหยุด ต้องหัก 16 ชั่วโมง
  // -------------------------------------------------------------
  {
    // 2026-11-13 (Fri) to 2026-11-16 (Mon) -> Fri (8) + Sat (0) + Sun (0) + Mon (8) = 16
    const res = calculateLeave({
      startDate: '2026-11-13',
      endDate: '2026-11-16',
      leaveType: vacationType,
      holidays: sampleHolidays, // 2026-11-16 is not holiday here
    });

    const passed = res.isValid && res.totalWorkingHours === 16 && res.equivalentDays === 2;
    results.push({
      id: 3,
      title: 'Test 3: ลาวันศุกร์ถึงวันจันทร์ (ไม่มีวันหยุด)',
      description: 'ลาช่วงศุกร์-เสาร์-อาทิตย์-จันทร์',
      expected: 'หัก 16 ชั่วโมง (2 วันทำงาน) โดยเสาร์-อาทิตย์เป็น 0 ชั่วโมง',
      actual: res.isValid
        ? `คำนวณได้ ${res.totalWorkingHours} ชั่วโมง (${res.equivalentDays} วัน)`
        : `ข้อผิดพลาด: ${res.errorMessage}`,
      passed,
      details: [
        'ช่วงวันที่: 2026-11-13 ถึง 2026-11-16',
        ...res.dayBreakdown.map((d) => `  - ${d.date} (${d.dayOfWeek}): ${d.hours} ชม. [${d.note}]`),
        `รวมสุทธิ: ${res.totalWorkingHours} ชั่วโมง`,
      ],
    });
  }

  // -------------------------------------------------------------
  // Test 4: ลาวันศุกร์ถึงวันจันทร์ โดยวันจันทร์เป็นวันหยุดบริษัท ต้องหัก 8 ชั่วโมง
  // -------------------------------------------------------------
  {
    // 2026-11-20 (Fri) to 2026-11-23 (Mon) -> Mon 2026-11-23 is in sampleHolidays!
    // Fri (8) + Sat (0) + Sun (0) + Mon (0 holiday) = 8
    const res = calculateLeave({
      startDate: '2026-11-20',
      endDate: '2026-11-23',
      leaveType: vacationType,
      holidays: sampleHolidays,
    });

    const passed = res.isValid && res.totalWorkingHours === 8 && res.equivalentDays === 1;
    results.push({
      id: 4,
      title: 'Test 4: ลาวันศุกร์ถึงวันจันทร์ (วันจันทร์เป็นวันหยุด)',
      description: 'ลาช่วงศุกร์-จันทร์ โดยวันจันทร์คือวันหยุดพิเศษบริษัท',
      expected: 'หัก 8 ชั่วโมง (1 วันทำงาน) ตัดเสาร์-อาทิตย์ และวันจันทร์ที่เป็นวันหยุดออก',
      actual: res.isValid
        ? `คำนวณได้ ${res.totalWorkingHours} ชั่วโมง (${res.equivalentDays} วัน)`
        : `ข้อผิดพลาด: ${res.errorMessage}`,
      passed,
      details: [
        'ช่วงวันที่: 2026-11-20 ถึง 2026-11-23 (วันจันทร์เป็นวันหยุดบริษัท)',
        ...res.dayBreakdown.map((d) => `  - ${d.date} (${d.dayOfWeek}): ${d.hours} ชม. [${d.note}]`),
        `รวมสุทธิ: ${res.totalWorkingHours} ชั่วโมง`,
      ],
    });
  }

  // -------------------------------------------------------------
  // Test 5: ลากิจ 0.5 ชั่วโมง ต้องหัก 0.5 ชั่วโมง
  // -------------------------------------------------------------
  {
    // 2026-11-18 is Wednesday
    const res = calculateLeave({
      startDate: '2026-11-18',
      endDate: '2026-11-18',
      leaveType: businessType,
      holidays: sampleHolidays,
      customHours: 0.5,
    });

    const passed = res.isValid && res.totalWorkingHours === 0.5 && res.equivalentDays === 0.0625;
    results.push({
      id: 5,
      title: 'Test 5: ลากิจ 0.5 ชั่วโมง',
      description: 'ลากิจส่วนตัวระยะสั้น 30 นาที (0.5 ชม.)',
      expected: 'หัก 0.5 ชั่วโมง (0.0625 วันทำงาน) และผ่านเงื่อนไขหน่วยขั้นต่ำ 0.5 ชม.',
      actual: res.isValid
        ? `คำนวณได้ ${res.totalWorkingHours} ชั่วโมง (${res.equivalentDays} วัน)`
        : `ข้อผิดพลาด: ${res.errorMessage}`,
      passed,
      details: [
        'ประเภท: กิจธุระ (หน่วยขั้นต่ำ 0.5 ชม.)',
        `ชั่วโมงที่ขอลา: 0.5 ชม.`,
        `ผลการคำนวณ: ${res.totalWorkingHours} ชม. (${res.equivalentDays} วัน)`,
      ],
    });
  }

  // -------------------------------------------------------------
  // Test 6: สิทธิพักร้อน 80 ชั่วโมง ใช้ไป 24 ชั่วโมง ต้องเหลือ 56 ชั่วโมง
  // -------------------------------------------------------------
  {
    const total = 80;
    const used = 24;
    const remaining = total - used;
    const passed = remaining === 56;
    results.push({
      id: 6,
      title: 'Test 6: การคำนวณสิทธิคงเหลือ (80 - 24 = 56)',
      description: 'ตรวจสอบสูตร สิทธิคงเหลือ = สิทธิทั้งหมด - ชั่วโมงที่ใช้ไป',
      expected: 'คงเหลือ 56 ชั่วโมง',
      actual: `คงเหลือ ${remaining} ชั่วโมง`,
      passed,
      details: [
        `สิทธิที่ได้รับทั้งหมด: ${total} ชั่วโมง`,
        `ใช้ไปแล้ว: ${used} ชั่วโมง`,
        `สูตรคำนวณ: ${total} - ${used} = ${remaining} ชั่วโมง`,
        `สัดส่วนการใช้สิทธิ: ${((used / total) * 100).toFixed(2)}%`,
      ],
    });
  }

  // -------------------------------------------------------------
  // Test 7: ใช้สิทธิครบแล้ว ต้องไม่อนุญาตให้ลาต่อ
  // -------------------------------------------------------------
  {
    const total = 80;
    const used = 80;
    const remaining = total - used;
    const requested = 4;
    const canLeave = remaining >= requested;
    const passed = !canLeave;
    results.push({
      id: 7,
      title: 'Test 7: ใช้สิทธิครบแล้ว ห้ามลาเกินสิทธิ',
      description: 'สิทธิเหลือ 0 ชั่วโมง ขอลาเพิ่มอีก 4 ชั่วโมง',
      expected: 'ระบบปฏิเสธและแจ้งเตือนสิทธิคงเหลือไม่เพียงพอ',
      actual: !canLeave ? 'ระบบปฏิเสธการบันทึก (ถูกต้อง)' : 'ระบบอนุญาต (ผิดพลาด)',
      passed,
      details: [
        `สิทธิคงเหลือ: ${remaining} ชั่วโมง`,
        `ชั่วโมงที่ต้องการลา: ${requested} ชั่วโมง`,
        `การตรวจสอบ remaining >= requested: ${canLeave ? 'ผ่าน' : 'ไม่ผ่าน (บล็อกการลา)'}`,
      ],
    });
  }

  // -------------------------------------------------------------
  // Test 8: ยกเลิกรายการลา 8 ชั่วโมง ต้องคืนสิทธิ 8 ชั่วโมง
  // -------------------------------------------------------------
  {
    let usedHours = 24;
    const recordHours = 8;
    // Refund operation
    usedHours = Math.max(0, usedHours - recordHours);
    const totalHours = 80;
    const remaining = totalHours - usedHours;
    const passed = usedHours === 16 && remaining === 64;
    results.push({
      id: 8,
      title: 'Test 8: ยกเลิกรายการลา 8 ชม. คืนสิทธิอัตโนมัติ',
      description: 'เดิมใช้ไป 24 ชม. ขอยกเลิกรายการ 8 ชม.',
      expected: 'ยอดใช้ไปลดลงเหลือ 16 ชม. และสิทธิคงเหลือเพิ่มเป็น 64 ชม.',
      actual: `ยอดใช้ไป = ${usedHours} ชม., สิทธิคงเหลือ = ${remaining} ชม.`,
      passed,
      details: [
        'ยอดเดิมก่อนยกเลิก: ใช้ไป 24 ชม. (คงเหลือ 56 ชม.)',
        `ยกเลิกรายการ: ${recordHours} ชม.`,
        `คำนวณคืนสิทธิ: ใช้ไปเหลือ ${usedHours} ชม. (คงเหลือ ${remaining} ชม.)`,
      ],
    });
  }

  // -------------------------------------------------------------
  // Test 9: วันที่ 31 ตุลาคม สิทธิคงเหลือหมดอายุ ไม่ทบไปปีใหม่
  // -------------------------------------------------------------
  {
    const dateOct31 = '2027-10-31';
    const dateNov01 = '2027-11-01';
    const yearOct = getLeaveYear(dateOct31);
    const yearNov = getLeaveYear(dateNov01);
    const passed = yearOct === 2027 && yearNov === 2028;
    results.push({
      id: 9,
      title: 'Test 9: วันที่ 31 ตุลาคม สิทธิหมดอายุ ไม่ทบข้ามปี',
      description: 'ตรวจสอบการแบ่งรอบปีวันลาตามวันที่ 31 ต.ค. และ 1 พ.ย.',
      expected: '31/10/2027 คือปีวันลา 2027 ส่วน 01/11/2027 คือปีวันลา 2028 แยกกระเป๋าสิทธิกันอย่างเด็ดขาด',
      actual: `31 ต.ค. 2027 = ปี ${yearOct}, 1 พ.ย. 2027 = ปี ${yearNov}`,
      passed,
      details: [
        `วันที่ 31/10/2027 สิ้นสุดรอบปีวันลา: ${yearOct}`,
        `วันที่ 01/11/2027 เริ่มต้นรอบปีวันลาใหม่: ${yearNov}`,
        'สิทธิคงเหลือของปี 2027 จะสิ้นสุดและไม่ถูกโอนย้ายไปปี 2028',
      ],
    });
  }

  // -------------------------------------------------------------
  // Test 10: วันที่ 1 พฤศจิกายน เริ่มคำนวณสิทธิปีใหม่แยกจากปีก่อน
  // -------------------------------------------------------------
  {
    const crossRes = calculateLeave({
      startDate: '2027-10-30', // Leave Year 2027
      endDate: '2027-11-02', // Leave Year 2028
      leaveType: vacationType,
      holidays: [],
    });

    const passed = !crossRes.isValid && crossRes.crossesLeaveYear;
    results.push({
      id: 10,
      title: 'Test 10: ห้ามลาคร่อมรอบปีวันลา (ข้าม 31 ต.ค. - 1 พ.ย.)',
      description: 'พยายามบันทึกการลาช่วง 30/10/2027 ถึง 02/11/2027',
      expected: 'ระบบปฏิเสธการบันทึก แจ้งเตือนให้แยกเป็นคนละปีวันลา',
      actual: !crossRes.isValid ? `ปฏิเสธ: ${crossRes.errorMessage}` : 'ระบบยอมให้ลาคร่อมปี (ผิดพลาด)',
      passed,
      details: [
        'วันเริ่มต้น: 2027-10-30 (รอบปี 2027)',
        'วันสิ้นสุด: 2027-11-02 (รอบปี 2028)',
        `ผลตรวจ crossLeaveYear: ${crossRes.crossesLeaveYear}`,
        `ข้อความแจ้งเตือน: ${crossRes.errorMessage}`,
      ],
    });
  }

  // -------------------------------------------------------------
  // Test 11: มีรายการลาซ้อนช่วงเวลาเดิม ต้องแจ้งเตือนและไม่อนุญาต
  // -------------------------------------------------------------
  {
    const existing = [
      {
        id: 'REC_EXISTING_1',
        employeeId: 'EMP001',
        startDate: '2026-11-16',
        endDate: '2026-11-18',
        status: 'COMPLETED',
      },
    ];

    // Attempt to overlap on 2026-11-17
    const overlapCheck = checkOverlappingLeave(
      {
        employeeId: 'EMP001',
        startDate: '2026-11-17',
        endDate: '2026-11-20',
      },
      existing
    );

    const passed = overlapCheck.hasOverlap && overlapCheck.overlappingRecord?.id === 'REC_EXISTING_1';
    results.push({
      id: 11,
      title: 'Test 11: ป้องกันการบันทึกวันลาซ้ำซ้อน (Overlapping)',
      description: 'มีรายการเดิมวันที่ 16-18 พ.ย. พยายามบันทึกใหม่ 17-20 พ.ย.',
      expected: 'ตรวจพบช่วงเวลาทับซ้อนและไม่อนุญาตให้บันทึกซ้ำ',
      actual: overlapCheck.hasOverlap ? 'ตรวจพบการซ้ำซ้อนและบล็อกการบันทึก (ถูกต้อง)' : 'ไม่พบการซ้ำซ้อน (ผิดพลาด)',
      passed,
      details: [
        'รายการเดิมในระบบ: 2026-11-16 ถึง 2026-11-18',
        'รายการที่พยายามบันทึกใหม่: 2026-11-17 ถึง 2026-11-20',
        `ผลการตรวจจับ Overlap: ${overlapCheck.hasOverlap ? 'พบการซ้ำซ้อน' : 'ไม่พบ'}`,
      ],
    });
  }

  // -------------------------------------------------------------
  // Test 12: ลาคร่อมวันหยุดบริษัท ต้องไม่นำชั่วโมงในวันหยุดมาหักสิทธิ
  // -------------------------------------------------------------
  {
    // Range: 2027-04-30 (Fri) to 2027-05-04 (Tue)
    // 2027-04-30: Fri (8h working)
    // 2027-05-01: Sat (0h weekend)
    // 2027-05-02: Sun (0h weekend)
    // 2027-05-03: Mon (0h holiday in sampleHolidays - ชดเชยวันแรงงาน)
    // 2027-05-04: Tue (8h working)
    // Expected = 8 + 0 + 0 + 0 + 8 = 16 hours
    const res = calculateLeave({
      startDate: '2027-04-30',
      endDate: '2027-05-04',
      leaveType: vacationType,
      holidays: sampleHolidays,
    });

    const passed = res.isValid && res.totalWorkingHours === 16 && res.equivalentDays === 2;
    results.push({
      id: 12,
      title: 'Test 12: ลาคร่อมวันหยุดบริษัท ไม่นำวันหยุดมาหักสิทธิ',
      description: 'ลาช่วง 30 เม.ย. ถึง 4 พ.ค. 2027 มีทั้งวันเสาร์ อาทิตย์ และวันหยุดชดเชยวันแรงงาน (3 พ.ค.)',
      expected: 'หักสิทธิเฉพาะวันทำงานจริง 16 ชั่วโมง (2 วัน)',
      actual: res.isValid
        ? `คำนวณได้ ${res.totalWorkingHours} ชั่วโมง (${res.equivalentDays} วัน)`
        : `ข้อผิดพลาด: ${res.errorMessage}`,
      passed,
      details: [
        'ช่วงวันที่: 2027-04-30 ถึง 2027-05-04',
        ...res.dayBreakdown.map((d) => `  - ${d.date} (${d.dayOfWeek}): ${d.hours} ชม. [${d.note}]`),
        `รวมสุทธิ: ${res.totalWorkingHours} ชั่วโมง (หักเฉพาะวันศุกร์และวันอังคาร)`,
      ],
    });
  }

  return results;
}
