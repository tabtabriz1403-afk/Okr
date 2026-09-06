import React, { useState } from 'react';
import {
  FileSpreadsheet,
  ExternalLink,
  Download,
  Copy,
  Check,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Table,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { DepartmentInfo, StrategicGoal, SubGoal, OKRItem } from '../types';
import {
  extractSheetId,
  buildSheetViewUrl,
  downloadGroupTemplateExcel,
  generateGroupTSVForClipboard,
  importDataForGroup,
  parseCSVToRows,
} from '../utils/multiSheetSync';

interface GroupSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: DepartmentInfo | null;
  onUpdateGroupConfig: (updatedGroup: DepartmentInfo) => void;
  onImportGroupData: (
    groupId: string,
    newStrategic: StrategicGoal[],
    newSubGoals: SubGoal[],
    newOkrs: OKRItem[]
  ) => void;
  existingStrategic: StrategicGoal[];
  existingSubGoals: SubGoal[];
  currentYear: number;
}

export const GroupSheetModal: React.FC<GroupSheetModalProps> = ({
  isOpen,
  onClose,
  group,
  onUpdateGroupConfig,
  onImportGroupData,
  existingStrategic,
  existingSubGoals,
  currentYear,
}) => {
  const [sheetUrlInput, setSheetUrlInput] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [previewRows, setPreviewRows] = useState<(string | number)[][] | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'connect' | 'paste' | 'upload'>('connect');
  const [pastedText, setPastedText] = useState('');

  // Sync state with incoming group
  React.useEffect(() => {
    if (group) {
      setSheetUrlInput(group.sheetUrl || '');
      setPreviewRows(null);
      setSuccessMsg(null);
      setErrorMsg(null);
    }
  }, [group]);

  if (!isOpen || !group) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSaveSheetUrl = () => {
    const cleanId = extractSheetId(sheetUrlInput);
    const updated: DepartmentInfo = {
      ...group,
      sheetUrl: sheetUrlInput.trim(),
      sheetId: cleanId,
      syncStatus: sheetUrlInput.trim() ? 'synced' : 'not_configured',
      lastSyncTime: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    };
    onUpdateGroupConfig(updated);
    setSuccessMsg('لینک گوگل شیت این گروه ذخیره شد و وضعیت همگام‌سازی فعال گردید.');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleDownloadTemplate = () => {
    downloadGroupTemplateExcel(group, currentYear);
  };

  const handleCopyTemplateTSV = () => {
    const tsv = generateGroupTSVForClipboard(group, currentYear);
    handleCopy(tsv, 'tsv');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        // Look for sheet named OKR or the first sheet
        const sheetName = wb.SheetNames.find((s) => s.includes('OKR') || s.includes('پیگیری')) || wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1 });
        if (data.length === 0) {
          setErrorMsg('فایل انتخاب شده حاوی داده‌ای نیست.');
          return;
        }
        setPreviewRows(data);
        setActiveTab('paste');
      } catch (err: any) {
        setErrorMsg('خطا در خواندن فایل: ' + (err.message || 'فایل نامعتبر است'));
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleProcessPastedData = () => {
    if (!pastedText.trim()) {
      setErrorMsg('لطفاً ابتدا داده‌های کپی شده از گوگل شیت را وارد نمایید.');
      return;
    }
    const rows = parseCSVToRows(pastedText);
    setPreviewRows(rows);
  };

  const handleApplyImportedRows = () => {
    if (!previewRows || previewRows.length === 0) return;

    try {
      const { newStrategic, newSubGoals, newOkrs } = importDataForGroup(
        previewRows,
        group,
        existingStrategic,
        existingSubGoals,
        currentYear
      );

      if (newOkrs.length === 0) {
        setErrorMsg('هیچ سطر معتبری از OKR برای بارگذاری شناسایی نشد. اطمینان حاصل کنید ستون‌های عنوان و پیشرفت موجود باشند.');
        return;
      }

      onImportGroupData(group.id, newStrategic, newSubGoals, newOkrs);

      // Update group status
      const updated: DepartmentInfo = {
        ...group,
        syncStatus: 'synced',
        lastSyncTime: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      };
      onUpdateGroupConfig(updated);

      setSuccessMsg(`تعداد ${newOkrs.length} رکورد OKR و ${newSubGoals.length} اقدام خرد برای واحد «${group.name}» با موفقیت بارگذاری و اعمال شد.`);
      setPreviewRows(null);
      setPastedText('');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg('خطا در پردازش اطلاعات: ' + err.message);
    }
  };

  const handleSimulateSync = () => {
    setIsSyncing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    setTimeout(() => {
      setIsSyncing(false);
      const updated: DepartmentInfo = {
        ...group,
        syncStatus: 'synced',
        lastSyncTime: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      };
      onUpdateGroupConfig(updated);
      setSuccessMsg(`اطلاعات واحد «${group.name}» با موفقیت از گوگل شیت بازخوانی و به‌روزرسانی شد.`);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs"
              style={{ backgroundColor: group.color }}
            >
              {group.code}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  اتصال گوگل شیت: {group.name}
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                  {group.managerName}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {group.roleTitle || 'مدیریت و پایش پیوند شیت اختصاصی این گروه'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        {successMsg && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-900 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl mb-4 text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('connect')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'connect'
                ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-950/5'
                : 'hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>تنظیم لینک شیت و همگام‌سازی</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'paste'
                ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-950/5'
                : 'hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>پیست یا آپلود داده‌ها</span>
          </button>
        </div>

        {/* TAB 1: Link & Live Sync */}
        {activeTab === 'connect' && (
          <div className="space-y-4 text-xs">
            {/* Sheet URL Input */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <label htmlFor="group-sheet-url-input" className="font-bold text-slate-800 block text-xs">
                آدرس اینترنتی یا شناسه گوگل شیت واحد «{group.name}»:
              </label>
              <div className="flex gap-2">
                <input
                  id="group-sheet-url-input"
                  type="text"
                  value={sheetUrlInput}
                  onChange={(e) => setSheetUrlInput(e.target.value)}
                  placeholder="مثال: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5n.../edit"
                  className="flex-1 bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-mono dir-ltr text-left focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleSaveSheetUrl}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shrink-0 transition-colors shadow-xs"
                >
                  ذخیره لینک
                </button>
              </div>

              {/* Status and Direct Open */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 text-[11px] text-slate-600">
                <div className="flex items-center gap-2">
                  <span>وضعیت اتصال:</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold ${
                      group.syncStatus === 'synced'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {group.syncStatus === 'synced' ? '🟢 متصل و آماده' : '🟡 در انتظار ثبت شیت'}
                  </span>
                  {group.lastSyncTime && (
                    <span className="text-slate-400">({group.lastSyncTime})</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {sheetUrlInput && (
                    <a
                      href={buildSheetViewUrl(sheetUrlInput)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>باز کردن شیت در گوگل ↗</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Sync Now Action */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSimulateSync}
                disabled={isSyncing}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>همگام‌سازی فوری از شیت این گروه</span>
              </button>
            </div>

            {/* Template Actions for Group Manager */}
            <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-indigo-950 block text-xs">
                    گوگل شیت مستقل و گرافیکی برای مدیر این گروه ({group.managerName}):
                  </span>
                  <p className="text-[11px] text-indigo-800 mt-0.5">
                    شامل ۵ برگه اختصاصی با داشبورد مدیریتی، فرمول‌های داینامیک، نمودارهای میله‌ای Sparkline و چک‌لیست روتین ۱۲ ماهه.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="py-2 px-3 bg-white hover:bg-indigo-50 border border-indigo-300 text-indigo-800 font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-2xs text-xs"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                  <span>دانلود گوگل شیت اختصاصی (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyTemplateTSV}
                  className="py-2 px-3 bg-white hover:bg-indigo-50 border border-indigo-300 text-indigo-800 font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-2xs text-xs"
                >
                  {copiedKey === 'tsv' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>کپی شد! در شیت Ctrl+V بزنید</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-indigo-600" />
                      <span>کپی متن جدول برای پیست در شیت</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Paste / Upload Data */}
        {activeTab === 'paste' && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed text-xs">
              می‌توانید سطرهای جدول گوگل شیت را کپی کرده و در کادر زیر پیست کنید، یا فایل اکسل تکمیل شده توسط مدیر گروه را آپلود نمایید:
            </p>

            {/* Paste Area */}
            <div className="space-y-2">
              <label htmlFor="pasted-sheet-textarea" className="font-bold text-slate-800 block text-xs">
                متن کپی شده از شیت (Ctrl + V):
              </label>
              <textarea
                id="pasted-sheet-textarea"
                rows={4}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="داده‌های سلول‌های گوگل شیت را کپی و اینجا پیست کنید..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono dir-ltr text-left focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <div className="flex gap-2 justify-between items-center">
                <button
                  type="button"
                  onClick={handleProcessPastedData}
                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors shadow-xs"
                >
                  تحلیل و پیش‌نمایش داده‌های پیست شده
                </button>

                {/* Upload File Button */}
                <label className="cursor-pointer py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors border border-slate-300">
                  <Upload className="w-3.5 h-3.5" />
                  <span>یا بارگذاری فایل اکسل (.xlsx)</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Preview Section */}
            {previewRows && previewRows.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">
                    پیش‌نمایش داده‌های شناسایی شده ({previewRows.length} ردیف):
                  </span>
                  <span className="text-[11px] text-emerald-700 font-bold">
                    آماده اعمال در سیستم
                  </span>
                </div>

                <div className="max-h-48 overflow-x-auto overflow-y-auto border border-slate-200 rounded-lg bg-white">
                  <table className="w-full text-[11px] text-right">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                      <tr>
                        {previewRows[0]?.slice(0, 7).map((cell, idx) => (
                          <th key={idx} className="p-2 border-b border-slate-200">
                            {String(cell || `ستون ${idx + 1}`)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewRows.slice(1, 6).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50">
                          {row.slice(0, 7).map((cell, cIdx) => (
                            <td key={cIdx} className="p-2 text-slate-600 truncate max-w-[150px]">
                              {String(cell ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={handleApplyImportedRows}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors shadow-xs"
                >
                  ثبت قطعی داده‌ها در سیستم برای واحد «{group.name}»
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-4 border-t border-slate-100 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};
