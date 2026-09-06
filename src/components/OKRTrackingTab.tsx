import React, { useState } from 'react';
import { OKRItem, SubGoal, StrategicGoal, SeasonKey, SEASONS_CONFIG, OKRStatus, ManagerEval } from '../types';
import { Plus, Edit2, Trash2, CheckCircle, Clock, AlertTriangle, Sparkles, MessageSquare } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OKRTrackingTabProps {
  okrs: OKRItem[];
  subGoals: SubGoal[];
  strategicGoals: StrategicGoal[];
  onAddOKR: (okr: Omit<OKRItem, 'id' | 'updatedAt'>) => void;
  onUpdateOKR: (okr: OKRItem) => void;
  onDeleteOKR: (id: string) => void;
}

export const OKRTrackingTab: React.FC<OKRTrackingTabProps> = ({
  okrs,
  subGoals,
  strategicGoals,
  onAddOKR,
  onUpdateOKR,
  onDeleteOKR,
}) => {
  const [activeQuarter, setActiveQuarter] = useState<SeasonKey>('spring');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOKR, setEditingOKR] = useState<OKRItem | null>(null);

  // Form State
  const [subGoalId, setSubGoalId] = useState(subGoals[0]?.id || '');
  const [quarter, setQuarter] = useState<SeasonKey>('spring');
  const [keyResultTitle, setKeyResultTitle] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [unit, setUnit] = useState('');
  const [month1Progress, setMonth1Progress] = useState(0);
  const [month2Progress, setMonth2Progress] = useState(0);
  const [month3Progress, setMonth3Progress] = useState(0);
  const [status, setStatus] = useState<OKRStatus>('in_progress');
  const [managerEvaluation, setManagerEvaluation] = useState<ManagerEval>('on_track');
  const [obstaclesComment, setObstaclesComment] = useState('');
  const [actionPlan, setActionPlan] = useState('');

  const currentSeasonConfig = SEASONS_CONFIG[activeQuarter];

  const filteredOkrs = okrs.filter((item) => {
    const quarterMatch = item.quarter === activeQuarter;
    const statusMatch = statusFilter === 'all' || item.status === statusFilter;
    return quarterMatch && statusMatch;
  });

  const quarterAvg =
    filteredOkrs.length > 0
      ? Math.round(
          filteredOkrs.reduce(
            (acc, cur) => acc + (cur.month1Progress + cur.month2Progress + cur.month3Progress) / 3,
            0
          ) / filteredOkrs.length
        )
      : 0;

  const handleOpenAdd = () => {
    setEditingOKR(null);
    setSubGoalId(subGoals[0]?.id || '');
    setQuarter(activeQuarter);
    setKeyResultTitle('');
    setTargetValue('100');
    setCurrentValue('0');
    setUnit('درصد');
    setMonth1Progress(0);
    setMonth2Progress(0);
    setMonth3Progress(0);
    setStatus('in_progress');
    setManagerEvaluation('on_track');
    setObstaclesComment('');
    setActionPlan('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: OKRItem) => {
    setEditingOKR(item);
    setSubGoalId(item.subGoalId);
    setQuarter(item.quarter);
    setKeyResultTitle(item.keyResultTitle);
    setTargetValue(item.targetValue);
    setCurrentValue(item.currentValue);
    setUnit(item.unit);
    setMonth1Progress(item.month1Progress);
    setMonth2Progress(item.month2Progress);
    setMonth3Progress(item.month3Progress);
    setStatus(item.status);
    setManagerEvaluation(item.managerEvaluation);
    setObstaclesComment(item.obstaclesComment || '');
    setActionPlan(item.actionPlan || '');
    setIsModalOpen(true);
  };

  const handleProgressChange = (item: OKRItem, month: 1 | 2 | 3, value: number) => {
    const updated = { ...item };
    if (month === 1) updated.month1Progress = value;
    if (month === 2) updated.month2Progress = value;
    if (month === 3) updated.month3Progress = value;

    const avg = Math.round((updated.month1Progress + updated.month2Progress + updated.month3Progress) / 3);
    if (avg >= 100 && item.status !== 'completed') {
      updated.status = 'completed';
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
    }
    onUpdateOKR(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyResultTitle.trim()) return;

    const avg = Math.round((Number(month1Progress) + Number(month2Progress) + Number(month3Progress)) / 3);
    const finalStatus = avg >= 100 ? 'completed' : status;

    if (editingOKR) {
      onUpdateOKR({
        ...editingOKR,
        subGoalId,
        quarter,
        keyResultTitle,
        targetValue,
        currentValue,
        unit,
        month1Progress: Number(month1Progress),
        month2Progress: Number(month2Progress),
        month3Progress: Number(month3Progress),
        status: finalStatus,
        managerEvaluation,
        obstaclesComment,
        actionPlan,
      });
    } else {
      onAddOKR({
        subGoalId,
        quarter,
        keyResultTitle,
        targetValue,
        currentValue,
        unit,
        month1Progress: Number(month1Progress),
        month2Progress: Number(month2Progress),
        month3Progress: Number(month3Progress),
        status: finalStatus,
        managerEvaluation,
        obstaclesComment,
        actionPlan,
      });
    }
    setIsModalOpen(false);
  };

  const quarters: { key: SeasonKey; label: string }[] = [
    { key: 'spring', label: '🌸 بهار (سه ماهه اول)' },
    { key: 'summer', label: '☀️ تابستان (سه ماهه دوم)' },
    { key: 'autumn', label: '🍂 پاییز (سه ماهه سوم)' },
    { key: 'winter', label: '❄️ زمستان (سه ماهه چهارم)' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">برگه ۳: پنل OKR و پیگیری فصلی و ماهانه (OKR Tracking)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            پیگیری اهداف کلیدی (Key Results) در هر فصل با ثبت درصد پیشرفت ماه به ماه و ارزیابی چراغ راهنمای مدیریت.
          </p>
        </div>

        <button
          id="add-okr-btn"
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-lg shadow-xs transition-all ring-1 ring-indigo-500/20 self-start md:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>افزودن نتیجه کلیدی (OKR) جدید</span>
        </button>
      </div>

      {/* Season Tabs Selector */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-2.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {quarters.map((q) => {
            const count = okrs.filter((o) => o.quarter === q.key).length;
            const isSelected = activeQuarter === q.key;
            return (
              <button
                key={q.key}
                type="button"
                onClick={() => setActiveQuarter(q.key)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{q.label}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-md ${
                    isSelected ? 'bg-indigo-700/80 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200/50'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Status Filter and Quarter Stats */}
        <div className="flex items-center gap-3 px-1">
          <div className="flex items-center gap-1.5">
            <label htmlFor="okr-status-filter-select" className="text-xs text-slate-600 font-medium">وضعیت:</label>
            <select
              id="okr-status-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-colors"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="completed">تکمیل شده</option>
              <option value="in_progress">در جریان</option>
              <option value="behind">عقب‌مانده</option>
              <option value="not_started">شروع نشده</option>
            </select>
          </div>

          <div className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3 py-1.5 rounded-lg font-bold whitespace-nowrap shadow-2xs">
            پیشرفت فصل: <strong>{quarterAvg}٪</strong>
          </div>
        </div>
      </div>

      {/* Month Names Legend */}
      <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 font-medium">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-800">ماه‌های فصل {currentSeasonConfig.name}:</span>
          <span className="bg-white border border-slate-200/80 px-2.5 py-1 rounded-md font-bold text-indigo-700 shadow-2xs">
            ماه اول: {currentSeasonConfig.months[0]}
          </span>
          <span className="bg-white border border-slate-200/80 px-2.5 py-1 rounded-md font-bold text-indigo-700 shadow-2xs">
            ماه دوم: {currentSeasonConfig.months[1]}
          </span>
          <span className="bg-white border border-slate-200/80 px-2.5 py-1 rounded-md font-bold text-indigo-700 shadow-2xs">
            ماه سوم: {currentSeasonConfig.months[2]}
          </span>
        </div>
        <div className="text-[11px] text-slate-500 bg-white/70 px-2.5 py-1 rounded-md border border-slate-200/50">
          💡 میانگین ۳ ماه: <code>(M1 + M2 + M3) / 3</code>
        </div>
      </div>

      {/* OKR Items List Cards / Table */}
      {filteredOkrs.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center shadow-xs">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-sm">هیچ OKR فعالی در این فصل تعریف نشده است.</h3>
          <p className="text-xs text-slate-500 mt-1">
            می‌توانید با کلیک بر روی دکمه زیر یا از برگه اهداف خرد، اقداماتی را به عنوان OKR فصلی انتخاب کنید.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-indigo-700 transition-colors"
          >
            تعریف اولین OKR فصل {currentSeasonConfig.name}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOkrs.map((okr) => {
            const linkedSub = subGoals.find((s) => s.id === okr.subGoalId);
            const parentStrategic = linkedSub ? strategicGoals.find((g) => g.id === linkedSub.strategicGoalId) : null;
            const avg = Math.round((okr.month1Progress + okr.month2Progress + okr.month3Progress) / 3);

            return (
              <div
                key={okr.id}
                className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow"
              >
                {/* Top Details */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {parentStrategic && (
                        <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold border border-slate-200/60">
                          استراتژی: [{parentStrategic.code}] {parentStrategic.department}
                        </span>
                      )}
                      {linkedSub && (
                        <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold border border-indigo-100">
                          اقدام: {linkedSub.code}
                        </span>
                      )}
                      {/* Status Badge */}
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                          okr.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : okr.status === 'in_progress'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : okr.status === 'behind'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {okr.status === 'completed'
                          ? 'تکمیل شده ✅'
                          : okr.status === 'in_progress'
                          ? 'در جریان ⏳'
                          : okr.status === 'behind'
                          ? 'عقب‌مانده ⚠️'
                          : 'شروع نشده ⏸️'}
                      </span>

                      {/* Manager Traffic Light Badge */}
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 border ${
                          okr.managerEvaluation === 'ahead'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : okr.managerEvaluation === 'on_track'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            okr.managerEvaluation === 'ahead'
                              ? 'bg-emerald-600'
                              : okr.managerEvaluation === 'on_track'
                              ? 'bg-amber-600'
                              : 'bg-rose-600'
                          }`}
                        />
                        {okr.managerEvaluation === 'ahead'
                          ? 'ارزیابی: فراتر از برنامه 🟢'
                          : okr.managerEvaluation === 'on_track'
                          ? 'ارزیابی: مطابق برنامه 🟡'
                          : 'ارزیابی: عقب‌تر از برنامه 🔴'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug pt-1">
                      نتیجه کلیدی: {okr.keyResultTitle}
                    </h3>

                    {linkedSub && (
                      <p className="text-xs text-slate-500">
                        متصل به اقدام: <strong>{linkedSub.title}</strong>
                      </p>
                    )}
                  </div>

                  {/* Top Right Target Value & Actions */}
                  <div className="flex items-center gap-2 self-end md:self-start">
                    <div className="text-left bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg text-xs shadow-2xs">
                      <div className="text-slate-400 text-[10px]">شاخص هدف:</div>
                      <div className="font-bold text-slate-800">
                        {okr.targetValue} {okr.unit}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(okr)}
                      title="ویرایش OKR"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('آیا از حذف این OKR اطمینان دارید؟')) {
                          onDeleteOKR(okr.id);
                        }
                      }}
                      title="حذف OKR"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Monthly Tracking Interactive Sliders */}
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Month 1 */}
                  <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/60 shadow-2xs">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                      <span>ماه ۱ ({currentSeasonConfig.months[0]}):</span>
                      <span className="text-indigo-600 font-extrabold">{okr.month1Progress}٪</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={okr.month1Progress}
                      onChange={(e) => handleProgressChange(okr, 1, Number(e.target.value))}
                      className="w-full accent-indigo-600 h-1.5 cursor-pointer"
                    />
                    <div className="flex justify-between gap-1 mt-2">
                      {[0, 50, 100].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleProgressChange(okr, 1, val)}
                          className="text-[10px] px-1.5 py-0.5 bg-white hover:bg-slate-100 rounded-sm border border-slate-200 text-slate-600 font-semibold transition-colors shadow-2xs"
                        >
                          {val}٪
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Month 2 */}
                  <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/60 shadow-2xs">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                      <span>ماه ۲ ({currentSeasonConfig.months[1]}):</span>
                      <span className="text-indigo-600 font-extrabold">{okr.month2Progress}٪</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={okr.month2Progress}
                      onChange={(e) => handleProgressChange(okr, 2, Number(e.target.value))}
                      className="w-full accent-indigo-600 h-1.5 cursor-pointer"
                    />
                    <div className="flex justify-between gap-1 mt-2">
                      {[0, 50, 100].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleProgressChange(okr, 2, val)}
                          className="text-[10px] px-1.5 py-0.5 bg-white hover:bg-slate-100 rounded-sm border border-slate-200 text-slate-600 font-semibold transition-colors shadow-2xs"
                        >
                          {val}٪
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Month 3 */}
                  <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/60 shadow-2xs">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                      <span>ماه ۳ ({currentSeasonConfig.months[2]}):</span>
                      <span className="text-indigo-600 font-extrabold">{okr.month3Progress}٪</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={okr.month3Progress}
                      onChange={(e) => handleProgressChange(okr, 3, Number(e.target.value))}
                      className="w-full accent-indigo-600 h-1.5 cursor-pointer"
                    />
                    <div className="flex justify-between gap-1 mt-2">
                      {[0, 50, 100].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleProgressChange(okr, 3, val)}
                          className="text-[10px] px-1.5 py-0.5 bg-white hover:bg-slate-100 rounded-sm border border-slate-200 text-slate-600 font-semibold transition-colors shadow-2xs"
                        >
                          {val}٪
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Overall Quarterly Progress Card */}
                  <div className="bg-indigo-50/70 rounded-xl p-3.5 border border-indigo-100/80 flex flex-col justify-between shadow-2xs">
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                      <span>میانگین پیشرفت فصلی:</span>
                      <span className="text-sm font-extrabold">{avg}٪</span>
                    </div>

                    <div className="w-full bg-indigo-200/60 rounded-full h-2.5 overflow-hidden my-2">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          avg >= 100 ? 'bg-emerald-500' : avg >= 60 ? 'bg-indigo-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${avg}%` }}
                      />
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>فرمول: =AVERAGE(M1:M3)</span>
                      {avg >= 100 && <span className="text-emerald-700 font-bold">هدف محقق شد 🎉</span>}
                    </div>
                  </div>
                </div>

                {/* Obstacles & Action Plan Notes */}
                {(okr.obstaclesComment || okr.actionPlan) && (
                  <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50/50 rounded-lg p-3 text-xs text-slate-600 flex flex-col sm:flex-row gap-4">
                    {okr.obstaclesComment && (
                      <div className="flex-1">
                        <span className="font-bold text-rose-700 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          موانع و چالش‌ها:
                        </span>
                        <p className="mt-0.5 text-slate-700">{okr.obstaclesComment}</p>
                      </div>
                    )}
                    {okr.actionPlan && (
                      <div className="flex-1">
                        <span className="font-bold text-indigo-700 flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          برنامه اصلاحی / تصمیم مدیر:
                        </span>
                        <p className="mt-0.5 text-slate-700">{okr.actionPlan}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit OKR Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 text-base">
                {editingOKR ? 'ویرایش OKR و نتیجه کلیدی' : 'تعریف نتیجه کلیدی جدید (Quarterly OKR)'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="okr-quarter-select" className="block text-xs font-bold text-slate-700 mb-1">فصل مورد نظر:</label>
                  <select
                    id="okr-quarter-select"
                    value={quarter}
                    onChange={(e) => setQuarter(e.target.value as SeasonKey)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-bold"
                  >
                    <option value="spring">بهار (فصل ۱)</option>
                    <option value="summer">تابستان (فصل ۲)</option>
                    <option value="autumn">پاییز (فصل ۳)</option>
                    <option value="winter">زمستان (فصل ۴)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="okr-status-select" className="block text-xs font-bold text-slate-700 mb-1">وضعیت کلی:</label>
                  <select
                    id="okr-status-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as OKRStatus)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
                  >
                    <option value="in_progress">در جریان (فعال)</option>
                    <option value="completed">تکمیل شده</option>
                    <option value="behind">عقب‌مانده از برنامه</option>
                    <option value="not_started">شروع نشده</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="okr-parent-subgoal-select" className="block text-xs font-bold text-slate-700 mb-1">
                  هدف خرد مرجع (متصل به برگه دوم):
                </label>
                <select
                  id="okr-parent-subgoal-select"
                  value={subGoalId}
                  onChange={(e) => setSubGoalId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-medium"
                >
                  {subGoals.map((sg) => (
                    <option key={sg.id} value={sg.id}>
                      [{sg.code}] {sg.title} ({sg.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="okr-kr-title-input" className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان نتیجه کلیدی (Key Result) - عددی و قابل اندازه‌گیری:
                </label>
                <input
                  id="okr-kr-title-input"
                  type="text"
                  required
                  value={keyResultTitle}
                  onChange={(e) => setKeyResultTitle(e.target.value)}
                  placeholder="مثال: بستن ۱۰ قرارداد سازمانی جدید به ارزش کل ۵ میلیارد تومان"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="okr-target-value-input" className="block text-xs font-bold text-slate-700 mb-1">مقدار هدف:</label>
                  <input
                    id="okr-target-value-input"
                    type="text"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder="مثال: ۱۰ یا ۱۰۰"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-bold"
                  />
                </div>

                <div>
                  <label htmlFor="okr-unit-input" className="block text-xs font-bold text-slate-700 mb-1">واحد سنجش:</label>
                  <input
                    id="okr-unit-input"
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="قرارداد / درصد / مشتری"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Monthly progress inputs */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div>
                  <label htmlFor="okr-m1-progress-input" className="block text-[11px] font-bold text-slate-700 mb-1">ماه اول (%):</label>
                  <input
                    id="okr-m1-progress-input"
                    type="number"
                    min="0"
                    max="100"
                    value={month1Progress}
                    onChange={(e) => setMonth1Progress(Number(e.target.value))}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg text-center font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
                  />
                </div>
                <div>
                  <label htmlFor="okr-m2-progress-input" className="block text-[11px] font-bold text-slate-700 mb-1">ماه دوم (%):</label>
                  <input
                    id="okr-m2-progress-input"
                    type="number"
                    min="0"
                    max="100"
                    value={month2Progress}
                    onChange={(e) => setMonth2Progress(Number(e.target.value))}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg text-center font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
                  />
                </div>
                <div>
                  <label htmlFor="okr-m3-progress-input" className="block text-[11px] font-bold text-slate-700 mb-1">ماه سوم (%):</label>
                  <input
                    id="okr-m3-progress-input"
                    type="number"
                    min="0"
                    max="100"
                    value={month3Progress}
                    onChange={(e) => setMonth3Progress(Number(e.target.value))}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg text-center font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="okr-manager-eval-select" className="block text-xs font-bold text-slate-700 mb-1">
                  ارزیابی مدیر (سیستم چراغ راهنما):
                </label>
                <select
                  id="okr-manager-eval-select"
                  value={managerEvaluation}
                  onChange={(e) => setManagerEvaluation(e.target.value as ManagerEval)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-semibold"
                >
                  <option value="ahead">🟢 فراتر از برنامه (سبز پررنگ)</option>
                  <option value="on_track">🟡 مطابق برنامه (زرد / عادی)</option>
                  <option value="behind">🔴 عقب‌تر از برنامه (قرمز / نیازمند اقدام فوری)</option>
                </select>
              </div>

              <div>
                <label htmlFor="okr-obstacles-textarea" className="block text-xs font-bold text-slate-700 mb-1">موانع و دلایل عدم تحقق:</label>
                <textarea
                  id="okr-obstacles-textarea"
                  rows={2}
                  value={obstaclesComment}
                  onChange={(e) => setObstaclesComment(e.target.value)}
                  placeholder="موانع فنی، تداخلات، بودجه یا هماهنگی..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors"
                >
                  {editingOKR ? 'ذخیره تغییرات' : 'ثبت OKR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
