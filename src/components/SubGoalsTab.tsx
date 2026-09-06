import React, { useState } from 'react';
import { StrategicGoal, SubGoal, OKRItem, DepartmentInfo, SeasonKey, SEASONS_CONFIG } from '../types';
import { Plus, Edit2, Trash2, Layers, ArrowUpRight, Filter, CheckCircle2, Calendar } from 'lucide-react';

interface SubGoalsTabProps {
  strategicGoals: StrategicGoal[];
  subGoals: SubGoal[];
  okrs: OKRItem[];
  departments: DepartmentInfo[];
  selectedStrategicFilter?: string | null;
  onClearStrategicFilter?: () => void;
  onAddSubGoal: (subGoal: Omit<SubGoal, 'id' | 'createdAt'>) => void;
  onUpdateSubGoal: (subGoal: SubGoal) => void;
  onDeleteSubGoal: (id: string) => void;
  onPromoteToOKR: (subGoal: SubGoal, season: SeasonKey) => void;
}

export const SubGoalsTab: React.FC<SubGoalsTabProps> = ({
  strategicGoals,
  subGoals,
  okrs,
  departments,
  selectedStrategicFilter,
  onClearStrategicFilter,
  onAddSubGoal,
  onUpdateSubGoal,
  onDeleteSubGoal,
  onPromoteToOKR,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [strategicFilter, setStrategicFilter] = useState<string>(selectedStrategicFilter || 'all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubGoal, setEditingSubGoal] = useState<SubGoal | null>(null);

  // Form fields
  const [code, setCode] = useState('');
  const [strategicGoalId, setStrategicGoalId] = useState(strategicGoals[0]?.id || '');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState(departments[0]?.name || 'فروش و بازاریابی');
  const [suggestedSeason, setSuggestedSeason] = useState<SeasonKey | 'all_year'>('spring');
  const [targetMetric, setTargetMetric] = useState('');
  const [notes, setNotes] = useState('');

  // Promote Modal
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [subGoalToPromote, setSubGoalToPromote] = useState<SubGoal | null>(null);
  const [targetSeasonForPromote, setTargetSeasonForPromote] = useState<SeasonKey>('spring');

  const filteredList = subGoals.filter((item) => {
    const deptMatch = selectedDept === 'all' || item.department === selectedDept;
    const seasonMatch = selectedSeason === 'all' || item.suggestedSeason === selectedSeason;
    const strategicMatch = strategicFilter === 'all' || item.strategicGoalId === strategicFilter;
    return deptMatch && seasonMatch && strategicMatch;
  });

  const handleOpenAdd = () => {
    setEditingSubGoal(null);
    const parentGoal = strategicGoals.find((g) => g.id === strategicGoalId) || strategicGoals[0];
    const parentCode = parentGoal ? parentGoal.code : 'G1';
    const count = subGoals.filter((s) => s.strategicGoalId === (parentGoal?.id || '')).length;
    setCode(`S${parentCode}.${count + 1}`);
    setTitle('');
    setDepartment(parentGoal?.department || departments[0]?.name || 'فروش و بازاریابی');
    setSuggestedSeason('spring');
    setTargetMetric('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sg: SubGoal) => {
    setEditingSubGoal(sg);
    setCode(sg.code);
    setStrategicGoalId(sg.strategicGoalId);
    setTitle(sg.title);
    setDepartment(sg.department);
    setSuggestedSeason(sg.suggestedSeason);
    setTargetMetric(sg.targetMetric || '');
    setNotes(sg.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingSubGoal) {
      onUpdateSubGoal({
        ...editingSubGoal,
        code,
        strategicGoalId,
        title,
        department,
        suggestedSeason,
        targetMetric,
        notes,
      });
    } else {
      onAddSubGoal({
        code: code || `SG.${Date.now().toString().slice(-4)}`,
        strategicGoalId,
        title,
        department,
        suggestedSeason,
        targetMetric,
        notes,
      });
    }
    setIsModalOpen(false);
  };

  const handleOpenPromote = (sg: SubGoal) => {
    setSubGoalToPromote(sg);
    setTargetSeasonForPromote((sg.suggestedSeason === 'all_year' ? 'spring' : sg.suggestedSeason) as SeasonKey);
    setPromoteModalOpen(true);
  };

  const handleConfirmPromote = () => {
    if (subGoalToPromote) {
      onPromoteToOKR(subGoalToPromote, targetSeasonForPromote);
      setPromoteModalOpen(false);
      setSubGoalToPromote(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">برگه ۲: تعریف اهداف خرد و اقدامات عملیاتی (Sub-Goals)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            گروه‌ها و واحدها اهداف کلان را به برنامه‌ها و اقدامات عملیاتی ریز تبدیل کرده و زمان‌بندی پیشنهادی می‌دهند.
          </p>
        </div>

        <button
          id="add-subgoal-btn"
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-lg shadow-xs transition-all ring-1 ring-indigo-500/20 self-start md:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>تعریف هدف خرد جدید</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>فیلترها:</span>
          </div>

          {/* Strategic Goal Filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="subgoal-filter-goal-select" className="text-xs text-slate-600 font-medium">هدف کلان:</label>
            <select
              id="subgoal-filter-goal-select"
              value={strategicFilter}
              onChange={(e) => setStrategicFilter(e.target.value)}
              className="text-xs bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-colors"
            >
              <option value="all">تمام اهداف کلان</option>
              {strategicGoals.map((g) => (
                <option key={g.id} value={g.id}>
                  [{g.code}] {g.title.slice(0, 35)}...
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="subgoal-filter-dept-select" className="text-xs text-slate-600 font-medium">واحد مسئول:</label>
            <select
              id="subgoal-filter-dept-select"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-colors"
            >
              <option value="all">همه واحدها</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Season Filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="subgoal-filter-season-select" className="text-xs text-slate-600 font-medium">فصل پیشنهادی:</label>
            <select
              id="subgoal-filter-season-select"
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="text-xs bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-colors"
            >
              <option value="all">همه فصول</option>
              <option value="spring">بهار</option>
              <option value="summer">تابستان</option>
              <option value="autumn">پاییز</option>
              <option value="winter">زمستان</option>
              <option value="all_year">کل سال</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60">
          تعداد کل: <strong className="text-slate-900">{filteredList.length}</strong> هدف خرد
        </div>
      </div>

      {/* Sub Goals List Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">کد</th>
                <th className="py-3 px-4">هدف کلان مرجع</th>
                <th className="py-3 px-4 min-w-[280px]">عنوان اقدام عملیاتی (هدف خرد)</th>
                <th className="py-3 px-4">واحد مسئول</th>
                <th className="py-3 px-4">فصل پیشنهادی</th>
                <th className="py-3 px-4">شاخص هدف</th>
                <th className="py-3 px-4 text-center">وضعیت در OKR</th>
                <th className="py-3 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((sg) => {
                const parentGoal = strategicGoals.find((g) => g.id === sg.strategicGoalId);
                const linkedOkrs = okrs.filter((o) => o.subGoalId === sg.id);
                const hasOKR = linkedOkrs.length > 0;
                const seasonLabel =
                  sg.suggestedSeason === 'all_year'
                    ? 'کل سال'
                    : SEASONS_CONFIG[sg.suggestedSeason as SeasonKey]?.name || sg.suggestedSeason;

                return (
                  <tr key={sg.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-black text-indigo-700 whitespace-nowrap">{sg.code}</td>

                    <td className="py-3.5 px-4">
                      {parentGoal ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">[{parentGoal.code}]</span>
                          <span className="text-slate-600 line-clamp-1 max-w-[200px]" title={parentGoal.title}>
                            {parentGoal.title}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">نامشخص</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 leading-snug">{sg.title}</p>
                      {sg.notes && <p className="text-[11px] text-slate-500 mt-0.5 font-normal">{sg.notes}</p>}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                        {sg.department}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {seasonLabel}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {sg.targetMetric || <span className="text-slate-400">-</span>}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {hasOKR ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{linkedOkrs.length} OKR فعال</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenPromote(sg)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:bg-indigo-200 border border-indigo-200/80 transition-colors shadow-2xs"
                        >
                          <ArrowUpRight className="w-3 h-3" />
                          <span>تبدیل به OKR</span>
                        </button>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(sg)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                          title="ویرایش"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('آیا از حذف این هدف خرد اطمینان دارید؟')) {
                              onDeleteSubGoal(sg.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Sub-Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 text-base">
                {editingSubGoal ? 'ویرایش هدف خرد' : 'تعریف اقدام عملیاتی و هدف خرد جدید'}
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
              <div>
                <label htmlFor="subgoal-parent-goal-select" className="block text-xs font-bold text-slate-700 mb-1">
                  هدف کلان مرجع (Data Validation):
                </label>
                <select
                  id="subgoal-parent-goal-select"
                  value={strategicGoalId}
                  onChange={(e) => {
                    setStrategicGoalId(e.target.value);
                    const selected = strategicGoals.find((g) => g.id === e.target.value);
                    if (selected) {
                      setDepartment(selected.department);
                      const count = subGoals.filter((s) => s.strategicGoalId === selected.id).length;
                      setCode(`S${selected.code}.${count + 1}`);
                    }
                  }}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-medium"
                >
                  {strategicGoals.map((g) => (
                    <option key={g.id} value={g.id}>
                      [{g.code}] {g.title} ({g.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="subgoal-code-input" className="block text-xs font-bold text-slate-700 mb-1">کد هدف خرد:</label>
                  <input
                    id="subgoal-code-input"
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="SG1.1"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-bold"
                  />
                </div>

                <div>
                  <label htmlFor="subgoal-dept-select" className="block text-xs font-bold text-slate-700 mb-1">گروه / واحد مسئول:</label>
                  <select
                    id="subgoal-dept-select"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-medium"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="subgoal-title-input" className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان هدف خرد (اقدام عملیاتی):
                </label>
                <input
                  id="subgoal-title-input"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: راه‌اندازی کمپین تبلیغات دیجیتال برای جذب ۳۰۰ لید سازمانی"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="subgoal-season-select" className="block text-xs font-bold text-slate-700 mb-1">فصل پیشنهادی اجرا:</label>
                  <select
                    id="subgoal-season-select"
                    value={suggestedSeason}
                    onChange={(e) => setSuggestedSeason(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-medium"
                  >
                    <option value="spring">بهار (فصل ۱)</option>
                    <option value="summer">تابستان (فصل ۲)</option>
                    <option value="autumn">پاییز (فصل ۳)</option>
                    <option value="winter">زمستان (فصل ۴)</option>
                    <option value="all_year">مستمر در کل سال</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="subgoal-metric-input" className="block text-xs font-bold text-slate-700 mb-1">شاخص کلیدی هدف:</label>
                  <input
                    id="subgoal-metric-input"
                    type="text"
                    value={targetMetric}
                    onChange={(e) => setTargetMetric(e.target.value)}
                    placeholder="مثال: ۳۰۰ لید یا Uptime 99.9%"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-medium"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subgoal-notes-textarea" className="block text-xs font-bold text-slate-700 mb-1">توضیحات و نیازمندی‌ها:</label>
                <textarea
                  id="subgoal-notes-textarea"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="نیازمندی‌ها، بودجه یا هماهنگی بین‌واحدی..."
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
                  {editingSubGoal ? 'ذخیره تغییرات' : 'ثبت هدف خرد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Promote to OKR Modal */}
      {promoteModalOpen && subGoalToPromote && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-slate-900 text-base mb-2">انتخاب به عنوان OKR فصلی</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              شما در حال اضافه کردن اقدام <strong>«{subGoalToPromote.title}»</strong> به پنل پیگیری فصلی و ماهانه OKR
              هستید. کدام فصل را انتخاب می‌کنید؟
            </p>

            <div className="space-y-3">
              <div>
                <label htmlFor="promote-target-season-select" className="block text-xs font-bold text-slate-700 mb-1">فصل اجرای OKR:</label>
                <select
                  id="promote-target-season-select"
                  value={targetSeasonForPromote}
                  onChange={(e) => setTargetSeasonForPromote(e.target.value as SeasonKey)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-bold"
                >
                  <option value="spring">بهار (فروردین، اردیبهشت، خرداد)</option>
                  <option value="summer">تابستان (تیر، مرداد، شهریور)</option>
                  <option value="autumn">پاییز (مهر، آبان، آذر)</option>
                  <option value="winter">زمستان (دی، بهمن، اسفند)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPromoteModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPromote}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors"
                >
                  افزودن به پنل OKR فصل
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
