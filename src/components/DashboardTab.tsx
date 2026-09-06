import React, { useState } from 'react';
import { StrategicGoal, SubGoal, OKRItem, RoutineTask, SeasonKey, SEASONS_CONFIG } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  CheckSquare,
  Filter,
  ArrowUpRight,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';

interface DashboardTabProps {
  strategicGoals: StrategicGoal[];
  subGoals: SubGoal[];
  okrs: OKRItem[];
  routines: RoutineTask[];
  onNavigateToTab: (tab: string) => void;
  onFilterDepartment?: (dept: string) => void;
  onOpenGoogleSheets?: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  strategicGoals,
  subGoals,
  okrs,
  routines,
  onNavigateToTab,
  onOpenGoogleSheets,
}) => {
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  // Filtered OKRs
  const filteredOkrs = okrs.filter((okr) => {
    const seasonMatch = selectedSeason === 'all' || okr.quarter === selectedSeason;
    const parentSub = subGoals.find((s) => s.id === okr.subGoalId);
    const deptMatch = selectedDepartment === 'all' || parentSub?.department === selectedDepartment;
    return seasonMatch && deptMatch;
  });

  // Filtered SubGoals
  const filteredSubGoals = subGoals.filter((sub) => {
    const deptMatch = selectedDepartment === 'all' || sub.department === selectedDepartment;
    const seasonMatch =
      selectedSeason === 'all' || sub.suggestedSeason === selectedSeason || sub.suggestedSeason === 'all_year';
    return deptMatch && seasonMatch;
  });

  // KPI Calculations
  const totalSubCount = filteredSubGoals.length;
  const totalOkrCount = filteredOkrs.length;
  const completedOkrsCount = filteredOkrs.filter((o) => o.status === 'completed').length;
  const inProgressOkrsCount = filteredOkrs.filter((o) => o.status === 'in_progress').length;
  const behindOkrsCount = filteredOkrs.filter((o) => o.status === 'behind').length;
  const notStartedOkrsCount = filteredOkrs.filter((o) => o.status === 'not_started').length;
  const remainingCount = totalOkrCount - completedOkrsCount; // مانده اهداف

  const avgProgress =
    totalOkrCount > 0
      ? Math.round(
          filteredOkrs.reduce(
            (acc, cur) => acc + (cur.month1Progress + cur.month2Progress + cur.month3Progress) / 3,
            0
          ) / totalOkrCount
        )
      : 0;

  // Routine check rate
  const totalRoutineChecks = routines.length * 12;
  const completedRoutineChecks = routines.reduce((acc, cur) => {
    return acc + Object.values(cur.monthsChecked).filter(Boolean).length;
  }, 0);
  const routinePct = totalRoutineChecks > 0 ? Math.round((completedRoutineChecks / totalRoutineChecks) * 100) : 0;

  // Extract all distinct departments
  const allDepartments = Array.from(
    new Set([
      ...strategicGoals.map((g) => g.department),
      ...subGoals.map((s) => s.department),
      ...routines.map((r) => r.department),
    ])
  );

  // Department Balance Table Data
  const deptPerformanceData = allDepartments.map((dept) => {
    const deptSub = subGoals.filter((s) => s.department === dept);
    const subIds = deptSub.map((s) => s.id);
    const deptOkrs = okrs.filter((o) => subIds.includes(o.subGoalId));
    const completed = deptOkrs.filter((o) => o.status === 'completed').length;
    const remaining = deptOkrs.filter((o) => o.status !== 'completed').length;
    const behind = deptOkrs.filter((o) => o.status === 'behind').length;
    const progress =
      deptOkrs.length > 0
        ? Math.round(
            deptOkrs.reduce(
              (acc, cur) => acc + (cur.month1Progress + cur.month2Progress + cur.month3Progress) / 3,
              0
            ) / deptOkrs.length
          )
        : 0;

    let alertColor = 'bg-emerald-500';
    let alertText = 'مطلوب (سبز)';
    if (progress < 50 || behind > 0) {
      alertColor = 'bg-rose-500';
      alertText = 'هشدار / عقب‌مانده (قرمز)';
    } else if (progress < 75) {
      alertColor = 'bg-amber-500';
      alertText = 'در جریان (زرد)';
    }

    return {
      dept,
      totalSub: deptSub.length,
      totalOkrs: deptOkrs.length,
      completed,
      remaining,
      behind,
      progress,
      alertColor,
      alertText,
    };
  });

  // Status Chart Data
  const statusPieData = [
    { name: 'انجام شده (تکمیل)', value: completedOkrsCount, color: '#10b981' },
    { name: 'در جریان (فعال)', value: inProgressOkrsCount, color: '#3b82f6' },
    { name: 'عقب‌مانده (نیازمند بازنگری)', value: behindOkrsCount, color: '#ef4444' },
    { name: 'شروع نشده (در نوبت)', value: notStartedOkrsCount, color: '#94a3b8' },
  ].filter((item) => item.value > 0);

  // Seasonal breakdown
  const seasonCards: { key: SeasonKey; name: string }[] = [
    { key: 'spring', name: 'بهار' },
    { key: 'summer', name: 'تابستان' },
    { key: 'autumn', name: 'پاییز' },
    { key: 'winter', name: 'زمستان' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-800">فیلترهای داشبورد مدیریتی</span>
            <p className="text-[11px] text-slate-500">پایش هوشمند بر اساس فصل و دپارتمان‌های سازمانی</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Season Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="filter-season-select" className="text-xs text-slate-600 font-semibold">فصل:</label>
            <select
              id="filter-season-select"
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="text-xs bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-colors"
            >
              <option value="all">تمام فصول سال</option>
              <option value="spring">فصل بهار (سه ماهه اول)</option>
              <option value="summer">فصل تابستان (سه ماهه دوم)</option>
              <option value="autumn">فصل پاییز (سه ماهه سوم)</option>
              <option value="winter">فصل زمستان (سه ماهه چهارم)</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="filter-dept-select" className="text-xs text-slate-600 font-semibold">واحد / دپارتمان:</label>
            <select
              id="filter-dept-select"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="text-xs bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-colors"
            >
              <option value="all">همه واحدهای سازمانی</option>
              {allDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {onOpenGoogleSheets && (
            <button
              id="dashboard-open-sheets-btn"
              type="button"
              onClick={onOpenGoogleSheets}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 rounded-lg transition-all shadow-2xs active:scale-[0.99]"
              title="ارسال مستقیم داده‌ها به گوگل شیت در گوگل درایو"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>ارسال به گوگل شیت</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Core KPI Colored Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: کل اهداف خرد */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-5 text-white shadow-xs hover:shadow-md transition-all relative overflow-hidden border border-indigo-500/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-indigo-100 text-xs font-semibold tracking-wide">کل اهداف خرد تعریف شده</p>
              <h3 className="text-3xl font-black mt-2 tracking-tight">{totalSubCount}</h3>
              <p className="text-indigo-200/90 text-xs mt-1">توسط گروه‌ها و واحدها</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs ring-1 ring-white/20">
              <Layers className="w-6 h-6 text-white" />
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToTab('subgoals')}
            className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-white/90 hover:text-white underline underline-offset-4 transition-colors"
          >
            <span>مشاهده لیست اهداف خرد</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: درصد پیشرفت کل OKRها */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl p-5 text-white shadow-xs hover:shadow-md transition-all relative overflow-hidden border border-emerald-500/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-emerald-100 text-xs font-semibold tracking-wide">میانگین پیشرفت کل OKRها</p>
              <div className="flex items-baseline gap-1 mt-2">
                <h3 className="text-3xl font-black tracking-tight">{avgProgress}</h3>
                <span className="text-xl font-bold">٪</span>
              </div>
              <p className="text-emerald-200/90 text-xs mt-1">{completedOkrsCount} از {totalOkrCount} هدف تکمیل شده</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs ring-1 ring-white/20">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-black/20 rounded-full h-2 mt-4 overflow-hidden">
            <div className="bg-white h-2 rounded-full transition-all duration-500 shadow-xs" style={{ width: `${avgProgress}%` }} />
          </div>
        </div>

        {/* Card 3: اهداف باقیمانده (مانده‌گیری) */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-5 text-white shadow-xs hover:shadow-md transition-all relative overflow-hidden border border-amber-400/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-amber-100 text-xs font-semibold tracking-wide">اهداف مانده (مانده‌گیری)</p>
              <h3 className="text-3xl font-black mt-2 tracking-tight">{remainingCount}</h3>
              <p className="text-amber-200/90 text-xs mt-1">
                {behindOkrsCount > 0 ? `${behindOkrsCount} هدف دارای تأخیر` : 'در جریان پیگیری منظم'}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs ring-1 ring-white/20">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToTab('okr')}
            className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-white/90 hover:text-white underline underline-offset-4 transition-colors"
          >
            <span>پیگیری مانده‌ها در OKR</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 4: وضعیت روتین‌ها */}
        <div className="bg-gradient-to-br from-purple-600 to-violet-700 rounded-xl p-5 text-white shadow-xs hover:shadow-md transition-all relative overflow-hidden border border-purple-500/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-purple-100 text-xs font-semibold tracking-wide">نرخ انجام کارهای روتین</p>
              <div className="flex items-baseline gap-1 mt-2">
                <h3 className="text-3xl font-black tracking-tight">{routinePct}</h3>
                <span className="text-xl font-bold">٪</span>
              </div>
              <p className="text-purple-200/90 text-xs mt-1">{completedRoutineChecks} از {totalRoutineChecks} تیک ثبت شده</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs ring-1 ring-white/20">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToTab('routines')}
            className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-white/90 hover:text-white underline underline-offset-4 transition-colors"
          >
            <span>باز کردن چک‌لیست روتین‌ها</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Seasonal Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {seasonCards.map(({ key, name }) => {
          const seasonConfig = SEASONS_CONFIG[key];
          const seasonOkrs = okrs.filter((o) => o.quarter === key);
          const seasonCompleted = seasonOkrs.filter((o) => o.status === 'completed').length;
          const seasonRemaining = seasonOkrs.length - seasonCompleted;
          const seasonAvg =
            seasonOkrs.length > 0
              ? Math.round(
                  seasonOkrs.reduce(
                    (acc, cur) => acc + (cur.month1Progress + cur.month2Progress + cur.month3Progress) / 3,
                    0
                  ) / seasonOkrs.length
                )
              : 0;

          return (
            <div
              key={key}
              className={`rounded-xl border p-4 bg-white hover:border-indigo-300 transition-all ${
                selectedSeason === key ? 'ring-2 ring-indigo-500/80 border-transparent shadow-xs' : 'border-slate-200/80 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${seasonConfig.bg.split(' ')[0]}`} />
                  <h4 className="font-bold text-slate-800 text-sm">{name}</h4>
                </div>
                <span className="text-xs font-extrabold text-indigo-600">{seasonAvg}%</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">ماه‌های: {seasonConfig.months.join('، ')}</p>

              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${seasonAvg}%` }} />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 mt-3 pt-2 border-t border-slate-100/90">
                <span>کل OKRها: <strong className="text-slate-900">{seasonOkrs.length}</strong></span>
                <span>تکمیل: <strong className="text-emerald-600">{seasonCompleted}</strong></span>
                <span>مانده: <strong className="text-amber-600">{seasonRemaining}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Balance Comparison Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">مقایسه عملکرد و مانده‌گیری به تفکیک واحدها</h3>
              <p className="text-xs text-slate-500 mt-0.5">تعداد اهداف تکمیل شده در برابر مانده‌ها و درصد تحقق</p>
            </div>
            <span className="text-xs bg-slate-100 px-2.5 py-1 rounded-md text-slate-700 font-semibold border border-slate-200/60">
              {deptPerformanceData.length} واحد سازمانی
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={deptPerformanceData}
                margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
              >
                <XAxis
                  dataKey="dept"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  angle={-10}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    if (name === 'completed') return [`${value} مورد`, 'اهداف محقق شده'];
                    if (name === 'remaining') return [`${value} مورد`, 'مانده (باقیمانده)'];
                    if (name === 'progress') return [`${value}٪`, 'درصد پیشرفت'];
                    return [value, name];
                  }}
                  contentStyle={{
                    direction: 'rtl',
                    borderRadius: '8px',
                    borderColor: '#cbd5e1',
                    fontSize: '12px',
                    fontFamily: 'Vazirmatn',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  formatter={(value) => {
                    if (value === 'completed') return 'اهداف محقق شده';
                    if (value === 'remaining') return 'مانده (باقیمانده)';
                    return value;
                  }}
                />
                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="completed" />
                <Bar dataKey="remaining" fill="#f59e0b" radius={[4, 4, 0, 0]} name="remaining" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* OKR Status Distribution Pie Chart */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">توزیع وضعیت OKRها</h3>
            <p className="text-xs text-slate-500 mt-0.5">وضعیت کلی تمام اهداف در بازه انتخابی</p>
          </div>

          <div className="h-56 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} هدف`, name]}
                  contentStyle={{
                    direction: 'rtl',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'Vazirmatn',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {statusPieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{item.value} هدف</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Department Balance & Tracking Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/70">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <span>جدول وضعیت و مانده‌گیری به تفکیک واحدها</span>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold border border-indigo-200/60">
                پایش لحظه‌ای
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              محاسبه خودکار تعداد اهداف، اقدامات محقق شده، مانده اهداف و وضعیت چراغ راهنما
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">نام گروه / واحد</th>
                <th className="py-3 px-4 text-center">اهداف خرد</th>
                <th className="py-3 px-4 text-center">تعداد OKRها</th>
                <th className="py-3 px-4 text-center text-emerald-700">محقق شده</th>
                <th className="py-3 px-4 text-center text-amber-700">مانده (باقیمانده)</th>
                <th className="py-3 px-4 text-center text-rose-700">عقب‌مانده</th>
                <th className="py-3 px-4 text-center min-w-[140px]">درصد پیشرفت</th>
                <th className="py-3 px-4 text-center">وضعیت چراغ راهنما</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deptPerformanceData.map((row) => (
                <tr key={row.dept} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>{row.dept}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium text-slate-700">{row.totalSub}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-900">{row.totalOkrs}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {row.completed}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      {row.remaining}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {row.behind > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {row.behind}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2 justify-center">
                      <span className="font-bold text-slate-800 w-8 text-left">{row.progress}%</span>
                      <div className="w-24 bg-slate-200/80 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            row.progress >= 80
                              ? 'bg-emerald-500'
                              : row.progress >= 50
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${row.progress}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                      <span className={`w-2 h-2 rounded-full ${row.alertColor} animate-pulse`} />
                      <span>{row.alertText}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Critical Action Items / Behind Schedule Panel */}
      {behindOkrsCount > 0 && (
        <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-5 text-rose-900 shadow-2xs">
          <div className="flex items-center gap-2.5 mb-3">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h4 className="font-bold text-sm">اقدامات نیازمند توجه فوری مدیریت ({behindOkrsCount} هدف عقب‌مانده)</h4>
          </div>
          <div className="space-y-2">
            {filteredOkrs
              .filter((o) => o.status === 'behind')
              .map((okr) => {
                const sub = subGoals.find((s) => s.id === okr.subGoalId);
                return (
                  <div
                    key={okr.id}
                    className="bg-white rounded-lg p-3.5 border border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rose-700">[{SEASONS_CONFIG[okr.quarter]?.name}]</span>
                        <span className="font-bold text-slate-800">{okr.keyResultTitle}</span>
                        {sub && <span className="text-slate-500">({sub.department})</span>}
                      </div>
                      {okr.obstaclesComment && (
                        <p className="text-slate-600 mt-1 text-[11px]">
                          <strong>موانع گزارش شده:</strong> {okr.obstaclesComment}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigateToTab('okr')}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg font-bold whitespace-nowrap self-end sm:self-center shadow-xs transition-colors"
                    >
                      بررسی و ارزیابی
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
