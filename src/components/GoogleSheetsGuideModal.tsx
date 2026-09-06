import React, { useState } from 'react';
import { Copy, Check, FileSpreadsheet, Sparkles, Shield, Code, ChevronRight } from 'lucide-react';

interface GoogleSheetsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSheetsGuideModal: React.FC<GoogleSheetsGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const appsScriptCode = `/**
 * اسکریپت خودکارسازی پایش OKR و مانده‌گیری در گوگل شیت
 * ارسال خودکار هشدار هفتگی/ماهانه به مدیر
 */
function sendWeeklyOKRReport() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var okrSheet = ss.getSheetByName("پیگیری_OKR_فصلی");
  var dashboardSheet = ss.getSheetByName("داشبورد_مانده‌گیری");
  
  if (!okrSheet) return;
  
  var data = okrSheet.getDataRange().getValues();
  var behindTasks = [];
  
  // بررسی ردیف‌ها و پیدا کردن اهداف عقب‌مانده
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">
              راهنمای راه‌اندازی، فرمول‌ها و اسکریپت در گوگل شیت (Google Sheets)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 text-xs text-slate-700">
          {/* Intro Box */}
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-4 text-emerald-950 shadow-2xs">
            <h4 className="font-bold text-sm mb-1 text-emerald-900">راهنمای راه‌اندازی اختصاصی فایل شما:</h4>
            <p className="leading-relaxed text-emerald-800">
              شما می‌توانید با دانلود مستقیم فایل اکسل (.xlsx) از دکمه بالای صفحه، بلافاصله آن را در گوگل درایو یا اکسل باز کنید
              و تمام فرمول‌ها، برگه‌ها و محاسبات خودکار را آماده داشته باشید. در ادامه ساختار دقیق فرمول‌ها نیز جهت استفاده دستی آمده است.
            </p>
          </div>

          {/* 4 Sheets Breakdown */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm">فرمول‌های طلایی برای شیت داشبورد و مانده‌گیری:</h4>

            {/* Formula 1 */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">۱. محاسبه میانگین پیشرفت فصلی (برگه OKR):</span>
                <button
                  type="button"
                  onClick={() => handleCopy('=AVERAGE(F2:H2)', 'f1')}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs transition-colors"
                >
                  {copiedKey === 'f1' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'f1' ? 'کپی شد' : 'کپی فرمول'}</span>
                </button>
              </div>
              <code className="block bg-slate-900 text-emerald-400 p-2.5 rounded-lg text-left font-mono dir-ltr text-xs border border-slate-800">
                =AVERAGE(F2:H2)
              </code>
              <p className="text-[11px] text-slate-500">میانگین پیشرفت ۳ ماه (ماه اول، ماه دوم، ماه سوم).</p>
            </div>

            {/* Formula 2 */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">۲. شمارش اهداف تکمیل شده (در داشبورد):</span>
                <button
                  type="button"
                  onClick={() => handleCopy('=COUNTIF(پیگیری_OKR_فصلی!J:J, "تکمیل شده ✅")', 'f2')}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs transition-colors"
                >
                  {copiedKey === 'f2' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'f2' ? 'کپی شد' : 'کپی فرمول'}</span>
                </button>
              </div>
              <code className="block bg-slate-900 text-emerald-400 p-2.5 rounded-lg text-left font-mono dir-ltr text-xs border border-slate-800">
                =COUNTIF(پیگیری_OKR_فصلی!J:J, "تکمیل شده ✅")
              </code>
            </div>

            {/* Formula 3 */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">۳. رسم نوار پیشرفت گرافیکی در سلول (Sparkline):</span>
                <button
                  type="button"
                  onClick={() => handleCopy('=SPARKLINE(I2, {"charttype", "bar"; "max", 100; "color1", "#10b981"})', 'f3')}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs transition-colors"
                >
                  {copiedKey === 'f3' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'f3' ? 'کپی شد' : 'کپی فرمول'}</span>
                </button>
              </div>
              <code className="block bg-slate-900 text-emerald-400 p-2.5 rounded-lg text-left font-mono dir-ltr text-xs border border-slate-800">
                =SPARKLINE(I2, &#123;"charttype", "bar"; "max", 100; "color1", "#10b981"&#125;)
              </code>
            </div>
          </div>

          {/* Data Validation & Formatting Tips */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 text-indigo-700 font-bold">
                <ChevronRight className="w-4 h-4" />
                <span>تنظیم لیست کشویی (Data Validation)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                در ستون «هدف کلان» برگه دوم، روی سلول کلیک راست کرده و <code>Data &gt; Data validation &gt; Add rule &gt; Dropdown (from a range)</code>
                را انتخاب کرده و محدوده را <code>اهداف_کلان!B2:B50</code> قرار دهید.
              </p>
            </div>

            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 text-indigo-700 font-bold">
                <Shield className="w-4 h-4" />
                <span>محافظت و قفل برگه (Protect Sheet)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                روی برگه «اهداف کلان» راست‌کلیک کرده و گزینه <code>Protect sheet</code> را فعال کنید تا فقط مدیر اجازه ویرایش اهداف اصلی را داشته باشد.
              </p>
            </div>
          </div>

          {/* Google Apps Script for Automated Email Alert */}
          <div className="bg-slate-900 text-slate-100 rounded-xl p-4 space-y-3 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Code className="w-4 h-4" />
                <span>کد خودکارسازی Google Apps Script (ارسال ایمیل مانده‌گیری)</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(appsScriptCode, 'gas')}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 px-3 py-1 rounded-md transition-colors"
              >
                {copiedKey === 'gas' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'gas' ? 'کپی شد' : 'کپی کد اسکریپت'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              در گوگل شیت از منوی <code>Extensions &gt; Apps Script</code> رفته و این کد را پیست کنید تا وضعیت مانده‌گیری و اهداف عقب‌مانده ایمیل شود:
            </p>
            <pre className="text-[11px] font-mono text-emerald-400 bg-black/60 p-3 rounded-lg overflow-x-auto dir-ltr border border-slate-800/80">
              {appsScriptCode}
            </pre>
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors"
            >
              بستن راهنما
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
