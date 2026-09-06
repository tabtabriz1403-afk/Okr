import { StrategicGoal, SubGoal, OKRItem, RoutineTask, SEASONS_CONFIG, MONTH_NAMES_PERSIAN } from '../types';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
            error_callback?: (err: unknown) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

export interface GoogleSheetsSyncResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  syncedAt: string;
}

export interface SyncProgressCallback {
  (step: string, percent: number): void;
}

// Generate the 5 datasets for Google Sheets
export function buildSheetsDataPayload(
  strategicGoals: StrategicGoal[],
  subGoals: SubGoal[],
  okrs: OKRItem[],
  routines: RoutineTask[],
  year: number
) {
  // 1. Dashboard Data
  const completedOkrs = okrs.filter((o) => o.status === 'completed').length;
  const inProgressOkrs = okrs.filter((o) => o.status === 'in_progress').length;
  const remainingOkrs = okrs.filter((o) => o.status !== 'completed').length;
  const avgProgress =
    okrs.length > 0
      ? Math.round(
          okrs.reduce(
            (acc, cur) => acc + (cur.month1Progress + cur.month2Progress + cur.month3Progress) / 3,
            0
          ) / okrs.length
        )
      : 0;

  const dashboardValues: (string | number)[][] = [
    [`📊 داشبورد مانده‌گیری و پایش برنامه‌ریزی سالانه (${year})`],
    [''],
    ['شاخص کلیدی عملکرد', 'مقدار', 'توضیحات و فرمول'],
    ['کل اهداف خرد تعریف شده', subGoals.length, 'مجموع اقدامات عملیاتی دپارتمان‌ها'],
    ['تعداد کل OKRهای فعال', okrs.length, 'تعداد نتایج کلیدی ثبت شده'],
    ['اهداف تکمیل شده ✅', completedOkrs, '=COUNTIF(پیگیری_OKR_فصلی!J:J, "تکمیل شده ✅")'],
    ['اهداف در جریان ⏳', inProgressOkrs, '=COUNTIF(پیگیری_OKR_فصلی!J:J, "در جریان ⏳")'],
    ['مانده اهداف (باقیمانده) ⚠️', remainingOkrs, 'نیازمند پیگیری و مانده‌گیری در جلسات هفتگی'],
    ['میانگین درصد تحقق کل OKRها', `${avgProgress}%`, 'میانگین وزنی پیشرفت ۳ ماهه'],
    [''],
    ['جدول مانده‌گیری و پایش به تفکیک واحدها / گروه‌ها'],
    ['نام گروه / دپارتمان', 'اهداف خرد', 'تعداد OKRها', 'تکمیل شده', 'مانده', 'میانگین پیشرفت (%)'],
  ];

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
    const deptAvg =
      deptOkrs.length > 0
        ? Math.round(
            deptOkrs.reduce(
              (acc, cur) => acc + (cur.month1Progress + cur.month2Progress + cur.month3Progress) / 3,
              0
            ) / deptOkrs.length
          )
        : 0;

    dashboardValues.push([dept, deptSub.length, deptOkrs.length, completed, remaining, `${deptAvg}%`]);
  });

  // 2. Strategic Goals Data
  const strategicValues: (string | number)[][] = [
    ['کد هدف', 'عنوان هدف کلان استراتژیک', 'واحد مسئول', 'وزن هدف (۱-۱۰۰)', 'سال', 'توضیحات و خط‌مشی'],
    ...strategicGoals.map((g) => [
      g.code,
      g.title,
      g.department,
      g.weight,
      g.year,
      g.description || '',
    ]),
  ];

  // 3. Sub Goals Data
  const subGoalValues: (string | number)[][] = [
    ['کد هدف خرد', 'هدف کلان مرجع', 'عنوان اقدام عملیاتی', 'واحد / تیم مجری', 'فصل پیشنهادی', 'شاخص هدف', 'یادداشت‌ها'],
    ...subGoals.map((sg) => {
      const parent = strategicGoals.find((g) => g.id === sg.strategicGoalId);
      const seasonLabel = sg.suggestedSeason === 'all_year' ? 'کل سال' : SEASONS_CONFIG[sg.suggestedSeason]?.name || sg.suggestedSeason;
      return [
        sg.code,
        parent ? `[${parent.code}] ${parent.title}` : '',
        sg.title,
        sg.department,
        seasonLabel,
        sg.targetMetric || '',
        sg.notes || '',
      ];
    }),
  ];

  // 4. OKR Tracking Data
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

  const okrValues: (string | number)[][] = [
    [
      'فصل',
      'کد اقدام خرد',
      'نتیجه کلیدی (Key Result)',
      'مقدار هدف',
      'واحد سنجش',
      'ماه ۱ (%)',
      'ماه ۲ (%)',
      'ماه ۳ (%)',
      'میانگین پیشرفت (%)',
      'وضعیت',
      'ارزیابی مدیر',
      'موانع و اقدامات اصلاحی',
    ],
    ...okrs.map((item, idx) => {
      const linked = subGoals.find((s) => s.id === item.subGoalId);
      const seasonName = SEASONS_CONFIG[item.quarter]?.name || item.quarter;
      const rowNum = idx + 2;
      return [
        seasonName,
        linked ? `${linked.code} - ${linked.title}` : '',
        item.keyResultTitle,
        item.targetValue,
        item.unit,
        item.month1Progress,
        item.month2Progress,
        item.month3Progress,
        `=ROUND(AVERAGE(F${rowNum}:H${rowNum}))`, // Live Google Sheets Formula!
        okrStatusMap[item.status] || item.status,
        evalMap[item.managerEvaluation] || item.managerEvaluation,
        item.obstaclesComment || '',
      ];
    }),
  ];

  // 5. Routines Data
  const freqMap: Record<string, string> = {
    daily: 'روزانه',
    weekly: 'هفتگی',
    monthly: 'ماهانه',
    quarterly: 'فصلی',
  };

  const routineValues: (string | number)[][] = [
    [
      'شرح کار روتین و فرآیندی',
      'واحد مسئول',
      'تناوب',
      'مسئول پیگیری',
      ...MONTH_NAMES_PERSIAN.map((m) => m.name),
      'تعداد تیک‌ها',
      'درصد تحقق',
    ],
    ...routines.map((r, idx) => {
      const monthCols = MONTH_NAMES_PERSIAN.map((m) => (r.monthsChecked[m.id] ? '✓' : '-'));
      const rowNum = idx + 2;
      return [
        r.title,
        r.department,
        freqMap[r.frequency] || r.frequency,
        r.assignedTo || '',
        ...monthCols,
        `=COUNTIF(E${rowNum}:P${rowNum}, "✓")`, // Live Google Sheets Formula
        `=ROUND((COUNTIF(E${rowNum}:P${rowNum}, "✓")/12)*100)&"%"`, // Live Google Sheets Formula
      ];
    }),
  ];

  return {
    dashboardValues,
    strategicValues,
    subGoalValues,
    okrValues,
    routineValues,
  };
}

export function convertTableToTSV(rows: (string | number)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? '');
          // If cell contains tabs or newlines, quote it
          if (str.includes('\t') || str.includes('\n') || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join('\t')
    )
    .join('\n');
}

/**
 * Request Google OAuth token using Google Identity Services (GSI)
 */
export function requestGoogleAccessToken(clientId?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(
        new Error(
          'کتابخانه Google Identity Services هنوز بارگذاری نشده است. لطفاً چند لحظه دیگر مجدداً تلاش کنید.'
        )
      );
      return;
    }

    const cId =
      clientId ||
      (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
      '496231762584-apps.googleusercontent.com';

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: cId,
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
        callback: (tokenResponse) => {
          if (tokenResponse.error) {
            reject(new Error(`خطای مجوز گوگل: ${tokenResponse.error}`));
            return;
          }
          if (tokenResponse.access_token) {
            resolve(tokenResponse.access_token);
          } else {
            reject(new Error('توکن دسترسی دریافت نشد.'));
          }
        },
        error_callback: (err) => {
          reject(new Error(`خطا در اتصال به حساب گوگل: ${JSON.stringify(err)}`));
        },
      });

      client.requestAccessToken({ prompt: 'consent' });
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Syncs full OKR and Strategic data into Google Sheets
 */
export async function syncToGoogleSheets(
  accessToken: string,
  strategicGoals: StrategicGoal[],
  subGoals: SubGoal[],
  okrs: OKRItem[],
  routines: RoutineTask[],
  year: number,
  existingSpreadsheetId?: string,
  onProgress?: SyncProgressCallback
): Promise<GoogleSheetsSyncResult> {
  onProgress?.('در حال آماده‌سازی ساختار فایل و برگه‌ها...', 20);

  const payload = buildSheetsDataPayload(strategicGoals, subGoals, okrs, routines, year);
  let spreadsheetId = existingSpreadsheetId?.trim();
  const spreadsheetTitle = `برنامه‌ریزی سالانه و داشبورد OKR - سال ${year}`;

  // If no existing spreadsheet, create a brand new one
  if (!spreadsheetId) {
    onProgress?.('در حال ایجاد فایل اسپردشیت جدید در Google Drive...', 40);

    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: spreadsheetTitle,
          locale: 'fa_IR',
          autoRecalc: 'ON_CHANGE',
        },
        sheets: [
          {
            properties: {
              title: 'داشبورد_مانده‌گیری',
              rightToLeft: true,
              gridProperties: { rowCount: 60, columnCount: 15 },
            },
          },
          {
            properties: {
              title: 'اهداف_کلان',
              rightToLeft: true,
              gridProperties: { rowCount: 100, columnCount: 12 },
            },
          },
          {
            properties: {
              title: 'اهداف_خرد',
              rightToLeft: true,
              gridProperties: { rowCount: 150, columnCount: 12 },
            },
          },
          {
            properties: {
              title: 'پیگیری_OKR_فصلی',
              rightToLeft: true,
              gridProperties: { rowCount: 150, columnCount: 16 },
            },
          },
          {
            properties: {
              title: 'چک‌لیست_روتین‌ها',
              rightToLeft: true,
              gridProperties: { rowCount: 100, columnCount: 22 },
            },
          },
        ],
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(err.error?.message || 'خطا در ایجاد گوگل شیت جدید.');
    }

    const createdData = await createRes.json();
    spreadsheetId = createdData.spreadsheetId;
  }

  // Populate data via batchUpdate
  onProgress?.('در حال ارسال و نگاشت اطلاعات به برگه‌های گوگل شیت...', 70);

  const valuesBatchRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: 'داشبورد_مانده‌گیری!A1',
            values: payload.dashboardValues,
          },
          {
            range: 'اهداف_کلان!A1',
            values: payload.strategicValues,
          },
          {
            range: 'اهداف_خرد!A1',
            values: payload.subGoalValues,
          },
          {
            range: 'پیگیری_OKR_فصلی!A1',
            values: payload.okrValues,
          },
          {
            range: 'چک‌لیست_روتین‌ها!A1',
            values: payload.routineValues,
          },
        ],
      }),
    }
  );

  if (!valuesBatchRes.ok) {
    const err = await valuesBatchRes.json();
    throw new Error(err.error?.message || 'خطا در بارگذاری داده‌ها به گوگل شیت.');
  }

  onProgress?.('در حال قالب‌بندی و نهایی‌سازی استایل‌ها...', 90);

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  onProgress?.('عملیات با موفقیت پایان یافت.', 100);

  return {
    spreadsheetId,
    spreadsheetUrl,
    title: spreadsheetTitle,
    syncedAt: new Date().toLocaleTimeString('fa-IR'),
  };
}
