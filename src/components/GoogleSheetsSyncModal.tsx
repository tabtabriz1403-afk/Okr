import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CloudUpload,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Settings2,
  Code,
  Download,
  ClipboardCheck,
  MousePointerClick,
  HelpCircle,
  FolderOpen,
} from 'lucide-react';
import { StrategicGoal, SubGoal, OKRItem, RoutineTask } from '../types';
import {
  requestGoogleAccessToken,
  syncToGoogleSheets,
  buildSheetsDataPayload,
  convertTableToTSV,
  GoogleSheetsSyncResult,
} from '../utils/googleSheetsService';
import { exportToExcel } from '../utils/excelExport';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategicGoals: StrategicGoal[];
  subGoals: SubGoal[];
  okrs: OKRItem[];
  routines: RoutineTask[];
  currentYear: number;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  strategicGoals,
  subGoals,
  okrs,
  routines,
  currentYear,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'clipboard' | 'cloud' | 'formulas'>('import');
  const [selectedCopySheet, setSelectedCopySheet] = useState<'okr' | 'dashboard' | 'subGoals' | 'strategic' | 'routines'>('okr');
  
  // Cloud Sync states
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ step: string; percent: number }>({
    step: '',
    percent: 0,
  });
  const [syncResult, setSyncResult] = useState<GoogleSheetsSyncResult | null>(() => {
    const saved = localStorage.getItem('last_google_sheet_sync');
    return saved ? JSON.parse(saved) : null;
  });
  const [existingSheetId, setExistingSheetId] = useState<string>(() => {
    return localStorage.getItem('google_sheet_custom_id') || '';
  });
  const [customClientId, setCustomClientId] = useState<string>(() => {
    return localStorage.getItem('google_oauth_custom_client_id') || '';
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const sheetsPayload = buildSheetsDataPayload(strategicGoals, subGoals, okrs, routines, currentYear);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCopySheetData = (sheetKey: 'okr' | 'dashboard' | 'subGoals' | 'strategic' | 'routines') => {
    let rows: (string | number)[][] = [];
    if (sheetKey === 'okr') rows = sheetsPayload.okrValues;
    else if (sheetKey === 'dashboard') rows = sheetsPayload.dashboardValues;
    else if (sheetKey === 'subGoals') rows = sheetsPayload.subGoalValues;
    else if (sheetKey === 'strategic') rows = sheetsPayload.strategicValues;
    else if (sheetKey === 'routines') rows = sheetsPayload.routineValues;

    const tsvData = convertTableToTSV(rows);
    handleCopy(tsvData, `sheet_${sheetKey}`);
  };

  const handleDownloadExcel = () => {
    exportToExcel(strategicGoals, subGoals, okrs, routines);
  };

  const handleStartSync = async () => {
    setIsSyncing(true);
    setErrorMessage(null);
    setSyncProgress({ step: 'در حال باز کردن پنجره احراز هویت با گوگل...', percent: 10 });

    try {
      if (customClientId.trim()) {
        localStorage.setItem('google_oauth_custom_client_id', customClientId.trim());
      }
      if (existingSheetId.trim()) {
        localStorage.setItem('google_sheet_custom_id', existingSheetId.trim());
      }

      // 1. Get access token
      const token = await requestGoogleAccessToken(customClientId.trim() || undefined);

      // 2. Sync to Google Sheets
      const result = await syncToGoogleSheets(
        token,
        strategicGoals,
        subGoals,
        okrs,
        routines,
        currentYear,
        existingSheetId.trim() || undefined,
        (step, percent) => {
          setSyncProgress({ step, percent });
        }
      );

      setSyncResult(result);
      localStorage.setItem('last_google_sheet_sync', JSON.stringify(result));
      localStorage.setItem('google_sheet_custom_id', result.spreadsheetId);
    } catch (err: any) {
      console.error('Google Sheets Sync Error:', err);
      const isPopupBlocked = err.message?.includes('popup') || err.message?.includes('closed') || err.message?.includes('GSI');
      setErrorMessage(
        isPopupBlocked
          ? 'پنجره ورود به گوگل باز نشد یا توسط مرورگر بسته شد. برای حل مشکل، از تب «روش ۱: دانلود و باز کردن در گوگل شیت» یا «روش ۲: کپی و پیست با Ctrl+V» استفاده کنید که ۱۰۰٪ بدون نیاز به ورود کار می‌کنند.'
          : err.message || 'خطا در ارتباط با سرور گوگل شیت.'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const appsScriptCode = `/**
 * اسکریپت خودکارسازی پایش OKR و مانده‌گیری در گوگل شیت
 * ارسال خودکار هشدار هفتگی/ماهانه به مدیر
 */
function sendWeeklyOKRReport() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var okrSheet = ss.getSheetByName("پیگیری_OKR_فصلی");
  
  if (!okrSheet) return;
  
  var data = okrSheet.getDataRange().getValues();
  var behindTasks = [];
  
  // بررسی ردیف‌ها و استخراج اهداف عقب‌مانده
  for (var i = 1; i < data.length; i++) {
    var status = data[i][9]; // ستون وضعیت
    var title = data[i][2];  // عنوان نتیجه کلیدی
    var season = data[i][0]; // فصل
    
    if (status && status.toString().indexOf("عقب") !== -1) {
      behindTasks.push(season + " - " + title);
    }
  }
  
  var email = Session.getActiveUser().getEmail();
  var subject = "⚠️ گزارش مانده‌گیری و پایش OKR سازمان";
  var body = "سلام وقت بخیر،\\n\\n" +
             "تعداد " + behindTasks.length + " هدف دارای تأخیر شناسایی شد:\\n\\n" +
             behindTasks.join("\\n") + 
             "\\n\\nلطفاً جهت بازنگری به فایل گوگل شیت مراجعه فرمایید.";
             
  MailApp.sendEmail(email, subject, body);
}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                انتقال و باز کردن در گوگل شیت (Google Sheets)
              </h3>
              <p className="text-xs text-slate-500">
                راهکارهای فوری و تضمینی برای مشاهده، ویرایش و پایش OKRها در گوگل شیت
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

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100/90 rounded-xl mb-5 text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center ${
              activeTab === 'import'
                ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-slate-950/5'
                : 'hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>۱. دانلود و باز کردن در شیت</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clipboard')}
            className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center ${
              activeTab === 'clipboard'
                ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-slate-950/5'
                : 'hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>۲. کپی مستقیم (Ctrl+V)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center ${
              activeTab === 'cloud'
                ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-slate-950/5'
                : 'hover:text-slate-900'
            }`}
          >
            <CloudUpload className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>۳. ساخت خودکار در Drive</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('formulas')}
            className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center ${
              activeTab === 'formulas'
                ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-slate-950/5'
                : 'hover:text-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>۴. فرمول‌ها و اسکریپت</span>
          </button>
        </div>

        {/* TAB 1: Direct File Import (100% Reliable & Guaranteed) */}
        {activeTab === 'import' && (
          <div className="space-y-4 text-xs text-slate-700">
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>سریع‌ترین و مطمئن‌ترین روش (بدون نیاز به لاگین یا فیلترشکن):</span>
              </div>
              <p className="text-emerald-800 leading-relaxed">
                فایل کامل اکسل شما با ۵ برگه راست‌به‌چپ (شامل داشبورد، فرمول‌ها، اهداف کلان، خرد، OKRها و چک‌لیست روتین‌ها) تولید شده است. برای باز شدن در گوگل شیت مراحل ۲ مرحله‌ای زیر را انجام دهید:
              </p>
            </div>

            {/* Step 1 & 2 Action Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Step 1 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px]">۱</span>
                    <span>گام اول: دانلود فایل کامل اکسل</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    فایل تمام اطلاعات را در فرمت استاندارد .xlsx با فرمول‌های آماده روی سیستم شما ذخیره می‌کند.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>دانلود فایل اکسل (.xlsx)</span>
                </button>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]">۲</span>
                    <span>گام دوم: باز کردن صفحه گوگل شیت</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    لینک‌های زیر مستقیماً در تب جدید باز می‌شوند (توسط مرورگر مسدود نمی‌شوند):
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <a
                    href="https://sheets.new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors text-center"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>باز کردن برگه جدید در sheets.new ↗</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Visual Guide Box */}
            <div className="bg-slate-900 text-slate-100 rounded-xl p-4 space-y-2.5 border border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <MousePointerClick className="w-4 h-4" />
                <span>نحوه انداختن فایل در گوگل شیت (در ۵ ثانیه):</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300 pr-1 leading-relaxed">
                <li>در صفحه گوگل شیت، از منوی بالا روی <strong>File (فایل)</strong> کلیک کنید.</li>
                <li>گزینه <strong>Import (وارد کردن)</strong> و سپس تب <strong>Upload (بارگذاری)</strong> را بزنید.</li>
                <li>فایل اکسل دانلود شده را بکشید و داخل کادر بیندازید (Drag & Drop).</li>
                <li>گزینه <strong>Replace spreadsheet (جایگزینی صفحه گسترده)</strong> را تایید کنید.</li>
              </ol>
            </div>

            {/* Alternative Links */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <span>لینک‌های مستقیم کمکی:</span>
              <div className="flex items-center gap-3">
                <a
                  href="https://docs.google.com/spreadsheets/u/0/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>صفحه اصلی Google Sheets ↗</span>
                </a>
                <a
                  href="https://drive.google.com/drive/u/0/my-drive"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>گوگل درایو (Drive) ↗</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Instant Clipboard Copy & Paste */}
        {activeTab === 'clipboard' && (
          <div className="space-y-4 text-xs text-slate-700">
            <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-indigo-950 font-bold text-sm">
                <ClipboardCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>کپی آنی جدول و پیست با کلید Ctrl + V در هر برگه گوگل شیت</span>
              </div>
              <p className="text-indigo-900 leading-relaxed text-[11px]">
                اگر می‌خواهید جدول را مستقیماً داخل یک فایل شیت موجود پیست کنید، برگه مورد نظر را انتخاب و دکمه کپی را بزنید، سپس در سلول <strong>A1</strong> گوگل شیت کلیدهای <code>Ctrl + V</code> را بفشارید:
              </p>
            </div>

            {/* Sheet Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setSelectedCopySheet('okr')}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                  selectedCopySheet === 'okr'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🚀 پیگیری OKRها
              </button>

              <button
                type="button"
                onClick={() => setSelectedCopySheet('dashboard')}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                  selectedCopySheet === 'dashboard'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                📊 داشبورد و مانده
              </button>

              <button
                type="button"
                onClick={() => setSelectedCopySheet('subGoals')}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                  selectedCopySheet === 'subGoals'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🧩 اهداف خرد
              </button>

              <button
                type="button"
                onClick={() => setSelectedCopySheet('strategic')}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                  selectedCopySheet === 'strategic'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🎯 اهداف کلان
              </button>

              <button
                type="button"
                onClick={() => setSelectedCopySheet('routines')}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                  selectedCopySheet === 'routines'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                📋 چک‌لیست روتین
              </button>
            </div>

            {/* Action Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-900 block text-xs">
                  داده‌های برگه آماده کپی:{' '}
                  {selectedCopySheet === 'okr'
                    ? 'جدول پیگیری فصلی OKR (با فرمول‌های محاسبه)'
                    : selectedCopySheet === 'dashboard'
                    ? 'جدول داشبورد و مانده‌گیری'
                    : selectedCopySheet === 'subGoals'
                    ? 'جدول اهداف خرد و اقدامات عملیاتی'
                    : selectedCopySheet === 'strategic'
                    ? 'جدول اهداف کلان استراتژیک'
                    : 'جدول چک‌لیست روتین‌های ۱۲ ماه'}
                </span>
                <span className="text-[11px] text-slate-500">
                  فرمت شده برای جدول گوگل شیت و اکسل با یک کلیک
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopySheetData(selectedCopySheet)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors text-xs"
                >
                  {copiedKey === `sheet_${selectedCopySheet}` ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>کپی شد! در شیت Ctrl+V بزنید</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>کپی جدول برای پیست در گوگل شیت</span>
                    </>
                  )}
                </button>

                <a
                  href="https://sheets.new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg flex items-center justify-center gap-1 transition-colors text-xs shadow-2xs"
                  title="باز کردن تب جدید گوگل شیت"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>sheets.new ↗</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Google Drive OAuth Sync */}
        {activeTab === 'cloud' && (
          <div className="space-y-4 text-xs text-slate-700">
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CloudUpload className="w-4 h-4 text-emerald-600" />
                <span>ساخت خودکار فایل در حساب Google Drive شما</span>
              </div>
              <p className="text-emerald-800 leading-relaxed text-[11px]">
                با این قابلیت، وب‌اپلیکیشن مستقیماً از طریق Google Sheets API یک فایل جدید در درایو شما می‌سازد.
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-2.5 text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-rose-900">توجه:</span>
                  <p className="text-[11px] leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Sync Progress */}
            {isSyncing && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                    <span>{syncProgress.step}</span>
                  </div>
                  <span className="text-emerald-600 font-mono">{syncProgress.percent}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${syncProgress.percent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Success Result Card */}
            {syncResult && !isSyncing && (
              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3 shadow-md border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>گوگل شیت شما در گوگل درایو ساخته شد!</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    آخرین ارسال: {syncResult.syncedAt}
                  </span>
                </div>

                <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700 flex items-center justify-between gap-3">
                  <div className="truncate font-mono text-[11px] text-slate-300 dir-ltr text-left">
                    {syncResult.spreadsheetUrl}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(syncResult.spreadsheetUrl, 'sheet_link')}
                    className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold bg-slate-700 hover:bg-slate-600 text-white px-2.5 py-1.5 rounded-md transition-colors"
                  >
                    {copiedKey === 'sheet_link' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'sheet_link' ? 'کپی شد' : 'کپی لینک'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href={syncResult.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-center flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>باز کردن در گوگل شیت (Google Sheets) ↗</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleStartSync}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg transition-colors border border-slate-700"
                  >
                    همگام‌سازی مجدد
                  </button>
                </div>
              </div>
            )}

            {/* Sync Button */}
            {!syncResult && !isSyncing && (
              <button
                type="button"
                onClick={handleStartSync}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all ring-1 ring-emerald-500/20"
              >
                <CloudUpload className="w-4 h-4 stroke-[2.2]" />
                <span>ورود با حساب گوگل و ساخت شیت آنلاین</span>
              </button>
            )}

            {/* Advanced Settings */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xs font-semibold"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>تنظیمات پیشرفته (شناسه شیت موجود / کلاینت آیدی اختصاصی)</span>
              </button>

              {showAdvanced && (
                <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div>
                    <label htmlFor="custom-sheet-id-input" className="block text-[11px] font-bold text-slate-700 mb-1">
                      شناسه فایل گوگل شیت قبلی (Spreadsheet ID) جهت بروزرسانی:
                    </label>
                    <input
                      id="custom-sheet-id-input"
                      type="text"
                      value={existingSheetId}
                      onChange={(e) => setExistingSheetId(e.target.value)}
                      placeholder="اگر خالی باشد، فایل جدید ساخته می‌شود"
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono dir-ltr text-left"
                    />
                  </div>

                  <div>
                    <label htmlFor="custom-client-id-input" className="block text-[11px] font-bold text-slate-700 mb-1">
                      Google OAuth Client ID (اختیاری):
                    </label>
                    <input
                      id="custom-client-id-input"
                      type="text"
                      value={customClientId}
                      onChange={(e) => setCustomClientId(e.target.value)}
                      placeholder="شناسه کلاینت OAuth اختصاصی شما"
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono dir-ltr text-left"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Formulas & Apps Script */}
        {activeTab === 'formulas' && (
          <div className="space-y-4 text-xs text-slate-700">
            {/* Formula 1 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">۱. فرمول محاسبه پیشرفت فصلی (برگه OKR):</span>
                <button
                  type="button"
                  onClick={() => handleCopy('=AVERAGE(F2:H2)', 'f1')}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs"
                >
                  {copiedKey === 'f1' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'f1' ? 'کپی شد' : 'کپی فرمول'}</span>
                </button>
              </div>
              <code className="block bg-slate-900 text-emerald-400 p-2 rounded-lg text-left font-mono dir-ltr">
                =AVERAGE(F2:H2)
              </code>
            </div>

            {/* Formula 2 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">۲. شمارش اهداف تکمیل شده در داشبورد:</span>
                <button
                  type="button"
                  onClick={() => handleCopy('=COUNTIF(پیگیری_OKR_فصلی!J:J, "تکمیل شده ✅")', 'f2')}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs"
                >
                  {copiedKey === 'f2' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'f2' ? 'کپی شد' : 'کپی فرمول'}</span>
                </button>
              </div>
              <code className="block bg-slate-900 text-emerald-400 p-2 rounded-lg text-left font-mono dir-ltr">
                =COUNTIF(پیگیری_OKR_فصلی!J:J, "تکمیل شده ✅")
              </code>
            </div>

            {/* Apps Script */}
            <div className="bg-slate-900 text-slate-100 rounded-xl p-4 space-y-2.5 border border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Code className="w-4 h-4" />
                  <span>کد خودکارسازی Google Apps Script (ارسال ایمیل هشدار)</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(appsScriptCode, 'gas')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 px-3 py-1 rounded-md transition-colors"
                >
                  {copiedKey === 'gas' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'gas' ? 'کپی شد' : 'کپی کد اسکریپت'}</span>
                </button>
              </div>
              <pre className="text-[11px] font-mono text-emerald-400 bg-black/60 p-3 rounded-lg overflow-x-auto dir-ltr">
                {appsScriptCode}
              </pre>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-4 border-t border-slate-100 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
