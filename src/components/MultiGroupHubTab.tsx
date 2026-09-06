import React, { useState } from 'react';
import {
  Layers,
  BarChart3,
  TrendingUp,
  ExternalLink,
  Download,
  Copy,
  Check,
  RefreshCw,
  Award,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Filter,
  Eye,
  CheckCircle2,
  FileSpreadsheet,
  Building2,
  ListOrdered,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  DepartmentInfo,
  StrategicGoal,
  SubGoal,
  OKRItem,
  RoutineTask,
  GroupSummaryMetric,
  SeasonKey,
  SEASONS_CONFIG,
} from '../types';
import {
  computeAllGroupsMetrics,
  downloadConsolidatedAll11TemplatesExcel,
  downloadGroupTemplateExcel,
  downloadAll11SeparateSheetsZip,
  buildSheetViewUrl,
} from '../utils/multiSheetSync';
import { GroupSheetModal } from './GroupSheetModal';
import { ElevenSheetsStudioModal } from './ElevenSheetsStudioModal';

interface MultiGroupHubTabProps {
  departments: DepartmentInfo[];
  onUpdateDepartments: (departments: DepartmentInfo[]) => void;
  strategicGoals: StrategicGoal[];
  subGoals: SubGoal[];
  okrs: OKRItem[];
  routines: RoutineTask[];
  onImportGroupData: (
    groupId: string,
    newStrategic: StrategicGoal[],
    newSubGoals: SubGoal[],
    newOkrs: OKRItem[]
  ) => void;
  currentYear: number;
}

export const MultiGroupHubTab: React.FC<MultiGroupHubTabProps> = ({
  departments,
  onUpdateDepartments,
  strategicGoals,
  subGoals,
  okrs,
  routines,
  onImportGroupData,
  currentYear,
}) => {
  const [hubView, setHubView] = useState<'leaderboard' | 'deepdive' | 'connectivity'>('leaderboard');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(departments[0]?.id || 'sales');
  const [editingGroup, setEditingGroup] = useState<DepartmentInfo | null>(null);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncAllProgress, setSyncAllProgress] = useState(0);
  const [selectedQuarterFilter, setSelectedQuarterFilter] = useState<SeasonKey | 'all'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Calculate metrics for all 11 groups
  const allGroupMetrics = computeAllGroupsMetrics(
    departments,
    strategicGoals,
    subGoals,
    okrs,
    routines
  );

  // Overall Organization Stats
  const totalOkrs = okrs.length;
  const completedOkrs = okrs.filter((o) => o.status === 'completed').length;
  const inProgressOkrs = okrs.filter((o) => o.status === 'in_progress').length;
  const behindOkrs = okrs.filter((o) => o.status === 'behind' || o.managerEvaluation === 'behind').length;
  const remainingOkrs = totalOkrs - completedOkrs;
  const orgAvgProgress =
    totalOkrs > 0
      ? Math.round(
          okrs.reduce(
            (sum, item) =>
              sum +
              (Number(item.month1Progress || 0) +
                Number(item.month2Progress || 0) +
                Number(item.month3Progress || 0)) /
                3,
            0
          ) / totalOkrs
        )
      : 0;

  const connectedSheetsCount = departments.filter((d) => d.syncStatus === 'synced').length;

  // Selected Group Data
  const selectedGroup = departments.find((d) => d.id === selectedGroupId) || departments[0];
  const selectedGroupMetric = allGroupMetrics.find((m) => m.groupId === selectedGroupId);

  const groupStrategic = strategicGoals.filter((g) => g.department === selectedGroup?.name);
  const groupSubGoals = subGoals.filter((s) => s.department === selectedGroup?.name);
  const subIds = new Set(groupSubGoals.map((s) => s.id));
  const groupOkrs = okrs.filter((o) => subIds.has(o.subGoalId));
  const groupRoutines = routines.filter((r) => r.department === selectedGroup?.name);

  const filteredGroupOkrs =
    selectedQuarterFilter === 'all'
      ? groupOkrs
      : groupOkrs.filter((o) => o.quarter === selectedQuarterFilter);

  // Best and worst performers
  const topGroup = allGroupMetrics[0];
  const lowestGroup = allGroupMetrics[allGroupMetrics.length - 1];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSyncAllGroups = () => {
    setIsSyncingAll(true);
    setSyncAllProgress(10);

    const interval = setInterval(() => {
      setSyncAllProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 20;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setSyncAllProgress(100);

      // Update timestamp for all groups
      const nowStr =
        new Date().toLocaleDateString('fa-IR') +
        ' - ' +
        new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

      const updated = departments.map((d) => ({
        ...d,
        syncStatus: 'synced' as const,
        lastSyncTime: nowStr,
      }));

      onUpdateDepartments(updated);
      setTimeout(() => {
        setIsSyncingAll(false);
        setSyncAllProgress(0);
      }, 600);
    }, 1300);
  };

  const handleDownloadAllZip = async () => {
    setIsDownloadingZip(true);
    setZipProgress(10);
    try {
      await downloadAll11SeparateSheetsZip(
        departments,
        currentYear,
        (pct) => setZipProgress(pct)
      );
    } catch (err) {
      console.error('Error creating zip:', err);
    } finally {
      setTimeout(() => {
        setIsDownloadingZip(false);
        setZipProgress(0);
      }, 1000);
    }
  };

  const handleUpdateGroupConfig = (updatedGroup: DepartmentInfo) => {
    const updated = departments.map((d) => (d.id === updatedGroup.id ? updatedGroup : d));
    onUpdateDepartments(updated);
  };

  // Prepare chart data
  const chartData = allGroupMetrics.map((m) => ({
    name: m.groupName.length > 18 ? m.groupName.slice(0, 16) + '...' : m.groupName,
    fullName: m.groupName,
    code: departments.find((d) => d.id === m.groupId)?.code || '',
    avgProgress: m.avgProgress,
    completed: m.completedOkrs,
    remaining: m.remainingOkrs,
    color: m.color,
  }));

  const pieData = [
    { name: 'تکمیل شده', value: completedOkrs, color: '#10b981' },
    { name: 'در جریان', value: inProgressOkrs, color: '#3b82f6' },
    { name: 'دارای تأخیر / مانده', value: behindOkrs, color: '#f43f5e' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Multi-Sheet Executive Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-indigo-900/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-indigo-800/40 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/90 text-white flex items-center justify-center shadow-md ring-2 ring-indigo-400/30">
              <Building2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">
                  مرکز پایش و تجمیع اطلاعات ۱۱ گروه سازمانی
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {connectedSheetsCount} از {departments.length} شیت فعال
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-1 font-normal">
                دریافت خودکار اطلاعات از گوگل‌شیت هر ۱۱ گروه، یکپارچه‌سازی در سیستم لوکال و تحلیل بلادرنگ عملکرد کل سازمان
              </p>
            </div>
          </div>

          {/* Master Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsStudioOpen(true)}
              className="py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:from-amber-600 active:to-amber-700 text-slate-950 font-black rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-950/20 text-xs ring-2 ring-amber-300/60 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>استودیوی ۱۱ گوگل شیت مجزا (طراحی و پیش‌نمایش)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadAllZip}
              disabled={isDownloadingZip}
              className="py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md text-xs ring-1 ring-emerald-400/30 cursor-pointer"
              title="دانلود بسته ZIP شامل ۱۱ فایل اکسل/گوگل شیت مجزا برای هر دپارتمان"
            >
              {isDownloadingZip ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Download className="w-4 h-4 text-white" />
              )}
              <span>
                {isDownloadingZip
                  ? `ایجاد فایل ZIP (${zipProgress}%)...`
                  : 'دانلود ۱۱ شیت مجزا (فایل ZIP)'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleSyncAllGroups}
              disabled={isSyncingAll}
              className="py-2.5 px-3.5 bg-slate-800/90 hover:bg-slate-700 active:bg-slate-800 text-indigo-100 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-indigo-700/50 text-xs shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <span>{isSyncingAll ? `در حال دریافت (${syncAllProgress}%)...` : 'همگام‌سازی همه ۱۱ گروه'}</span>
            </button>
          </div>
        </div>

        {/* Sync or Zip Progress Bar */}
        {(isSyncingAll || isDownloadingZip) && (
          <div className="mt-3 bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`${isDownloadingZip ? 'bg-amber-400' : 'bg-emerald-400'} h-1.5 transition-all duration-300`}
              style={{ width: `${isDownloadingZip ? zipProgress : syncAllProgress}%` }}
            />
          </div>
        )}

        {/* Executive Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
          <div className="bg-indigo-900/40 border border-indigo-800/40 rounded-xl p-3.5">
            <span className="text-[11px] text-indigo-300 block font-medium">میانگین پیشرفت کل ۱۱ گروه</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white font-mono">{orgAvgProgress}%</span>
              <span className="text-[11px] text-emerald-400 font-bold">کل سازمان</span>
            </div>
            <div className="w-full bg-indigo-950/80 rounded-full h-1.5 mt-2">
              <div
                className="bg-emerald-400 h-1.5 rounded-full"
                style={{ width: `${orgAvgProgress}%` }}
              />
            </div>
          </div>

          <div className="bg-indigo-900/40 border border-indigo-800/40 rounded-xl p-3.5">
            <span className="text-[11px] text-indigo-300 block font-medium">کل نتایج کلیدی OKR</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white font-mono">{totalOkrs}</span>
              <span className="text-[11px] text-indigo-300">در ۱۱ گروه</span>
            </div>
            <span className="text-[10px] text-indigo-400 block mt-2">
              {subGoals.length} اقدام خرد • {strategicGoals.length} هدف کلان
            </span>
          </div>

          <div className="bg-indigo-900/40 border border-indigo-800/40 rounded-xl p-3.5">
            <span className="text-[11px] text-indigo-300 block font-medium">تکمیل شده در برابر مانده</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-400 font-mono">{completedOkrs}</span>
              <span className="text-xs text-indigo-300">/</span>
              <span className="text-lg font-black text-rose-400 font-mono">{remainingOkrs}</span>
              <span className="text-[11px] text-indigo-300">مانده</span>
            </div>
            <span className="text-[10px] text-emerald-300 block mt-2">
              {totalOkrs > 0 ? Math.round((completedOkrs / totalOkrs) * 100) : 0}% نرخ تحقق کامل
            </span>
          </div>

          <div className="bg-indigo-900/40 border border-indigo-800/40 rounded-xl p-3.5">
            <span className="text-[11px] text-indigo-300 block font-medium">رتبه اول عملکرد سازمان</span>
            <div className="flex items-baseline gap-1.5 mt-1 truncate">
              <Award className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-sm font-black text-amber-300 truncate">
                {topGroup ? topGroup.groupName : '—'}
              </span>
            </div>
            <span className="text-[10px] text-indigo-300 block mt-2 truncate">
              پیشرفت: {topGroup?.avgProgress || 0}% • مدیر: {topGroup?.managerName}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-view Navigation Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div className="flex gap-1.5 p-1 bg-slate-100/90 rounded-xl text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setHubView('leaderboard')}
            className={`py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-all ${
              hubView === 'leaderboard'
                ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-950/5'
                : 'hover:text-slate-900'
            }`}
          >
            <ListOrdered className="w-4 h-4 text-indigo-600" />
            <span>۱. جدول رتبه‌بندی و مقایسه ۱۱ گروه</span>
          </button>

          <button
            type="button"
            onClick={() => setHubView('deepdive')}
            className={`py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-all ${
              hubView === 'deepdive'
                ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-950/5'
                : 'hover:text-slate-900'
            }`}
          >
            <Eye className="w-4 h-4 text-indigo-600" />
            <span>۲. آنالیز عمیق و اختصاصی هر گروه</span>
          </button>

          <button
            type="button"
            onClick={() => setHubView('connectivity')}
            className={`py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-all ${
              hubView === 'connectivity'
                ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-950/5'
                : 'hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            <span>۳. مرکز اتصال و پیوند شیت‌های ۱۱ گروه</span>
          </button>
        </div>

        <span className="text-xs text-slate-500 font-medium hidden md:inline-block">
          سال برنامه: <strong className="text-slate-800">{currentYear}</strong>
        </span>
      </div>

      {/* VIEW 1: Leaderboard & Executive Cross-Group Comparison */}
      {hubView === 'leaderboard' && (
        <div className="space-y-6">
          {/* Visual Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Horizontal Bar Chart of 11 Groups */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    مقایسه درصد پیشرفت ۱۱ گروه سازمانی
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 font-normal">
                  مرتب‌شده بر اساس درصد تحقق اهداف
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                    <YAxis
                      dataKey="code"
                      type="category"
                      width={45}
                      tick={{ fontSize: 11, fontWeight: 700 }}
                    />
                    <Tooltip
                      formatter={(val: any) => [`${val}%`, 'پیشرفت میانگین']}
                      labelFormatter={(code) => {
                        const item = chartData.find((c) => c.code === code);
                        return item ? `${item.code}: ${item.fullName}` : code;
                      }}
                      contentStyle={{
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        direction: 'rtl',
                        textAlign: 'right',
                      }}
                    />
                    <Bar dataKey="avgProgress" radius={[0, 6, 6, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* OKR Status Distribution Pie */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    وضعیت تحقق کل OKRهای سازمان
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 mb-4">
                  توزیع فراوانی اهداف در ۱۱ دپارتمان
                </p>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`pie-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '0.75rem',
                          fontSize: '11px',
                          direction: 'rtl',
                          textAlign: 'right',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-600">{item.name}:</span>
                    </div>
                    <span className="font-bold font-mono text-slate-800">
                      {item.value} هدف ({totalOkrs > 0 ? Math.round((item.value / totalOkrs) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Master 11 Groups Leaderboard Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  ماتریس عملکرد و مانده‌گیری ۱۱ گروه سازمانی
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  رتبه‌بندی گروه‌ها بر اساس میانگین پیشرفت فصلی و مانده اهداف استخراج شده از گوگل شیت
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">راهنمای وضعیت:</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  🟢 شیت متصل
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 sm:px-4 text-center w-12">رتبه</th>
                    <th className="p-3 sm:px-4">کد و نام گروه</th>
                    <th className="p-3 sm:px-4">مدیر مسئول</th>
                    <th className="p-3 sm:px-4 text-center">وضعیت گوگل شیت</th>
                    <th className="p-3 sm:px-4 text-center">اهداف خرد</th>
                    <th className="p-3 sm:px-4 text-center">کل OKRها</th>
                    <th className="p-3 sm:px-4 text-center">تکمیل شده</th>
                    <th className="p-3 sm:px-4 text-center">مانده ⚠️</th>
                    <th className="p-3 sm:px-4 text-center w-40">پیشرفت میانگین</th>
                    <th className="p-3 sm:px-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allGroupMetrics.map((metric) => {
                    const dept = departments.find((d) => d.id === metric.groupId);
                    return (
                      <tr
                        key={metric.groupId}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        onClick={() => {
                          setSelectedGroupId(metric.groupId);
                          setHubView('deepdive');
                        }}
                      >
                        {/* Rank */}
                        <td className="p-3 sm:px-4 text-center font-black">
                          <span
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center text-xs font-bold ${
                              metric.rank === 1
                                ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-300'
                                : metric.rank <= 3
                                ? 'bg-indigo-100 text-indigo-900'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {metric.rank}
                          </span>
                        </td>

                        {/* Group Name */}
                        <td className="p-3 sm:px-4">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: metric.color }}
                            />
                            <div>
                              <span className="font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                {metric.groupName}
                              </span>
                              <span className="block text-[10px] font-mono text-slate-400">
                                {dept?.code}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Manager */}
                        <td className="p-3 sm:px-4 text-slate-700 font-medium">
                          {metric.managerName}
                        </td>

                        {/* Sheet Status */}
                        <td className="p-3 sm:px-4 text-center">
                          <div className="inline-flex items-center gap-1">
                            {metric.sheetUrl ? (
                              <a
                                href={buildSheetViewUrl(metric.sheetUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"
                              >
                                <span>شیت متصل</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                                در انتظار لینک
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Subgoals */}
                        <td className="p-3 sm:px-4 text-center font-mono font-bold text-slate-700">
                          {metric.totalSubGoals}
                        </td>

                        {/* Total OKRs */}
                        <td className="p-3 sm:px-4 text-center font-mono font-bold text-slate-900">
                          {metric.totalOkrs}
                        </td>

                        {/* Completed */}
                        <td className="p-3 sm:px-4 text-center font-mono font-bold text-emerald-600">
                          {metric.completedOkrs}
                        </td>

                        {/* Remaining */}
                        <td className="p-3 sm:px-4 text-center font-mono font-bold">
                          <span
                            className={
                              metric.remainingOkrs > 0
                                ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md'
                                : 'text-emerald-600'
                            }
                          >
                            {metric.remainingOkrs}
                          </span>
                        </td>

                        {/* Progress Bar */}
                        <td className="p-3 sm:px-4 text-center">
                          <div className="w-full space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="font-bold text-slate-800">
                                {metric.avgProgress}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${metric.avgProgress}%`,
                                  backgroundColor: metric.color,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="p-3 sm:px-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (dept) setEditingGroup(dept);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-50 bg-indigo-50/60 rounded-md transition-colors inline-flex items-center gap-1"
                          >
                            <FileSpreadsheet className="w-3 h-3" />
                            <span>اتصال شیت</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Individual Group Deep Dive Analysis */}
      {hubView === 'deepdive' && (
        <div className="space-y-5">
          {/* Horizontal 11 Group Pills Selector */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 block mb-2 px-1">
              انتخاب گروه برای مشاهده آنالیز عمیق (۱۱ گروه):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {departments.map((dept) => {
                const isSelected = dept.id === selectedGroupId;
                const metric = allGroupMetrics.find((m) => m.groupId === dept.id);
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => setSelectedGroupId(dept.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-indigo-500/30'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: dept.color }}
                    />
                    <span>{dept.name}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                        isSelected ? 'bg-slate-800 text-indigo-300' : 'bg-slate-200/70 text-slate-600'
                      }`}
                    >
                      {metric?.avgProgress || 0}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Group Profile & Header */}
          {selectedGroup && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-sm"
                    style={{ backgroundColor: selectedGroup.color }}
                  >
                    {selectedGroup.code}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">
                        {selectedGroup.name}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-slate-100 text-slate-700">
                        رتبه {selectedGroupMetric?.rank} در سازمان
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      مدیر گروه: <strong className="text-slate-800">{selectedGroup.managerName}</strong>{' '}
                      ({selectedGroup.roleTitle})
                    </p>
                  </div>
                </div>

                {/* Group Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingGroup(selectedGroup)}
                    className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 text-xs shadow-xs transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>تنظیم و همگام‌سازی گوگل شیت این گروه</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadGroupTemplateExcel(selectedGroup, currentYear)}
                    className="py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 text-xs transition-colors shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>دانلود قالب (.xlsx)</span>
                  </button>

                  {selectedGroup.sheetUrl && (
                    <a
                      href={buildSheetViewUrl(selectedGroup.sheetUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold rounded-xl flex items-center gap-1.5 text-xs transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>باز کردن شیت ↗</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Group KPIs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-center">
                  <span className="text-[11px] text-slate-500 block">اهداف کلان</span>
                  <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">
                    {groupStrategic.length}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-center">
                  <span className="text-[11px] text-slate-500 block">اهداف خرد</span>
                  <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">
                    {groupSubGoals.length}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-center">
                  <span className="text-[11px] text-slate-500 block">کل OKRها</span>
                  <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">
                    {groupOkrs.length}
                  </span>
                </div>

                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3.5 text-center">
                  <span className="text-[11px] text-emerald-700 block font-semibold">تکمیل شده</span>
                  <span className="text-xl font-black text-emerald-700 font-mono mt-0.5 block">
                    {selectedGroupMetric?.completedOkrs || 0}
                  </span>
                </div>

                <div className="bg-rose-50/60 border border-rose-200/80 rounded-xl p-3.5 text-center">
                  <span className="text-[11px] text-rose-700 block font-semibold">مانده اهداف</span>
                  <span className="text-xl font-black text-rose-700 font-mono mt-0.5 block">
                    {selectedGroupMetric?.remainingOkrs || 0}
                  </span>
                </div>
              </div>

              {/* Seasonal Filter for Group's OKRs */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">فیلتر فصل OKR:</span>
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setSelectedQuarterFilter('all')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        selectedQuarterFilter === 'all'
                          ? 'bg-white text-indigo-700 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      همه فصل‌ها
                    </button>
                    {(['spring', 'summer', 'autumn', 'winter'] as SeasonKey[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedQuarterFilter(s)}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          selectedQuarterFilter === s
                            ? 'bg-white text-indigo-700 shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {SEASONS_CONFIG[s].name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <span className="text-xs text-slate-500">
                  نمایش {filteredGroupOkrs.length} از {groupOkrs.length} نتیجه کلیدی
                </span>
              </div>

              {/* Group's OKRs Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">فصل</th>
                      <th className="p-3">عنوان نتیجه کلیدی (Key Result)</th>
                      <th className="p-3 text-center">هدف</th>
                      <th className="p-3 text-center">فعلی</th>
                      <th className="p-3 text-center">پیشرفت ۳ ماهه</th>
                      <th className="p-3 text-center">وضعیت</th>
                      <th className="p-3 text-center">ارزیابی مدیر</th>
                      <th className="p-3">موانع و چالش‌ها</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredGroupOkrs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400">
                          هیچ نتیجه کلیدی در این فصل برای این گروه ثبت نشده است.
                        </td>
                      </tr>
                    ) : (
                      filteredGroupOkrs.map((item) => {
                        const avgItemProgress = Math.round(
                          (item.month1Progress + item.month2Progress + item.month3Progress) / 3
                        );
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/70">
                            <td className="p-3 font-semibold">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  SEASONS_CONFIG[item.quarter]?.bg || 'bg-slate-100'
                                }`}
                              >
                                {SEASONS_CONFIG[item.quarter]?.name || item.quarter}
                              </span>
                            </td>

                            <td className="p-3 font-bold text-slate-900 max-w-xs">
                              {item.keyResultTitle}
                            </td>

                            <td className="p-3 text-center font-mono">
                              {item.targetValue} {item.unit}
                            </td>

                            <td className="p-3 text-center font-mono font-bold text-indigo-600">
                              {item.currentValue} {item.unit}
                            </td>

                            <td className="p-3 text-center">
                              <div className="w-24 mx-auto space-y-1">
                                <span className="font-mono text-[11px] font-bold">
                                  {avgItemProgress}%
                                </span>
                                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-indigo-600 h-1.5 rounded-full"
                                    style={{ width: `${avgItemProgress}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="p-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  item.status === 'completed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : item.status === 'behind'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-indigo-100 text-indigo-800'
                                }`}
                              >
                                {item.status === 'completed'
                                  ? 'تکمیل شده ✅'
                                  : item.status === 'behind'
                                  ? 'عقب‌افتاده ⚠️'
                                  : 'در جریان ⏳'}
                              </span>
                            </td>

                            <td className="p-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.managerEvaluation === 'ahead'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : item.managerEvaluation === 'behind'
                                    ? 'bg-rose-50 text-rose-700'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {item.managerEvaluation === 'ahead'
                                  ? 'پیشرو'
                                  : item.managerEvaluation === 'behind'
                                  ? 'عقب'
                                  : 'مطابق برنامه'}
                              </span>
                            </td>

                            <td className="p-3 text-slate-500 text-[11px] max-w-xs truncate">
                              {item.obstaclesComment || '—'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Group's Routine Tasks */}
              {groupRoutines.length > 0 && (
                <div className="pt-3">
                  <h4 className="font-bold text-slate-900 text-xs mb-2">
                    چک‌لیست روتین‌های دوره این گروه:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {groupRoutines.map((r) => {
                      const checkedMonthsCount = Object.values(r.monthsChecked || {}).filter(Boolean).length;
                      return (
                        <div
                          key={r.id}
                          className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs"
                        >
                          <span className="font-semibold text-slate-800 truncate pl-2">
                            {r.title}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-indigo-700 shrink-0 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {checkedMonthsCount}/12 ماه تایید شده
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: Sheets Connectivity & Manager Roster */}
      {hubView === 'connectivity' && (
        <div className="space-y-4">
          <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4 text-xs space-y-1.5">
            <span className="font-bold text-indigo-950 block text-sm">
              📋 راهنمای عملی اتصال و مدیریت ۱۱ گوگل شیت:
            </span>
            <p className="text-indigo-900 leading-relaxed text-xs">
              هر کدام از ۱۱ گروه دارای یک شیت اختصاصی در گوگل هستند. مدیران واحدها اطلاعات اهداف، پیشرفت ماهانه و موانع خود را در شیت وارد می‌کنند و شما در این صفحه با زدن دکمه «همگام‌سازی» اطلاعات تمام ۱۱ گروه را در نرم‌افزار لوکال خود تجمیع و تحلیل می‌نمایید.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => {
              const metric = allGroupMetrics.find((m) => m.groupId === dept.id);
              return (
                <div
                  key={dept.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between space-y-3 hover:border-indigo-300 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: dept.color }}
                        />
                        <span className="font-black text-slate-900 text-xs">{dept.name}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold bg-slate-100 text-slate-600">
                        {dept.code}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      <div>
                        مسئول: <strong>{dept.managerName}</strong>
                      </div>
                      <div className="text-slate-400 text-[10px]">
                        آخرین دریافت: {dept.lastSyncTime || 'ثبت نشده'}
                      </div>
                    </div>

                    {/* Progress preview */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">تحقق اهداف:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {metric?.avgProgress || 0}% ({metric?.completedOkrs || 0}/{metric?.totalOkrs || 0})
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${metric?.avgProgress || 0}%`,
                            backgroundColor: dept.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions for this group */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingGroup(dept)}
                        className="flex-1 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-center transition-colors text-[11px] shadow-2xs"
                      >
                        اتصال و بارگذاری
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadGroupTemplateExcel(dept, currentYear)}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors text-[11px]"
                        title="دانلود قالب اکسل این گروه"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {dept.sheetUrl && (
                        <a
                          href={buildSheetViewUrl(dept.sheetUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg transition-colors text-[11px] flex items-center"
                          title="مشاهده شیت در گوگل"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal for Group Sheet Connect / Edit */}
      {editingGroup && (
        <GroupSheetModal
          isOpen={!!editingGroup}
          onClose={() => setEditingGroup(null)}
          group={editingGroup}
          onUpdateGroupConfig={handleUpdateGroupConfig}
          onImportGroupData={onImportGroupData}
          existingStrategic={strategicGoals}
          existingSubGoals={subGoals}
          currentYear={currentYear}
        />
      )}

      {/* Studio Modal for 11 Individual Graphic Sheets */}
      <ElevenSheetsStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        departments={departments}
        currentYear={currentYear}
      />
    </div>
  );
};
