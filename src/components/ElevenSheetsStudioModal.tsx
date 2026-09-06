import React, { useState } from 'react';
import {
  X,
  Download,
  ExternalLink,
  Copy,
  Check,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Eye,
  CheckCircle2,
  Clock,
  Building2,
  Table,
  BarChart3,
  ShieldCheck,
  Share2,
  ArrowRight,
  FolderArchive,
  RefreshCw,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import { DepartmentInfo, SeasonKey } from '../types';
import {
  downloadGroupTemplateExcel,
  downloadAll11SeparateSheetsZip,
  generateGroupTSVForClipboard,
} from '../utils/multiSheetSync';

interface ElevenSheetsStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: DepartmentInfo[];
  currentYear: number;
}

export const ElevenSheetsStudioModal: React.FC<ElevenSheetsStudioModalProps> = ({
  isOpen,
  onClose,
  departments,
  currentYear,
}) => {
  const [activeTab, setActiveTab] = useState<'cards' | 'preview'>('cards');
  const [selectedPreviewDeptId, setSelectedPreviewDeptId] = useState<string>(
    departments[0]?.id || 'sales'
  );
  const [previewSubTab, setPreviewSubTab] = useState<'dashboard' | 'okr' | 'strategic' | 'routines' | 'guide'>('okr');
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [zipStatusText, setZipStatusText] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedDept =
    departments.find((d) => d.id === selectedPreviewDeptId) || departments[0];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownloadAllZip = async () => {
    setIsZipping(true);
    setZipProgress(10);
    setZipStatusText('در حال آماده‌سازی قالب‌های اختصاصی...');

    try {
      await downloadAll11SeparateSheetsZip(
        departments,
        currentYear,
        (pct, name) => {
          setZipProgress(pct);
          setZipStatusText(`ایجاد گوگل شیت اختصاصی: ${name}`);
        }
      );
    } catch (err) {
      console.error('Error generating zip:', err);
    } finally {
      setTimeout(() => {
        setIsZipping(false);
        setZipProgress(0);
        setZipStatusText('');
      }, 1000);
    }
  };

  const openPreviewForDept = (deptId: string) => {
    setSelectedPreviewDeptId(deptId);
    setActiveTab('preview');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 border-b border-indigo-900/50 flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/90 text-white flex items-center justify-center shadow-lg ring-2 ring-indigo-400/40">
                <FileSpreadsheet className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                    استودیوی ۱۱ گوگل شیت اختصاصی سازمان
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    سال مالی {currentYear}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-indigo-200 mt-1 font-normal">
                  طراحی لوکس و گرافیکی، فرمول‌های هوشمند، اسپارک‌لاین، و داشبورد مستقل برای هر یک از ۱۱ گروه
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Master Download Action Banner */}
          <div className="mt-5 pt-4 border-t border-indigo-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 bg-indigo-900/40 rounded-2xl p-3.5 border border-indigo-700/30">
            <div className="flex items-center gap-3">
              <FolderArchive className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="text-xs text-indigo-100">
                <span className="font-bold text-white block sm:inline">
                  دانلود یکجای ۱۱ گوگل شیت مجزا:
                </span>{' '}
                تمامی ۱۱ فایل اکسل مستقل را در یک فایل ZIP جامع و نام‌گذاری‌شده دریافت کنید.
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadAllZip}
              disabled={isZipping}
              className="w-full sm:w-auto py-2.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl flex items-center justify-center gap-2.5 text-xs shadow-md shadow-emerald-950/30 transition-all active:scale-98 flex-shrink-0 cursor-pointer"
            >
              {isZipping ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Download className="w-4 h-4 text-white" />
              )}
              <span>
                {isZipping
                  ? `در حال تولید پکیج (${zipProgress}%)...`
                  : '📦 دانلود بسته ۱۱ گوگل‌شیت مستقل (فایل ZIP)'}
              </span>
            </button>
          </div>

          {isZipping && (
            <div className="mt-2.5">
              <div className="flex items-center justify-between text-[11px] text-indigo-200 mb-1">
                <span>{zipStatusText}</span>
                <span className="font-mono font-bold">{zipProgress}%</span>
              </div>
              <div className="w-full bg-indigo-950 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-400 h-2 transition-all duration-300 rounded-full"
                  style={{ width: `${zipProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('cards')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'cards'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-indigo-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>فهرست و کارت‌های ۱۱ گوگل‌شیت مجزا</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'preview'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-indigo-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>شبیه‌ساز و پیش‌نمایش گرافیکی زنده گوگل‌شیت</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50">
          {activeTab === 'cards' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    فهرست ۱۱ گوگل شیت مجزا و اختصاصی
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    هر دپارتمان دارای یک گوگل شیت مستقل با داشبورد، فرمول‌های فصلی، کارت‌های شاخص کلیدی و چک‌لیست روتین است.
                  </p>
                </div>
              </div>

              {/* 11 Groups Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((dept, idx) => {
                  const isCopied = copiedKey === `tsv-${dept.id}`;
                  return (
                    <div
                      key={dept.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-4 flex flex-col justify-between"
                      style={{ borderTop: `4px solid ${dept.color}` }}
                    >
                      <div>
                        {/* Group Header */}
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="px-2 py-0.5 rounded-lg text-xs font-black text-white"
                              style={{ backgroundColor: dept.color }}
                            >
                              {dept.code}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400">
                              گروه شماره {idx + 1}
                            </span>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              dept.syncStatus === 'synced'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {dept.syncStatus === 'synced' ? 'متصل و فعال' : 'آماده راه‌اندازی'}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 leading-snug mb-1">
                          {dept.name}
                        </h4>

                        <div className="text-xs text-slate-600 space-y-0.5 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="flex justify-between">
                            <span className="text-slate-400">مدیر مسئول:</span>
                            <span className="font-semibold text-slate-800">{dept.managerName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">سمت:</span>
                            <span className="text-slate-700 text-[11px]">{dept.roleTitle || 'مدیر ارشد'}</span>
                          </div>
                        </div>

                        {/* Features in this sheet */}
                        <div className="text-[11px] text-slate-500 mb-3 space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span>شامل ۵ برگه مجزا با فرمول‌های داینامیک</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span>نمودار میله‌ای درون‌سلولی Sparkline</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => downloadGroupTemplateExcel(dept, currentYear)}
                          className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer border border-indigo-200"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>دانلود گوگل شیت اختصاصی (.xlsx)</span>
                        </button>

                        <div className="grid grid-cols-3 gap-1.5">
                          <a
                            href={dept.sheetUrl || 'https://sheets.new'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center justify-center gap-1 text-[11px] transition-colors"
                            title="ایجاد یا باز کردن در گوگل شیت"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>گوگل‌شیت</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              const tsv = generateGroupTSVForClipboard(dept, currentYear);
                              handleCopy(tsv, `tsv-${dept.id}`);
                            }}
                            className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center justify-center gap-1 text-[11px] transition-colors cursor-pointer"
                            title="کپی ساختار جهت Paste در شیت خام"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{isCopied ? 'کپی شد' : 'کپی داده'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openPreviewForDept(dept.id)}
                            className="py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center justify-center gap-1 text-[11px] transition-colors cursor-pointer"
                            title="مشاهده پیش‌نمایش گرافیکی"
                          >
                            <Eye className="w-3 h-3" />
                            <span>پیش‌نمایش</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="space-y-4">
              {/* Department Switcher Bar */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700">انتخاب دپارتمان جهت شبیه‌سازی:</span>
                  <select
                    value={selectedPreviewDeptId}
                    onChange={(e) => setSelectedPreviewDeptId(e.target.value)}
                    className="py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name} ({d.managerName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadGroupTemplateExcel(selectedDept, currentYear)}
                    className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>دانلود همین شیت اختصاصی (.xlsx)</span>
                  </button>

                  <a
                    href={selectedDept.sheetUrl || 'https://sheets.new'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span>باز کردن در گوگل‌شیت</span>
                  </a>
                </div>
              </div>

              {/* Realistic Google Sheets Simulated Canvas */}
              <div className="bg-white rounded-2xl border border-slate-300 shadow-lg overflow-hidden flex flex-col font-sans">
                {/* 1. Google Sheets Green Top App Bar */}
                <div className="bg-[#0f9d58] text-white px-4 py-2.5 flex items-center justify-between border-b border-emerald-700">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded bg-white/20 flex items-center justify-center font-black text-white text-xs">
                      <FileSpreadsheet className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm">
                          گوگل_شیت_اختصاصی_{selectedDept.code}_{selectedDept.name.replace(/\s+/g, '_')}_{currentYear}
                        </span>
                        <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-emerald-100">
                          .xlsx / Sheets
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-emerald-100 mt-0.5">
                        <span>پرونده (File)</span>
                        <span>ویرایش (Edit)</span>
                        <span>نما (View)</span>
                        <span>درج (Insert)</span>
                        <span>قالب‌بندی (Format)</span>
                        <span>داده‌ها (Data)</span>
                        <span>ابزارها (Tools)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="py-1 px-3 bg-white text-[#0f9d58] hover:bg-emerald-50 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>اشتراک‌گذاری (Share)</span>
                    </button>
                  </div>
                </div>

                {/* 2. Formula Bar */}
                <div className="bg-slate-100 px-4 py-1.5 border-b border-slate-200 flex items-center gap-3 text-xs text-slate-600 font-mono">
                  <span className="font-black text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                    K10
                  </span>
                  <span className="font-bold text-slate-500">fx</span>
                  <span className="text-indigo-700 bg-white px-2.5 py-0.5 rounded border border-slate-200 flex-1 truncate">
                    =SPARKLINE(K10, &#123;&quot;charttype&quot;,&quot;bar&quot;;&quot;color1&quot;,IF(K10&gt;=85,&quot;#10b981&quot;,IF(K10&gt;=60,&quot;#3b82f6&quot;,&quot;#ef4444&quot;));&quot;max&quot;,100&#125;)
                  </span>
                </div>

                {/* 3. Sheet Content Area */}
                <div className="p-4 sm:p-6 overflow-x-auto min-h-[380px] bg-slate-50/50">
                  {previewSubTab === 'okr' && (
                    <div className="space-y-4">
                      {/* Top Visual Banner in Sheet */}
                      <div
                        className="rounded-xl p-4 text-white shadow-md flex items-center justify-between"
                        style={{
                          background: `linear-gradient(135deg, ${selectedDept.color}dd, #0f172a)`,
                        }}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded bg-white/20 text-xs font-bold">
                              {selectedDept.code}
                            </span>
                            <span className="text-xs text-indigo-100">ماتریس پیگیری فصلی نتایج کلیدی</span>
                          </div>
                          <h3 className="text-base sm:text-lg font-black">
                            دپارتمان تخصصی: {selectedDept.name}
                          </h3>
                          <p className="text-xs text-indigo-200 mt-0.5">
                            مدیر مسئول: {selectedDept.managerName} • سال مالی: {currentYear}
                          </p>
                        </div>

                        <div className="hidden sm:flex items-center gap-3 bg-white/10 p-2.5 rounded-xl border border-white/20">
                          <div className="text-center">
                            <span className="text-[10px] text-indigo-200 block">میانگین پیشرفت فصلی</span>
                            <span className="text-xl font-black font-mono text-emerald-300">۸۵٪</span>
                          </div>
                          <div className="h-8 w-px bg-white/20" />
                          <div className="text-center">
                            <span className="text-[10px] text-indigo-200 block">شاخص سلامت</span>
                            <span className="text-xs font-bold text-white">🟢 پیشرو</span>
                          </div>
                        </div>
                      </div>

                      {/* Mockup Data Grid */}
                      <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-xs">
                        <table className="w-full text-right text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-800 text-white font-bold text-[11px]">
                              <th className="p-2 border border-slate-700 w-10 text-center">ردیف</th>
                              <th className="p-2 border border-slate-700 w-16 text-center">فصل</th>
                              <th className="p-2 border border-slate-700 w-24">کد اقدام</th>
                              <th className="p-2 border border-slate-700 min-w-[220px]">عنوان نتیجه کلیدی (Key Result)</th>
                              <th className="p-2 border border-slate-700 w-16 text-center">هدف</th>
                              <th className="p-2 border border-slate-700 w-16 text-center">فعلی</th>
                              <th className="p-2 border border-slate-700 w-16 text-center">ماه ۱ (%)</th>
                              <th className="p-2 border border-slate-700 w-16 text-center">ماه ۲ (%)</th>
                              <th className="p-2 border border-slate-700 w-16 text-center">ماه ۳ (%)</th>
                              <th className="p-2 border border-slate-700 w-20 text-center bg-indigo-950 text-emerald-300">
                                میانگین (%)
                              </th>
                              <th className="p-2 border border-slate-700 min-w-[140px] text-center bg-indigo-950 text-indigo-200">
                                نمودار Sparkline
                              </th>
                              <th className="p-2 border border-slate-700 w-24 text-center">وضعیت</th>
                              <th className="p-2 border border-slate-700 w-24 text-center">ارزیابی مدیر</th>
                              <th className="p-2 border border-slate-700 min-w-[150px]">موانع و اقدام اصلاحی</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 font-sans">
                            <tr className="hover:bg-indigo-50/40">
                              <td className="p-2 border border-slate-200 text-center font-mono font-bold">۱</td>
                              <td className="p-2 border border-slate-200 text-center font-bold text-emerald-700 bg-emerald-50/50">
                                بهار
                              </td>
                              <td className="p-2 border border-slate-200 font-mono text-[11px] text-slate-600">
                                SG-{selectedDept.code}.1
                              </td>
                              <td className="p-2 border border-slate-200 font-bold text-slate-800">
                                ارتقای شاخص‌های کیفی و پایلوت در دپارتمان {selectedDept.name}
                              </td>
                              <td className="p-2 border border-slate-200 text-center font-mono">100</td>
                              <td className="p-2 border border-slate-200 text-center font-mono">92</td>
                              <td className="p-2 border border-slate-200 text-center font-mono">85%</td>
                              <td className="p-2 border border-slate-200 text-center font-mono">90%</td>
                              <td className="p-2 border border-slate-200 text-center font-mono">95%</td>
                              <td className="p-2 border border-slate-200 text-center font-mono font-bold text-emerald-700 bg-emerald-50">
                                ۹۰٪
                              </td>
                              <td className="p-2 border border-slate-200 text-center bg-slate-50">
                                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                  <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: '90%' }} />
                                </div>
                              </td>
                              <td className="p-2 border border-slate-200 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  تکمیل شده
                                </span>
                              </td>
                              <td className="p-2 border border-slate-200 text-center font-bold text-emerald-700">
                                🟢 پیشرو
                              </td>
                              <td className="p-2 border border-slate-200 text-[11px] text-slate-600">
                                بدون مانع؛ تداوم تثبیت فرآیند
                              </td>
                            </tr>

                            <tr className="hover:bg-indigo-50/40">
                              <td className="p-2 border border-slate-200 text-center font-mono font-bold">۲</td>
                              <td className="p-2 border border-slate-200 text-center font-bold text-blue-700 bg-blue-50/50">
                                تابستان
                              </td>
                              <td className="p-2 border border-slate-200 font-mono text-[11px] text-slate-600">
                                SG-{selectedDept.code}.2
                              </td>
                              <td className="p-2 border border-slate-200 font-bold text-slate-800">
                                بهینه‌سازی فرآیندها و کاهش زمان چرخه کار به زیر ۲ روز
                              </td>
                              <td className="p-2 border border-slate-200 text-center font-mono">2</td>
                              <td className="p-2 border border-slate-200 text-center font-mono">3.2</td>
                              <td className="p-2 border border-slate-200 text-center font-mono">50%</td>
                              <td className="p-2 border border-slate-200 text-center font-mono">70%</td>
                              <td className="p-2 border border-slate-200 text-center font-mono">0%</td>
                              <td className="p-2 border border-slate-200 text-center font-mono font-bold text-blue-700 bg-blue-50">
                                ۶۰٪
                              </td>
                              <td className="p-2 border border-slate-200 text-center bg-slate-50">
                                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                  <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '60%' }} />
                                </div>
                              </td>
                              <td className="p-2 border border-slate-200 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                  در جریان
                                </span>
                              </td>
                              <td className="p-2 border border-slate-200 text-center font-bold text-blue-700">
                                🟡 مطابق برنامه
                              </td>
                              <td className="p-2 border border-slate-200 text-[11px] text-slate-600">
                                نیاز به آموزش پرسنل؛ برگزاری وبینار
                              </td>
                            </tr>

                            <tr className="hover:bg-indigo-50/40">
                              <td className="p-2 border border-slate-200 text-center font-mono font-bold">۳</td>
                              <td className="p-2 border border-slate-200 text-center font-bold text-amber-700 bg-amber-50/50">
                                پاییز
                              </td>
                              <td className="p-2 border border-slate-200 font-mono text-[11px] text-slate-600">
                                SG-{selectedDept.code}.3
                              </td>
                              <td className="p-2 border border-slate-200 font-bold text-slate-800">
                                استقرار سامانه نظارت کیفی و اتوماسیون گزارش‌دهی هفتگی
                              </td>
                              <td className="p-2 border border-slate-200 text-center font-mono">1</td>
                              <td className="p-2 border border-slate-200 text-center font-mono">0.3</td>
                              <td className="p-2 border border-slate-200 text-center font-mono">25%</td>
                              <td className="p-2 border border-slate-200 text-center font-mono">0%</td>
                              <td className="p-2 border border-slate-200 text-center font-mono">0%</td>
                              <td className="p-2 border border-slate-200 text-center font-mono font-bold text-amber-700 bg-amber-50">
                                ۲۵٪
                              </td>
                              <td className="p-2 border border-slate-200 text-center bg-slate-50">
                                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                  <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '25%' }} />
                                </div>
                              </td>
                              <td className="p-2 border border-slate-200 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                  در جریان
                                </span>
                              </td>
                              <td className="p-2 border border-slate-200 text-center font-bold text-amber-700">
                                🟡 مطابق برنامه
                              </td>
                              <td className="p-2 border border-slate-200 text-[11px] text-slate-600">
                                در حال تخصیص لایسنس نرم‌افزار
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {previewSubTab === 'dashboard' && (
                    <div className="space-y-4">
                      {/* Scorecards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                          <span className="text-[11px] text-slate-500 block">میانگین پیشرفت OKRها</span>
                          <span className="text-2xl font-black text-emerald-600 font-mono">۸۵٪</span>
                          <span className="text-[10px] text-slate-400 block mt-1">=AVERAGE(...)</span>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                          <span className="text-[11px] text-slate-500 block">کل اهداف تعریف‌شده</span>
                          <span className="text-2xl font-black text-indigo-600 font-mono">۶ هدف</span>
                          <span className="text-[10px] text-slate-400 block mt-1">=COUNTA(...)</span>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                          <span className="text-[11px] text-slate-500 block">اهداف ۱۰۰٪ تکمیل</span>
                          <span className="text-2xl font-black text-emerald-700 font-mono">۳ هدف</span>
                          <span className="text-[10px] text-slate-400 block mt-1">=COUNTIF(..., &quot;تکمیل&quot;)</span>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                          <span className="text-[11px] text-slate-500 block">شاخص سلامت تیم</span>
                          <span className="text-lg font-black text-emerald-600">🟢 پیشرو و عالی</span>
                          <span className="text-[10px] text-slate-400 block mt-1">=IF(...)</span>
                        </div>
                      </div>

                      {/* Sparkline table */}
                      <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <h4 className="text-xs font-bold text-slate-800 mb-3">
                          نمودار میله‌ای درون‌سلولی گوگل‌شیت به تفکیک ۴ فصل
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                              <span>بهار (فصل اول)</span>
                              <span className="font-mono text-emerald-600">۹۰٪</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3">
                              <div className="bg-emerald-500 h-3 rounded-full" style={{ width: '90%' }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                              <span>تابستان (فصل دوم)</span>
                              <span className="font-mono text-blue-600">۷۰٪</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3">
                              <div className="bg-blue-500 h-3 rounded-full" style={{ width: '70%' }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                              <span>پاییز (فصل سوم)</span>
                              <span className="font-mono text-amber-600">۳۰٪</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3">
                              <div className="bg-amber-500 h-3 rounded-full" style={{ width: '30%' }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                              <span>زمستان (فصل چهارم)</span>
                              <span className="font-mono text-slate-400">۰٪</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3">
                              <div className="bg-slate-300 h-3 rounded-full" style={{ width: '0%' }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {previewSubTab === 'strategic' && (
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                      <h4 className="text-xs font-bold text-slate-800 mb-3">
                        نگاشت اهداف کلان سازمان و اقدامات خرد دپارتمان {selectedDept.name}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        این برگه در اکسل/گوگل‌شیت، تمامی اقدامات عملیاتی تیم را به اهدف سالانه شرکت متصل می‌کند.
                        شامل کدهای سیستمی، اوزان استراتژیک (۱-۱۰۰) و سنجه‌های عددی هدف است.
                      </p>
                    </div>
                  )}

                  {previewSubTab === 'routines' && (
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                      <h4 className="text-xs font-bold text-slate-800 mb-3">
                        چک‌لیست فرآیندها و روتین‌های ۱۲ ماهه سال
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        ردیف‌های فرآیندی تکرارشونده همراه با ستون‌های ۱۲ ماهه (فروردین تا اسفند). با درج عبارت «بله»،
                        فرمول پایبندی سالانه و نوار گرافیکی اسپارک‌لاین به صورت زنده درصد عملکرد تیم را نشان می‌دهند.
                      </p>
                    </div>
                  )}

                  {previewSubTab === 'guide' && (
                    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 text-xs text-slate-700">
                      <h4 className="font-bold text-slate-900 mb-2">راهنمای بارگذاری در Google Sheets</h4>
                      <p>۱. فایل .xlsx دانلود شده را در گوگل درایو آپلود کنید.</p>
                      <p>۲. با راست‌کلیک، Open with &gt; Google Sheets را انتخاب نمایید.</p>
                      <p>۳. از منوی Share دسترسی مشاهده/ویرایش را برای هم‌تیمی‌ها تنظیم کنید.</p>
                      <p>۴. لینک حاصله را در سامانه مرکزی ثبت کنید تا نمودارها خودکار آپدیت شوند.</p>
                    </div>
                  )}
                </div>

                {/* 4. Bottom Worksheet Tabs */}
                <div className="bg-slate-200 px-3 py-1.5 border-t border-slate-300 flex items-center gap-1 text-xs overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setPreviewSubTab('dashboard')}
                    className={`py-1.5 px-3 rounded-t-lg font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      previewSubTab === 'dashboard'
                        ? 'bg-white text-indigo-900 shadow-xs border-t-2 border-indigo-600'
                        : 'text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>📊 داشبورد_مدیریتی</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewSubTab('okr')}
                    className={`py-1.5 px-3 rounded-t-lg font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      previewSubTab === 'okr'
                        ? 'bg-white text-emerald-900 shadow-xs border-t-2 border-emerald-600'
                        : 'text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>🎯 پیگیری_فصلی_OKR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewSubTab('strategic')}
                    className={`py-1.5 px-3 rounded-t-lg font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      previewSubTab === 'strategic'
                        ? 'bg-white text-indigo-900 shadow-xs border-t-2 border-indigo-600'
                        : 'text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>📋 اهداف_کلان_و_خرد</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewSubTab('routines')}
                    className={`py-1.5 px-3 rounded-t-lg font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      previewSubTab === 'routines'
                        ? 'bg-white text-purple-900 shadow-xs border-t-2 border-purple-600'
                        : 'text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>🔄 چک‌لیست_روتین_۱۲ماهه</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewSubTab('guide')}
                    className={`py-1.5 px-3 rounded-t-lg font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      previewSubTab === 'guide'
                        ? 'bg-white text-slate-900 shadow-xs border-t-2 border-slate-600'
                        : 'text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>💡 راهنمای_گوگل_شیت</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-slate-500">
            تمامی ۱۱ گوگل شیت دارای ساختار همسان، فرمول‌های داینامیک و سازگاری ۱۰۰٪ با Google Drive و Excel هستند.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleDownloadAllZip}
              disabled={isZipping}
              className="w-full sm:w-auto py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>دانلود بسته ZIP شامل ۱۱ شیت</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
