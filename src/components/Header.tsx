import React from 'react';
import { Target, FileSpreadsheet, Sparkles, RefreshCw, Layers, CheckSquare, BarChart3, ListFilter, Download, Building2 } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onExportExcel: () => void;
  onOpenGoogleSheetsGuide: () => void;
  onOpenAIModal: () => void;
  onResetData: () => void;
  currentYear: number;
  setCurrentYear: (year: number) => void;
  stats: {
    totalStrategic: number;
    totalSub: number;
    totalOkrs: number;
    completedOkrs: number;
    remainingOkrs: number;
    overallProgress: number;
  };
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onExportExcel,
  onOpenGoogleSheetsGuide,
  onOpenAIModal,
  onResetData,
  currentYear,
  setCurrentYear,
  stats,
}) => {
  const tabs = [
    { id: 'multigroups', label: '🏢 مرکز ۱۱ گروه و گوگل‌شیت‌ها', icon: Building2, badge: '۱۱ گروه' },
    { id: 'dashboard', label: '📊 داشبورد مانده‌گیری کل', icon: BarChart3, badge: `${stats.remainingOkrs} مانده` },
    { id: 'strategic', label: '🎯 اهداف کلان', icon: Target, badge: stats.totalStrategic },
    { id: 'subgoals', label: '🧩 اقدامات خرد واحدها', icon: Layers, badge: stats.totalSub },
    { id: 'okr', label: '🚀 پیگیری فصلی و ماهانه OKR', icon: ListFilter, badge: `${stats.overallProgress}%` },
    { id: 'routines', label: '📋 چک‌لیست روتین‌ها', icon: CheckSquare, badge: '۱۲ ماه' },
  ];

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs transition-colors">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3.5 gap-4 border-b border-slate-100/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 flex items-center justify-center text-white shadow-sm ring-1 ring-indigo-500/20">
              <Target className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  سامانه برنامه‌ریزی سالانه و داشبورد OKR
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                  نسخه سازمانی
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-normal">
                مدیریت سلسله‌مراتبی اهداف، پیگیری فصلی و ماهانه، چک‌لیست روتین و مانده‌گیری هوشمند
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Year Selector */}
            <div className="flex items-center bg-slate-100/90 rounded-lg p-1 border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCurrentYear(1404)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  currentYear === 1404
                    ? 'bg-white text-indigo-600 shadow-xs font-bold ring-1 ring-slate-950/5'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                سال ۱۴۰۴
              </button>
              <button
                type="button"
                onClick={() => setCurrentYear(1405)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  currentYear === 1405
                    ? 'bg-white text-indigo-600 shadow-xs font-bold ring-1 ring-slate-950/5'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                سال ۱۴۰۵
              </button>
            </div>

            {/* AI Assistant */}
            <button
              id="ai-assistant-btn"
              type="button"
              onClick={onOpenAIModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50/80 hover:bg-purple-100 border border-purple-200/80 rounded-lg transition-all shadow-2xs hover:shadow-xs active:scale-[0.99]"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
              <span>دستیار هوشمند OKR</span>
            </button>

            {/* Google Sheets Live Sync */}
            <button
              id="google-sheets-sync-btn"
              type="button"
              onClick={onOpenGoogleSheetsGuide}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/90 active:bg-emerald-200 border border-emerald-300/80 rounded-lg transition-all shadow-2xs hover:shadow-xs active:scale-[0.99]"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>ارسال به گوگل شیت (Sheets)</span>
            </button>

            {/* Export to Excel */}
            <button
              id="export-excel-btn"
              type="button"
              onClick={onExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-all hover:shadow-sm ring-1 ring-indigo-500/30"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>دریافت فایل اکسل (.xlsx)</span>
            </button>

            {/* Reset / Demo Data */}
            <button
              id="reset-demo-data-btn"
              type="button"
              onClick={onResetData}
              title="بارگذاری مجدد داده‌های نمونه"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-2 space-x-reverse overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs ring-1 ring-indigo-500/40'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-md font-bold transition-colors ${
                    isActive ? 'bg-indigo-700/80 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200/60'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
