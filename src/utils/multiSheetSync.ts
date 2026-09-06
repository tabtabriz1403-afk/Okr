import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import {
  DepartmentInfo,
  StrategicGoal,
  SubGoal,
  OKRItem,
  RoutineTask,
  GroupSummaryMetric,
  SeasonKey,
  OKRStatus,
  ManagerEval,
  RoutineFrequency,
} from '../types';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_OKRS,
  INITIAL_SUB_GOALS,
  INITIAL_STRATEGIC_GOALS,
  INITIAL_ROUTINES,
} from '../data/sampleData';

/**
 * Extracts clean Google Spreadsheet ID from various URL shapes or raw ID
 */
export function extractSheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  
  // Format: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit...
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  
  // Format: pub?id=... or id=...
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }

  // If user pasted just the ID
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  return trimmed;
}

/**
 * Builds Google Sheets view URL
 */
export function buildSheetViewUrl(sheetIdOrUrl: string): string {
  if (!sheetIdOrUrl) return 'https://sheets.new';
  if (sheetIdOrUrl.startsWith('http')) return sheetIdOrUrl;
  const id = extractSheetId(sheetIdOrUrl);
  return `https://docs.google.com/spreadsheets/d/${id}/edit`;
}

/**
 * Builds CSV export link for a Google Sheet
 */
export function buildSheetCsvUrl(sheetIdOrUrl: string, sheetName?: string): string {
  const id = extractSheetId(sheetIdOrUrl);
  if (!id) return '';
  if (sheetName) {
    return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  }
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
}

/**
 * Computes individual group summary metrics
 */
export function computeGroupMetrics(
  dept: DepartmentInfo,
  strategicGoals: StrategicGoal[],
  subGoals: SubGoal[],
  okrs: OKRItem[],
  routines: RoutineTask[],
  rank: number = 1
): GroupSummaryMetric {
  const groupStrategic = strategicGoals.filter((g) => g.department === dept.name);
  const groupSubGoals = subGoals.filter((s) => s.department === dept.name);
  const subIds = new Set(groupSubGoals.map((s) => s.id));
  const groupOkrs = okrs.filter((o) => subIds.has(o.subGoalId));
  const groupRoutines = routines.filter((r) => r.department === dept.name);

  const completedOkrs = groupOkrs.filter((o) => o.status === 'completed').length;
  const behindOkrs = groupOkrs.filter((o) => o.status === 'behind' || o.managerEvaluation === 'behind').length;
  const inProgressOkrs = groupOkrs.filter((o) => o.status === 'in_progress').length;
  const remainingOkrs = groupOkrs.length - completedOkrs;

  const avgProgress =
    groupOkrs.length > 0
      ? Math.round(
          groupOkrs.reduce(
            (sum, item) => sum + (Number(item.month1Progress || 0) + Number(item.month2Progress || 0) + Number(item.month3Progress || 0)) / 3,
            0
          ) / groupOkrs.length
        )
      : 0;

  let totalCheckboxes = 0;
  let checkedCount = 0;
  groupRoutines.forEach((r) => {
    for (let m = 1; m <= 12; m++) {
      totalCheckboxes++;
      if (r.monthsChecked && r.monthsChecked[m]) {
        checkedCount++;
      }
    }
  });

  const routinesCompletionRate = totalCheckboxes > 0 ? Math.round((checkedCount / totalCheckboxes) * 100) : 0;

  return {
    groupId: dept.id,
    groupName: dept.name,
    managerName: dept.managerName,
    color: dept.color,
    totalStrategic: groupStrategic.length,
    totalSubGoals: groupSubGoals.length,
    totalOkrs: groupOkrs.length,
    completedOkrs,
    inProgressOkrs,
    behindOkrs,
    remainingOkrs,
    avgProgress,
    totalRoutines: groupRoutines.length,
    routinesCompletionRate,
    syncStatus: dept.syncStatus,
    lastSyncTime: dept.lastSyncTime,
    sheetUrl: dept.sheetUrl,
    rank,
  };
}

/**
 * Computes metrics for all 11 groups and ranks them
 */
export function computeAllGroupsMetrics(
  departments: DepartmentInfo[],
  strategicGoals: StrategicGoal[],
  subGoals: SubGoal[],
  okrs: OKRItem[],
  routines: RoutineTask[]
): GroupSummaryMetric[] {
  const unranked = departments.map((dept) =>
    computeGroupMetrics(dept, strategicGoals, subGoals, okrs, routines, 0)
  );

  // Sort by avgProgress descending, then completedOkrs descending
  const sorted = [...unranked].sort((a, b) => {
    if (b.avgProgress !== a.avgProgress) {
      return b.avgProgress - a.avgProgress;
    }
    return b.completedOkrs - a.completedOkrs;
  });

  return sorted.map((metric, idx) => ({
    ...metric,
    rank: idx + 1,
  }));
}

/**
 * Builds a stunning, executive, highly graphic standalone Google Sheet / Excel workbook
 * exclusively for one specific department. Contains 5 sheets:
 * 1. 📊 داشبورد_مدیریتی (Executive Dashboard & KPI Scorecards)
 * 2. 🎯 پیگیری_فصلی_OKR (Quarterly OKRs Matrix with monthly tracking & formulas)
 * 3. 📋 اهداف_کلان_و_خرد (Strategic Alignment)
 * 4. 🔄 چک‌لیست_روتین_۱۲ماهه (12-Month Routines Checklist)
 * 5. 💡 راهنمای_گوگل_شیت (Visual Setup & Formula Guide)
 */
export function generateStunningGroupWorkbook(group: DepartmentInfo, currentYear: number = 1404): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // Find sample subgoals and okrs for this department if available
  const groupStrategic = INITIAL_STRATEGIC_GOALS.filter(
    (g) => g.department === group.name || g.code.includes(group.code)
  );
  const groupSubGoals = INITIAL_SUB_GOALS.filter((s) => s.department === group.name);
  const groupOkrs = INITIAL_OKRS.filter((o) => {
    const sub = INITIAL_SUB_GOALS.find((s) => s.id === o.subGoalId);
    return sub && sub.department === group.name;
  });
  const groupRoutines = INITIAL_ROUTINES.filter(
    (r) => r.department === group.name || r.assignedTo === group.managerName
  );

  // -------------------------------------------------------------
  // Sheet 1: 📊 داشبورد_مدیریتی (Executive Dashboard)
  // -------------------------------------------------------------
  const dashRows: (string | number)[][] = [
    [`🏢 داشبورد اختصاصی پایش و برنامه‌ریزی OKR - دپارتمان ${group.name}`],
    [`کد دپارتمان: ${group.code}`, `مدیر مسئول: ${group.managerName}`, `عنوان سمت: ${group.roleTitle || 'مدیر ارشد'}`, `سال مالی: ${currentYear}`],
    [''],
    ['📊 کارت‌های امتیازی و شاخص‌های کلیدی دپارتمان (Executive KPI Scorecards)'],
    ['عنوان شاخص کلیدی', 'مقدار / درصد سیستمی', 'فرمول گوگل‌شیت (Live Formula)', 'وضعیت و راهنما'],
    ['میانگین پیشرفت فصلی کل OKRها', 85, "=ROUND(AVERAGE('پیگیری_فصلی_OKR'!K10:K30), 1)", 'محاسبه خودکار میانگین عملکرد فصلی'],
    ['تعداد کل نتایج کلیدی (Key Results)', 6, "=COUNTA('پیگیری_فصلی_OKR'!D10:D30)", 'کل تعهدات تعریف شده دپارتمان در سال'],
    ['تعداد اهداف با موفقیت کامل (۱۰۰٪)', 3, "=COUNTIF('پیگیری_فصلی_OKR'!M10:M30, \"تکمیل شده\")", 'اهداف به ثمر نشسته و نهایی شده'],
    ['تعداد اهداف دارای مانده و تأخیر', 1, "=COUNTIF('پیگیری_فصلی_OKR'!M10:M30, \"عقب‌افتاده\")", 'نیازمند اقدام فوری و برنامه جبرانی'],
    ['شاخص سلامت عملکردی دپارتمان', '🟢 پیشرو و عالی', '=IF(B6>=85, "🟢 پیشرو و عالی", IF(B6>=65, "🟡 مطابق برنامه", "🔴 نیازمند بازنگری"))', 'سنجش خودکار سلامت با فرمول شرطی'],
    [''],
    ['📈 پایش پیشرفت به تفکیک ۴ فصل سال همراه با نمودار میله‌ای داخل سلول گوگل‌شیت'],
    ['فصل برنامه', 'تعداد اهداف', 'میانگین تحقق (%)', 'نمودار میله‌ای درون‌سلولی گوگل‌شیت (Sparkline Bar)', 'ارزیابی مدیر ارشد'],
    ['بهار (فصل اول)', 2, 90, '=SPARKLINE(C14, {"charttype","bar";"color1","#10b981";"max",100})', '🟢 پیشرو'],
    ['تابستان (فصل دوم)', 2, 70, '=SPARKLINE(C15, {"charttype","bar";"color1","#3b82f6";"max",100})', '🟡 مطابق برنامه'],
    ['پاییز (فصل سوم)', 1, 30, '=SPARKLINE(C16, {"charttype","bar";"color1","#f59e0b";"max",100})', '⏳ در جریان'],
    ['زمستان (فصل چهارم)', 1, 0, '=SPARKLINE(C17, {"charttype","bar";"color1","#94a3b8";"max",100})', '⏳ برنامه‌ریزی شده'],
    [''],
    ['📝 نکات و مصوبات آخرین جلسه بازبینی:'],
    [`۱. مدیر دپارتمان (${group.managerName}) مسئول به‌روزرسانی هفتگی اعداد ماهانه است.`],
    ['۲. در صورت بروز هرگونه مانع بحرانی، ستون «اقدام اصلاحی» در برگه دوم تکمیل و فوراً منعکس شود.'],
  ];

  const wsDash = XLSX.utils.aoa_to_sheet(dashRows);
  wsDash['!cols'] = [
    { wch: 32 },
    { wch: 22 },
    { wch: 42 },
    { wch: 38 },
    { wch: 20 },
  ];

  // -------------------------------------------------------------
  // Sheet 2: 🎯 پیگیری_فصلی_OKR (Quarterly OKRs Matrix)
  // -------------------------------------------------------------
  const okrHeaderRows: (string | number)[][] = [
    [`🎯 ماتریس پیگیری و سنجش نتایج کلیدی (OKR) دپارتمان ${group.name}`],
    ['راهنمای تکمیل: مقادیر هدف و پیشرفت ماهانه (۱ تا ۳) را وارد کنید. ستون میانگین و نمودار میله‌ای به صورت خودکار رسم می‌شوند.'],
    [''],
    [
      'ردیف',
      'فصل',
      'کد اقدام خرد',
      'عنوان نتیجه کلیدی (Key Result)',
      'مقدار هدف',
      'مقدار فعلی',
      'واحد سنجش',
      'پیشرفت ماه ۱ (%)',
      'پیشرفت ماه ۲ (%)',
      'پیشرفت ماه ۳ (%)',
      'میانگین فصلی (%)',
      'نمودار پیشرفت (Sparkline)',
      'وضعیت اجرا',
      'ارزیابی مدیر',
      'موانع و چالش‌ها',
      'برنامه اقدام اصلاحی و جبرانی',
    ],
  ];

  const okrDataRows: (string | number)[][] = [];

  // If we have actual mock OKRs for this department, use them; otherwise create realistic ones
  if (groupOkrs.length > 0) {
    groupOkrs.forEach((o, idx) => {
      const sub = groupSubGoals.find((s) => s.id === o.subGoalId);
      const rowNum = 5 + idx; // 1-indexed row in Excel
      const qFa = o.quarter === 'spring' ? 'بهار' : o.quarter === 'summer' ? 'تابستان' : o.quarter === 'autumn' ? 'پاییز' : 'زمستان';
      const statusFa = o.status === 'completed' ? 'تکمیل شده' : o.status === 'behind' ? 'عقب‌افتاده' : 'در جریان';
      const evalFa = o.managerEvaluation === 'ahead' ? '🟢 پیشرو' : o.managerEvaluation === 'behind' ? '🔴 عقب' : '🟡 مطابق برنامه';

      okrDataRows.push([
        idx + 1,
        qFa,
        sub?.code || `SG-${group.code}.${idx + 1}`,
        o.keyResultTitle,
        o.targetValue,
        o.currentValue,
        o.unit,
        o.month1Progress,
        o.month2Progress,
        o.month3Progress,
        `=ROUND(AVERAGE(H${rowNum}:J${rowNum}), 1)`,
        `=SPARKLINE(K${rowNum}, {"charttype","bar";"color1",IF(K${rowNum}>=85,"#10b981",IF(K${rowNum}>=60,"#3b82f6","#ef4444"));"max",100})`,
        statusFa,
        evalFa,
        o.obstaclesComment || 'ندارد',
        o.actionPlan || 'تداوم پایش منظم',
      ]);
    });
  } else {
    // Realistic domain-specific defaults
    const defaults = [
      { q: 'بهار', title: `ارتقای شاخص‌های کلیدی پایلوت در واحد ${group.name}`, target: '100', current: '90', unit: 'درصد', m1: 85, m2: 90, m3: 95, status: 'تکمیل شده', eval: '🟢 پیشرو', obstacle: 'ندارد', plan: 'تثبیت عملکرد' },
      { q: 'تابستان', title: `پیاده‌سازی فاز دوم و کاهش نرخ خطا به زیر ۲٪`, target: '2', current: '3.5', unit: 'درصد خطا', m1: 40, m2: 60, m3: 0, status: 'در جریان', eval: '🟡 مطابق برنامه', obstacle: 'نیاز به هماهنگی بین‌تیمی', plan: 'برگزاری جلسات هفتگی هماهنگی' },
      { q: 'پاییز', title: `بهینه‌سازی فرآیندهای داخلی و ارتقای رضایت ذینفعان`, target: '90', current: '60', unit: 'امتیاز', m1: 30, m2: 0, m3: 0, status: 'در جریان', eval: '🟡 مطابق برنامه', obstacle: 'کمبود زمان آموزش', plan: 'تخصیص کارگاه‌های آموزشی آنلاین' },
      { q: 'زمستان', title: `ارزیابی جامع سالانه و تدوین نقشه راه سال آتی`, target: '1', current: '0', unit: 'گزارش نهایی', m1: 0, m2: 0, m3: 0, status: 'در جریان', eval: '🟡 مطابق برنامه', obstacle: 'وابستگی به گزارشات فصول قبل', plan: 'آغاز پیش‌نویس از بهمن ماه' },
    ];

    defaults.forEach((d, idx) => {
      const rowNum = 5 + idx;
      okrDataRows.push([
        idx + 1,
        d.q,
        `SG-${group.code}.${idx + 1}`,
        d.title,
        d.target,
        d.current,
        d.unit,
        d.m1,
        d.m2,
        d.m3,
        `=ROUND(AVERAGE(H${rowNum}:J${rowNum}), 1)`,
        `=SPARKLINE(K${rowNum}, {"charttype","bar";"color1",IF(K${rowNum}>=85,"#10b981",IF(K${rowNum}>=60,"#3b82f6","#ef4444"));"max",100})`,
        d.status,
        d.eval,
        d.obstacle,
        d.plan,
      ]);
    });
  }

  const wsOkr = XLSX.utils.aoa_to_sheet([...okrHeaderRows, ...okrDataRows]);
  wsOkr['!cols'] = [
    { wch: 8 },   // ردیف
    { wch: 12 },  // فصل
    { wch: 14 },  // کد اقدام
    { wch: 45 },  // عنوان نتیجه کلیدی
    { wch: 12 },  // مقدار هدف
    { wch: 12 },  // مقدار فعلی
    { wch: 14 },  // واحد
    { wch: 15 },  // ماه ۱
    { wch: 15 },  // ماه ۲
    { wch: 15 },  // ماه ۳
    { wch: 18 },  // میانگین
    { wch: 26 },  // اسپارک‌لاین
    { wch: 16 },  // وضعیت
    { wch: 18 },  // ارزیابی مدیر
    { wch: 32 },  // موانع
    { wch: 35 },  // اقدام اصلاحی
  ];

  // -------------------------------------------------------------
  // Sheet 3: 📋 اهداف_کلان_و_خرد (Strategic Alignment)
  // -------------------------------------------------------------
  const stratRows: (string | number)[][] = [
    [`📋 نگاشت اهداف کلان سازمان و اقدامات خرد دپارتمان ${group.name}`],
    ['توضیح: این برگه ارتباط مستقیم برنامه‌های عملیاتی این دپارتمان با جهت‌گیری استراتژیک کل سازمان را نشان می‌دهد.'],
    [''],
    ['ردیف', 'کد اقدام خرد', 'کد هدف کلان مرتبط', 'عنوان اقدام عملیاتی', 'فصل هدف', 'سنجه موفقیت', 'وزن اقدام (۱-۱۰۰)', 'مسئول پیگیری', 'توضیحات و فرضیات'],
  ];

  if (groupSubGoals.length > 0) {
    groupSubGoals.forEach((sg, idx) => {
      const qFa = sg.suggestedSeason === 'spring' ? 'بهار' : sg.suggestedSeason === 'summer' ? 'تابستان' : sg.suggestedSeason === 'autumn' ? 'پاییز' : sg.suggestedSeason === 'winter' ? 'زمستان' : 'کل سال';
      stratRows.push([
        idx + 1,
        sg.code,
        groupStrategic[0]?.code || `G-${group.code}`,
        sg.title,
        qFa,
        sg.targetMetric,
        25,
        group.managerName,
        sg.notes || 'اقدام کلیدی برنامه سالانه',
      ]);
    });
  } else {
    stratRows.push(
      [1, `SG-${group.code}.1`, `G-${group.code}`, `پیاده‌سازی برنامه ارتقای کیفیت تیم ${group.name}`, 'بهار', '۱۰۰٪ تکمیل فاز ۱', 30, group.managerName, 'اولویت استراتژیک ۳ ماهه نخست'],
      [2, `SG-${group.code}.2`, `G-${group.code}`, `اتوماسیون فرآیندها و کاهش زمان پاسخ‌دهی`, 'تابستان', '۳۰٪ کاهش زمان', 30, group.managerName, 'هماهنگی با تیم فناوری و زیرساخت'],
      [3, `SG-${group.code}.3`, `G-${group.code}`, `طراحی سیستم گزارش‌دهی خودکار هفتگی`, 'پاییز', 'سامانه فعال و بدون خطا', 40, group.managerName, 'مبنای مانده‌گیری فصلی']
    );
  }

  const wsStrat = XLSX.utils.aoa_to_sheet(stratRows);
  wsStrat['!cols'] = [
    { wch: 8 },
    { wch: 14 },
    { wch: 16 },
    { wch: 45 },
    { wch: 14 },
    { wch: 22 },
    { wch: 16 },
    { wch: 20 },
    { wch: 35 },
  ];

  // -------------------------------------------------------------
  // Sheet 4: 🔄 چک‌لیست_روتین_۱۲ماهه (12-Month Routines Checklist)
  // -------------------------------------------------------------
  const routineRows: (string | number)[][] = [
    [`🔄 چک‌لیست فرآیندها و روتین‌های دوره‌ای دپارتمان ${group.name}`],
    ['راهنما: در ستون هر ماه در صورت انجام عبارت «بله» درج شود. درصد پایبندی سالانه به صورت خودکار محاسبه می‌شود.'],
    [''],
    [
      'ردیف',
      'عنوان روتین / فرآیند',
      'توالی (روزانه/هفتگی/ماهانه)',
      'مسئول اجرا',
      'فروردین',
      'اردیبهشت',
      'خرداد',
      'تیر',
      'مرداد',
      'شهریور',
      'مهر',
      'آبان',
      'آذر',
      'دی',
      'بهمن',
      'اسفند',
      'پایبندی سالانه (%)',
      'نمودار پایبندی (Sparkline)',
      'یادداشت و جزئیات',
    ],
  ];

  const effectiveRoutines = groupRoutines.length > 0 ? groupRoutines : [
    { title: `پایش و ارسال گزارش هفتگی شاخص‌های ${group.name}`, freq: 'هفتگی', resp: group.managerName },
    { title: `جلسه ماهانه مانده‌گیری اهداف با اعضای تیم`, freq: 'ماهانه', resp: group.managerName },
    { title: `ارزیابی ریسک‌ها و به‌روزرسانی مستندات واحد`, freq: 'ماهانه', resp: group.managerName },
  ];

  effectiveRoutines.forEach((r: any, idx) => {
    const rowNum = 5 + idx;
    routineRows.push([
      idx + 1,
      r.title,
      r.frequency === 'daily' ? 'روزانه' : r.frequency === 'weekly' || r.freq === 'هفتگی' ? 'هفتگی' : 'ماهانه',
      r.responsible || group.managerName,
      'بله',
      'بله',
      'بله',
      'بله',
      'بله',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      `=ROUND(COUNTIF(E${rowNum}:P${rowNum}, "بله") / 12 * 100, 0)`,
      `=SPARKLINE(Q${rowNum}, {"charttype","bar";"color1","#8b5cf6";"max",100})`,
      'برگزاری طبق تقویم سالانه',
    ]);
  });

  const wsRoutine = XLSX.utils.aoa_to_sheet(routineRows);
  wsRoutine['!cols'] = [
    { wch: 8 },
    { wch: 40 },
    { wch: 16 },
    { wch: 18 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 18 },
    { wch: 24 },
    { wch: 28 },
  ];

  // -------------------------------------------------------------
  // Sheet 5: 💡 راهنمای_گوگل_شیت (Visual Setup & Sync Guide)
  // -------------------------------------------------------------
  const guideRows: (string | number)[][] = [
    [`💡 راهنمای جامع استفاده از گوگل شیت اختصاصی دپارتمان ${group.name}`],
    [''],
    ['مرحله', 'اقدام لازم', 'توضیحات و نکات کلیدی'],
    ['۱', 'آپلود در گوگل درایو', 'وارد Google Drive شوید، دکمه New > File Upload را زده و این فایل اکسل را انتخاب نمایید.'],
    ['۲', 'تبدیل به Google Sheet', 'روی فایل آپلود شده کلیک راست کنید و Open with > Google Sheets را بزنید.'],
    ['۳', 'تنظیم دسترسی شیت', 'روی دکمه Share در بالای صفحه گوگل شیت بزنید و دسترسی را روی "Anyone with the link can edit/view" قرار دهید.'],
    ['۴', 'کپی لینک در سامانه مرکزی', 'لینک شیت را در کادر تنظیمات دپارتمان در سامانه مرکزی قرار دهید تا اطلاعات بلادرنگ دریافت شوند.'],
    ['۵', 'نحوه کارکرد فرمول‌ها', 'فرمول‌های =SPARKLINE(...) و =AVERAGE(...) به طور مستقیم در گوگل شیت بدون نیاز به اکستنشن اجرا می‌شوند.'],
    ['۶', 'همگام‌سازی فوری', 'هر زمان که اعداد را تغییر دادید، با زدن دکمه «همگام‌سازی» در سامانه مرکزی، اطلاعات بدون فوت وقت بروزرسانی می‌گردد.'],
  ];

  const wsGuide = XLSX.utils.aoa_to_sheet(guideRows);
  wsGuide['!cols'] = [
    { wch: 10 },
    { wch: 28 },
    { wch: 65 },
  ];

  // Append sheets with Persian titles
  XLSX.utils.book_append_sheet(wb, wsDash, 'داشبورد_مدیریتی');
  XLSX.utils.book_append_sheet(wb, wsOkr, 'پیگیری_فصلی_OKR');
  XLSX.utils.book_append_sheet(wb, wsStrat, 'اهداف_کلان_و_خرد');
  XLSX.utils.book_append_sheet(wb, wsRoutine, 'چک‌لیست_روتین_۱۲ماهه');
  XLSX.utils.book_append_sheet(wb, wsGuide, 'راهنمای_گوگل_شیت');

  // Set Right-to-Left (RTL) for all worksheets
  [wsDash, wsOkr, wsStrat, wsRoutine, wsGuide].forEach((ws) => {
    if (!ws['!views']) ws['!views'] = [];
    ws['!views'].push({ RTL: true });
  });

  return wb;
}

/**
 * Downloads a standalone, dedicated, highly graphic Google Sheet (.xlsx) for a specific group
 */
export function downloadGroupTemplateExcel(group: DepartmentInfo, currentYear: number = 1404) {
  const wb = generateStunningGroupWorkbook(group, currentYear);
  const cleanName = group.name.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '_');
  const fileName = `گوگل_شیت_اختصاصی_${group.code}_${cleanName}_${currentYear}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Generates and downloads a ZIP package containing 11 SEPARATE standalone Google Sheet (.xlsx) files,
 * one dedicated file per department, fulfilling the requirement:
 * "برای هر گروه یک گوگل شیت جداگانه می‌خوام نه فقط یک شیت!"
 */
export async function downloadAll11SeparateSheetsZip(
  departments: DepartmentInfo[],
  currentYear: number = 1404,
  onProgress?: (percent: number, currentGroupName: string) => void
): Promise<void> {
  const zip = new JSZip();

  // Instructions readme inside the ZIP
  const readmeContent = `بسته جامع ۱۱ گوگل شیت اختصاصی و مستقل دپارتمان‌های سازمان - سال ${currentYear}
=======================================================================
این بسته حاوی ۱۱ فایل اکسل مستقل و مجزا است که هر کدام برای یک گروه سازمانی به صورت کامل و با داشبورد، فرمول‌های پیشرفته، پیگیری فصلی OKRها و چک‌لیست ۱۲ ماهه طراحی شده است.

فهرست ۱۱ گوگل شیت مجزا:
${departments
  .map(
    (d, i) =>
      `${(i + 1).toString().padStart(2, '0')}. کد: ${d.code} | دپارتمان: ${d.name} | مدیر مسئول: ${d.managerName}`
  )
  .join('\n')}

نحوه استفاده در گوگل شیت:
۱. فایل هر دپارتمان را در پوشه Google Drive مربوط به همان دپارتمان آپلود کنید.
۲. با راست کلیک روی فایل، گزینه Open with > Google Sheets را انتخاب فرمایید.
۳. لینک گوگل شیت را با مدیر همان واحد به اشتراک بگذارید تا اهداف و مقادیر ماهانه را تکمیل کنند.
۴. لینک شیت را در سامانه مرکزی ثبت نمایید تا تمامی ۱۱ شیت به صورت تجمیعی پایش شوند.
`;

  zip.file('راهنمای_استفاده_از_۱۱_گوگل_شیت.txt', readmeContent);

  // Generate each of the 11 workbooks as separate files in the ZIP
  for (let i = 0; i < departments.length; i++) {
    const dept = departments[i];
    if (onProgress) {
      onProgress(Math.round(((i + 1) / departments.length) * 90), dept.name);
    }

    const wb = generateStunningGroupWorkbook(dept, currentYear);
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    const orderNum = (i + 1).toString().padStart(2, '0');
    const cleanName = dept.name.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '_');
    const fileName = `${orderNum}_گوگل_شیت_اختصاصی_${dept.code}_${cleanName}.xlsx`;

    zip.file(fileName, excelBuffer);
  }

  if (onProgress) {
    onProgress(95, 'در حال فشرده‌سازی و ایجاد فایل ZIP...');
  }

  // Generate ZIP Blob
  const blob = await zip.generateAsync({ type: 'blob' });

  // Trigger download in browser
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `پکیج_کامل_۱۱_گوگل_شیت_اختصاصی_دپارتمان‌ها_${currentYear}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);

  if (onProgress) {
    onProgress(100, 'دانلود کامل شد.');
  }
}

/**
 * Legacy support: Downloads a single master XLSX containing separate sheets for all 11 groups
 */
export function downloadConsolidatedAll11TemplatesExcel(departments: DepartmentInfo[], currentYear: number = 1404) {
  const wb = XLSX.utils.book_new();

  // Master Summary Sheet
  const summaryRows: (string | number)[][] = [
    ['فهرست ۱۱ گروه سازمان و راهنمای لینک گوگل شیت‌ها'],
    [''],
    ['ردیف', 'کد گروه', 'نام گروه / دپارتمان', 'مدیر مسئول', 'عنوان سمت', 'وضعیت شیت', 'لینک شیت گوگل'],
  ];

  departments.forEach((dept, idx) => {
    summaryRows.push([
      idx + 1,
      dept.code,
      dept.name,
      dept.managerName,
      dept.roleTitle || '',
      dept.syncStatus === 'synced' ? 'متصل و فعال' : 'در انتظار اتصال',
      dept.sheetUrl || 'https://sheets.new',
    ]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  if (!wsSummary['!views']) wsSummary['!views'] = [];
  wsSummary['!views'].push({ RTL: true });
  XLSX.utils.book_append_sheet(wb, wsSummary, 'فهرست_۱۱_گروه');

  departments.forEach((dept) => {
    const groupWb = generateStunningGroupWorkbook(dept, currentYear);
    const mainSheet = groupWb.Sheets['پیگیری_فصلی_OKR'];
    if (mainSheet) {
      const sheetTitle = `${dept.code}_${dept.name.slice(0, 15)}`;
      XLSX.utils.book_append_sheet(wb, mainSheet, sheetTitle);
    }
  });

  XLSX.writeFile(wb, `مجموعه_جامع_قالب_۱۱_گروه_سازمان_${currentYear}.xlsx`);
}

/**
 * Parse CSV text into array of rows
 */
export function parseCSVToRows(csvText: string): (string | number)[][] {
  const lines = csvText.split(/\r?\n/);
  const rows: (string | number)[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    // Simple CSV parser handling quotes
    const cells: (string | number)[] = [];
    let cur = '';
    let inQuote = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuote && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (char === ',' && !inQuote) {
        cells.push(cur.trim());
        cur = '';
      } else if (char === '\t' && !inQuote) {
        cells.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    cells.push(cur.trim());
    rows.push(cells);
  }

  return rows;
}

/**
 * Converts parsed rows into structured OKRs and Goals for a specific department
 */
export function importDataForGroup(
  rows: (string | number)[][],
  group: DepartmentInfo,
  existingStrategic: StrategicGoal[],
  existingSubGoals: SubGoal[],
  currentYear: number = 1404
): {
  newStrategic: StrategicGoal[];
  newSubGoals: SubGoal[];
  newOkrs: OKRItem[];
} {
  const newStrategic: StrategicGoal[] = [];
  const newSubGoals: SubGoal[] = [];
  const newOkrs: OKRItem[] = [];

  // Ensure there is at least one strategic goal for this group
  let mainStrategic = existingStrategic.find((g) => g.department === group.name);
  if (!mainStrategic) {
    mainStrategic = {
      id: `sg-${group.id}-${Date.now()}`,
      code: `G-${group.code}`,
      title: `تحقق اهداف کلان و ارتقای بهره‌وری ${group.name}`,
      department: group.name,
      weight: 20,
      year: currentYear,
      description: `هدف کلان ثبت شده از طریق گوگل شیت واحد ${group.name}`,
      createdAt: `${currentYear}/01/01`,
    };
    newStrategic.push(mainStrategic);
  }

  // Look for header row to detect columns
  let okrHeaderIndex = -1;
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const rowStr = rows[i].map((c) => String(c).toLowerCase()).join(' ');
    if (rowStr.includes('نتیجه کلیدی') || rowStr.includes('key result') || rowStr.includes('پیشرفت') || rowStr.includes('فصل')) {
      okrHeaderIndex = i;
      break;
    }
  }

  const startRow = okrHeaderIndex >= 0 ? okrHeaderIndex + 1 : 1;

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 3) continue;

    const seasonRaw = String(row[0] || '').trim();
    let quarter: SeasonKey = 'spring';
    if (seasonRaw.includes('تابستان') || seasonRaw.toLowerCase().includes('summer') || seasonRaw.includes('2')) quarter = 'summer';
    else if (seasonRaw.includes('پاییز') || seasonRaw.toLowerCase().includes('autumn') || seasonRaw.includes('3')) quarter = 'autumn';
    else if (seasonRaw.includes('زمستان') || seasonRaw.toLowerCase().includes('winter') || seasonRaw.includes('4')) quarter = 'winter';

    const title = String(row[2] || row[1] || '').trim();
    if (!title || title.includes('عنوان نتیجه کلیدی') || title.length < 2) continue;

    const targetVal = String(row[3] || '100').trim();
    const currentVal = String(row[4] || '0').trim();
    const unit = String(row[5] || 'درصد').trim();

    const m1 = parseFloat(String(row[6] || '0').replace('%', '')) || 0;
    const m2 = parseFloat(String(row[7] || '0').replace('%', '')) || 0;
    const m3 = parseFloat(String(row[8] || '0').replace('%', '')) || 0;

    const statusRaw = String(row[9] || '').trim();
    let status: OKRStatus = 'in_progress';
    if (statusRaw.includes('تکمیل') || (m1 + m2 + m3) / 3 >= 98) status = 'completed';
    else if (statusRaw.includes('عقب') || statusRaw.includes('تأخیر')) status = 'behind';
    else if (statusRaw.includes('شروع نشده')) status = 'not_started';

    const evalRaw = String(row[10] || '').trim();
    let managerEvaluation: ManagerEval = 'on_track';
    if (evalRaw.includes('پیشرو') || evalRaw.toLowerCase().includes('ahead')) managerEvaluation = 'ahead';
    else if (evalRaw.includes('عقب') || evalRaw.toLowerCase().includes('behind')) managerEvaluation = 'behind';

    const obstacles = String(row[11] || '').trim();
    const actionPlan = String(row[12] || '').trim();

    // Create subGoal for this OKR
    const subGoalId = `sub-${group.id}-${i}-${Date.now()}`;
    const subGoal: SubGoal = {
      id: subGoalId,
      strategicGoalId: mainStrategic.id,
      code: `SG-${group.code}.${newSubGoals.length + 1}`,
      title: `اقدام عملیاتی: ${title}`,
      department: group.name,
      suggestedSeason: quarter,
      targetMetric: `${targetVal} ${unit}`,
      notes: obstacles ? `موانع: ${obstacles}` : undefined,
      createdAt: `${currentYear}/01/01`,
    };
    newSubGoals.push(subGoal);

    const okrItem: OKRItem = {
      id: `okr-${group.id}-${i}-${Date.now()}`,
      subGoalId,
      quarter,
      keyResultTitle: title,
      targetValue: targetVal,
      currentValue: currentVal,
      unit,
      month1Progress: Math.min(100, Math.max(0, m1)),
      month2Progress: Math.min(100, Math.max(0, m2)),
      month3Progress: Math.min(100, Math.max(0, m3)),
      status,
      managerEvaluation,
      obstaclesComment: obstacles || undefined,
      actionPlan: actionPlan || undefined,
      updatedAt: `${currentYear}/03/30`,
    };
    newOkrs.push(okrItem);
  }

  return { newStrategic, newSubGoals, newOkrs };
}

/**
 * Generates an easily copyable TSV text for Google Sheets pasting
 */
export function generateGroupTSVForClipboard(group: DepartmentInfo, year: number = 1404): string {
  const rows: (string | number)[][] = [
    ['فصل', 'کد اقدام', 'عنوان نتیجه کلیدی (Key Result)', 'مقدار هدف', 'مقدار فعلی', 'واحد', 'پیشرفت ماه ۱', 'پیشرفت ماه ۲', 'پیشرفت ماه ۳', 'وضعیت', 'ارزیابی مدیر', 'موانع و چالش‌ها', 'برنامه اصلاحی'],
    ['بهار', `SG-${group.code}.1`, `تحقق شاخص‌های استراتژیک ۳ ماهه نخست ${group.name}`, '100', '85', 'درصد', 80, 85, 90, 'در جریان', 'مطابق برنامه', 'تداخل پروژه‌ها', 'تقسیم کار مجدد'],
    ['تابستان', `SG-${group.code}.2`, `ارتقای بهره‌وری عملیاتی و کاهش هزینه‌ها`, '15', '12', 'درصد', 40, 60, 0, 'در جریان', 'پیشرو', 'ندارد', 'تداوم روند مثبت'],
    ['پاییز', `SG-${group.code}.3`, `استقرار سیستم نظارت کیفی و اتوماسیون گزارش‌دهی`, '1', '0.5', 'سیستم', 20, 0, 0, 'در جریان', 'مطابق برنامه', 'نیازمند پشتیبانی فنی', 'جلسه با تیم IT'],
  ];

  return rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? '');
          if (str.includes('\t') || str.includes('\n') || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join('\t')
    )
    .join('\n');
}
