import * as XLSX from 'xlsx';
import { StrategicGoal, SubGoal, OKRItem, RoutineTask, SEASONS_CONFIG, MONTH_NAMES_PERSIAN } from '../types';

export function exportToExcel(
  strategicGoals: StrategicGoal[],
  subGoals: SubGoal[],
  okrs: OKRItem[],
  routines: RoutineTask[]
) {
  const wb = XLSX.utils.book_new();

  // 1. Dashboard Sheet (داشبورد مانده‌گیری)
  const dashboardData = [
    ['داشبورد مانده‌گیری و پایش برنامه سالانه'],
    [''],
    ['شاخص‌های کلیدی عملکرد (KPIs)', 'مقدار / فرمول', 'توضیحات'],
    ['کل اهداف خرد تعریف شده', subGoals.length, 'مجموع فعالیت‌های خرد تعریف شده توسط واحدها'],
    ['تعداد کل OKRهای فعال فصلی', okrs.length, 'تعداد نتایج کلیدی در دست اقدام'],
    ['اهداف تکمیل شده', okrs.filter((o) => o.status === 'completed').length, 'تکمیل ۱۰۰٪ یا وضعیت نهایی'],
    ['اهداف در جریان', okrs.filter((o) => o.status === 'in_progress').length, 'در حال پیگیری در فصل جاری'],
    ['مانده اهداف (باقیمانده و اقدام‌نشده)', okrs.filter((o) => o.status !== 'completed').length, 'نیازمند تمرکز و مانده‌گیری مدیریتی'],
    ['میانگین درصد تحقق کل OKRها', `${Math.round(okrs.reduce((acc, cur) => acc + (cur.month1Progress + cur.month2Progress + cur.month3Progress) / 3, 0) / (okrs.length || 1))}%`, 'میانگین وزنی پیشرفت سه ماهه'],
    [''],
    ['جدول مانده‌گیری به تفکیک واحدها / گروه‌ها'],
    ['نام گروه / واحد', 'تعداد اهداف خرد', 'تعداد OKRها', 'تکمیل شده', 'مانده (باقیمانده)', 'میانگین پیشرفت (%)'],
  ];

  // Group by department
  const depts = Array.from(
    new Set([
      ...strategicGoals.map((g) => g.department),
      ...subGoals.map((s) => s.department),
      ...routines.map((r) => r.department),
    ])
  );

  depts.forEach((dept) => {
    const deptSub = subGoals.filter((s) => s.department === dept);
    const subIds = deptSub.map((s) => s.id);
    const deptOkrs = okrs.filter((o) => subIds.includes(o.subGoalId));
    const completed = deptOkrs.filter((o) => o.status === 'completed').length;
    const remaining = deptOkrs.filter((o) => o.status !== 'completed').length;
    const avgProgress =
      deptOkrs.length > 0
        ? Math.round(
            deptOkrs.reduce((acc, cur) => acc + (cur.month1Progress + cur.month2Progress + cur.month3Progress) / 3, 0) /
              deptOkrs.length
          )
        : 0;

    dashboardData.push([dept, deptSub.length, deptOkrs.length, completed, remaining, `${avgProgress}%`]);
  });

  const wsDashboard = XLSX.utils.aoa_to_sheet(dashboardData);
  wsDashboard['!cols'] = [{ wch: 32 }, { wch: 20 }, { wch: 35 }, { wch: 16 }, { wch: 20 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsDashboard, 'داشبورد_مانده‌گیری');

  // 2. Strategic Goals Sheet (اهداف کلان)
  const strategicHeaders = ['کد هدف', 'عنوان هدف کلان', 'واحد مسئول', 'وزن هدف (۱-۱۰۰)', 'سال', 'توضیحات و استراتژی'];
  const strategicRows = strategicGoals.map((g) => [
    g.code,
    g.title,
    g.department,
    g.weight,
    g.year,
    g.description || '',
  ]);
  const wsStrategic = XLSX.utils.aoa_to_sheet([strategicHeaders, ...strategicRows]);
  wsStrategic['!cols'] = [{ wch: 12 }, { wch: 45 }, { wch: 24 }, { wch: 18 }, { wch: 10 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsStrategic, 'اهداف_کلان');

  // 3. Sub Goals Sheet (اهداف خرد)
  const subGoalHeaders = ['کد هدف خرد', 'هدف کلان مرجع', 'عنوان هدف خرد (اقدام عملیاتی)', 'گروه مسئول', 'فصل پیشنهادی', 'شاخص هدف', 'یادداشت‌ها'];
  const subGoalRows = subGoals.map((sg) => {
    const parentGoal = strategicGoals.find((g) => g.id === sg.strategicGoalId);
    const seasonLabel = sg.suggestedSeason === 'all_year' ? 'کل سال' : SEASONS_CONFIG[sg.suggestedSeason]?.name || sg.suggestedSeason;
    return [
      sg.code,
      parentGoal ? `[${parentGoal.code}] ${parentGoal.title}` : '',
      sg.title,
      sg.department,
      seasonLabel,
      sg.targetMetric || '',
      sg.notes || '',
    ];
  });
  const wsSubGoals = XLSX.utils.aoa_to_sheet([subGoalHeaders, ...subGoalRows]);
  wsSubGoals['!cols'] = [{ wch: 14 }, { wch: 35 }, { wch: 45 }, { wch: 24 }, { wch: 18 }, { wch: 22 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsSubGoals, 'اهداف_خرد');

  // 4. OKR Tracking Sheet (پیگیری فصلی و ماهانه)
  const okrHeaders = [
    'فصل',
    'کد هدف خرد',
    'عنوان نتیجه کلیدی (Key Result)',
    'مقدار هدف',
    'واحد سنجش',
    'ماه ۱ (%)',
    'ماه ۲ (%)',
    'ماه ۳ (%)',
    'میانگین پیشرفت فصلی (%)',
    'وضعیت',
    'ارزیابی مدیر',
    'موانع و اقدامات اصلاحی',
  ];
  const okrStatusMap: Record<string, string> = {
    completed: 'تکمیل شده ✅',
    in_progress: 'در جریان ⏳',
    not_started: 'شروع نشده ⏸️',
    behind: 'عقب‌مانده ⚠️',
  };
  const evalMap: Record<string, string> = {
    ahead: '🟢 فراتر از برنامه',
    on_track: '🟡 مطابق برنامه',
    behind: '🔴 عقب‌تر از برنامه',
    none: 'نامشخص',
  };

  const okrRows = okrs.map((item) => {
    const linkedSub = subGoals.find((s) => s.id === item.subGoalId);
    const avg = Math.round((item.month1Progress + item.month2Progress + item.month3Progress) / 3);
    const seasonName = SEASONS_CONFIG[item.quarter]?.name || item.quarter;
    return [
      seasonName,
      linkedSub ? `${linkedSub.code} - ${linkedSub.title}` : '',
      item.keyResultTitle,
      item.targetValue,
      item.unit,
      item.month1Progress,
      item.month2Progress,
      item.month3Progress,
      `${avg}%`,
      okrStatusMap[item.status] || item.status,
      evalMap[item.managerEvaluation] || item.managerEvaluation,
      item.obstaclesComment || '',
    ];
  });
  const wsOKR = XLSX.utils.aoa_to_sheet([okrHeaders, ...okrRows]);
  wsOKR['!cols'] = [
    { wch: 16 },
    { wch: 35 },
    { wch: 45 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 22 },
    { wch: 18 },
    { wch: 20 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, wsOKR, 'پیگیری_OKR_فصلی');

  // 5. Routines Sheet (چک‌لیست کارهای روتین)
  const routineHeaders = [
    'شرح کار روتین',
    'واحد مسئول',
    'تناوب',
    'مسئول پیگیری',
    ...MONTH_NAMES_PERSIAN.map((m) => m.name),
    'تعداد تیک‌ها',
    'درصد تکمیل',
  ];

  const freqMap: Record<string, string> = {
    daily: 'روزانه',
    weekly: 'هفتگی',
    monthly: 'ماهانه',
    quarterly: 'فصلی',
  };

  const routineRows = routines.map((r) => {
    const monthCols = MONTH_NAMES_PERSIAN.map((m) => (r.monthsChecked[m.id] ? '✓' : '-'));
    const checkedCount = Object.values(r.monthsChecked).filter(Boolean).length;
    const pct = Math.round((checkedCount / 12) * 100);
    return [r.title, r.department, freqMap[r.frequency] || r.frequency, r.assignedTo || '', ...monthCols, checkedCount, `${pct}%`];
  });
  const wsRoutines = XLSX.utils.aoa_to_sheet([routineHeaders, ...routineRows]);
  wsRoutines['!cols'] = [
    { wch: 45 },
    { wch: 22 },
    { wch: 14 },
    { wch: 18 },
    ...MONTH_NAMES_PERSIAN.map(() => ({ wch: 10 })),
    { wch: 14 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsRoutines, 'چک‌لیست_روتین‌ها');

  // Export file
  XLSX.writeFile(wb, `برنامه_سالانه_و_داشبورد_OKR_${new Date().getFullYear()}.xlsx`);
}
