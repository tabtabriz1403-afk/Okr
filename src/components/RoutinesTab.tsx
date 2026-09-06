import React, { useState } from 'react';
import { RoutineTask, DepartmentInfo, RoutineFrequency, MONTH_NAMES_PERSIAN, SeasonKey } from '../types';
import { Plus, Edit2, Trash2, CheckSquare, Check, Filter } from 'lucide-react';

interface RoutinesTabProps {
  routines: RoutineTask[];
  departments: DepartmentInfo[];
  onAddRoutine: (routine: Omit<RoutineTask, 'id'>) => void;
  onUpdateRoutine: (routine: RoutineTask) => void;
  onDeleteRoutine: (id: string) => void;
}

export const RoutinesTab: React.FC<RoutinesTabProps> = ({
  routines,
  departments,
  onAddRoutine,
  onUpdateRoutine,
  onDeleteRoutine,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedFreq, setSelectedFreq] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<RoutineTask | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState(departments[0]?.name || 'مالی و اداری');
  const [frequency, setFrequency] = useState<RoutineFrequency>('monthly');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');

  const filteredRoutines = routines.filter((r) => {
    const deptMatch = selectedDept === 'all' || r.department === selectedDept;
    const freqMatch = selectedFreq === 'all' || r.frequency === selectedFreq;
    return deptMatch && freqMatch;
  });

  const handleToggleMonth = (routine: RoutineTask, monthId: number) => {
    const updatedMonths = {
      ...routine.monthsChecked,
      [monthId]: !routine.monthsChecked[monthId],
    };
    onUpdateRoutine({
      ...routine,
      monthsChecked: updatedMonths,
    });
  };

  const handleToggleSeasonAll = (routine: RoutineTask, season: SeasonKey, forceValue?: boolean) => {
    const monthIds = MONTH_NAMES_PERSIAN.filter((m) => m.season === season).map((m) => m.id);
    const currentValue = monthIds.every((id) => routine.monthsChecked[id]);
    const targetValue = forceValue !== undefined ? forceValue : !currentValue;

    const newChecks = { ...routine.monthsChecked };
    monthIds.forEach((id) => {
      newChecks[id] = targetValue;
    });

    onUpdateRoutine({
      ...routine,
      monthsChecked: newChecks,
    });
  };

  const handleOpenAdd = () => {
    setEditingRoutine(null);
    setTitle('');
    setDepartment(departments[0]?.name || 'مالی و اداری');
    setFrequency('monthly');
    setAssignedTo('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (routine: RoutineTask) => {
    setEditingRoutine(routine);
    setTitle(routine.title);
    setDepartment(routine.department);
    setFrequency(routine.frequency);
    setAssignedTo(routine.assignedTo || '');
    setNotes(routine.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingRoutine) {
      onUpdateRoutine({
        ...editingRoutine,
        title,
        department,
        frequency,
        assignedTo,
        notes,
      });
    } else {
      const defaultChecks: Record<number, boolean> = {};
      for (let i = 1; i <= 12; i++) {
        defaultChecks[i] = false;
      }
      onAddRoutine({
        title,
        department,
        frequency,
        quarterTarget: 'all_year',
        monthsChecked: defaultChecks,
        assignedTo,
        notes,
      });
    }
    setIsModalOpen(false);
  };

  const freqLabels: Record<RoutineFrequency, string> = {
    daily: 'روزانه',
    weekly: 'هفتگی',
    monthly: 'ماهانه',
    quarterly: 'فصلی',
  };

  // Calculate monthly stats
  const monthlyCheckCounts = MONTH_NAMES_PERSIAN.map((m) => {
    const total = routines.length;
    const checked = routines.filter((r) => r.monthsChecked[m.id]).length;
    const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
    return { ...m, total, checked, pct };
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
              <CheckSquare className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">برگه ۴: چک‌لیست کارهای روتین و مستمر (Routine Tasks)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            کارهای دوره‌ای و فرآیندی که هدف جدید نیستند، اما برای حفظ کیفیت عملکرد سازمان باید در هر ماه تیک بخورند.
          </p>
        </div>

        <button
          id="add-routine-btn"
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-lg shadow-xs transition-all ring-1 ring-indigo-500/20 self-start md:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>تعریف کار روتین جدید</span>
        </button>
      </div>

      {/* Monthly Progress Overview Summary */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
        <h3 className="text-xs font-bold text-slate-800 mb-3">پایش میزان تیک‌زنی ماه‌های سال (فروردین تا اسفند):</h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
          {monthlyCheckCounts.map((m) => (
            <div
              key={m.id}
              className={`rounded-lg p-2 text-center border transition-all ${
                m.pct >= 80
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 shadow-2xs'
                  : m.pct >= 50
                  ? 'bg-amber-50/80 border-amber-200 text-amber-900 shadow-2xs'
                  : 'bg-slate-50 border-slate-200/80 text-slate-700'
              }`}
            >
              <div className="text-[11px] font-bold">{m.name}</div>
              <div className="text-sm font-extrabold mt-1">{m.pct}٪</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{m.checked}/{m.total} تیک</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>فیلترها:</span>
          </div>

          <div className="flex items-center gap-1.5">
            <label htmlFor="routine-dept-filter-select" className="text-xs text-slate-600 font-medium">واحد مسئول:</label>
            <select
              id="routine-dept-filter-select"
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

          <div className="flex items-center gap-1.5">
            <label htmlFor="routine-freq-filter-select" className="text-xs text-slate-600 font-medium">دوره تکرار:</label>
            <select
              id="routine-freq-filter-select"
              value={selectedFreq}
              onChange={(e) => setSelectedFreq(e.target.value)}
              className="text-xs bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-colors"
            >
              <option value="all">همه دوره‌ها</option>
              <option value="daily">روزانه</option>
              <option value="weekly">هفتگی</option>
              <option value="monthly">ماهانه</option>
              <option value="quarterly">فصلی</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60">
          تعداد روتین‌ها: <strong className="text-slate-900">{filteredRoutines.length}</strong> مورد
        </div>
      </div>

      {/* Routine Checkboxes Grid Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4 min-w-[240px]">شرح کار روتین</th>
                <th className="py-3 px-3">واحد مسئول</th>
                <th className="py-3 px-3">تناوب</th>
                {/* 4 Seasonal Header Blocks for 12 months */}
                {MONTH_NAMES_PERSIAN.map((m) => (
                  <th key={m.id} className="py-3 px-2 text-center w-9 font-extrabold text-[11px]">
                    {m.name.slice(0, 3)}
                  </th>
                ))}
                <th className="py-3 px-3 text-center min-w-[100px]">نرخ تکمیل</th>
                <th className="py-3 px-3 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRoutines.map((routine) => {
                const checkedCount = Object.values(routine.monthsChecked).filter(Boolean).length;
                const pct = Math.round((checkedCount / 12) * 100);

                return (
                  <tr key={routine.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 leading-snug">{routine.title}</p>
                      {routine.assignedTo && (
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          مسئول اجرا: <span className="font-semibold text-slate-700">{routine.assignedTo}</span>
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                        {routine.department}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="text-[11px] font-medium text-slate-600">
                        {freqLabels[routine.frequency] || routine.frequency}
                      </span>
                    </td>

                    {/* 12 Interactive Checkboxes */}
                    {MONTH_NAMES_PERSIAN.map((m) => {
                      const isChecked = !!routine.monthsChecked[m.id];
                      return (
                        <td key={m.id} className="py-3 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleMonth(routine, m.id)}
                            title={`${routine.title} - ${m.name}`}
                            className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
                              isChecked
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs scale-105'
                                : 'bg-white border-slate-300 text-transparent hover:border-indigo-400 hover:bg-indigo-50'
                            }`}
                          >
                            <Check className={`w-3.5 h-3.5 stroke-[3] ${isChecked ? 'block' : 'opacity-0'}`} />
                          </button>
                        </td>
                      );
                    })}

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2 justify-center">
                        <span className="font-bold text-slate-800 text-[11px]">{pct}٪</span>
                        <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(routine)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                          title="ویرایش"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('آیا از حذف این کار روتین اطمینان دارید؟')) {
                              onDeleteRoutine(routine.id);
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

      {/* Add / Edit Routine Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 text-base">
                {editingRoutine ? 'ویرایش کار روتین' : 'تعریف کار روتین و مستمر جدید'}
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
                <label htmlFor="routine-title-input" className="block text-xs font-bold text-slate-700 mb-1">شرح کار روتین:</label>
                <input
                  id="routine-title-input"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: ارسال گزارش جامع مالی و تراز سود/زیان به هیئت مدیره"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="routine-dept-select" className="block text-xs font-bold text-slate-700 mb-1">واحد / دپارتمان مسئول:</label>
                  <select
                    id="routine-dept-select"
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

                <div>
                  <label htmlFor="routine-freq-select" className="block text-xs font-bold text-slate-700 mb-1">تناوب تکرار:</label>
                  <select
                    id="routine-freq-select"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as RoutineFrequency)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-medium"
                  >
                    <option value="monthly">ماهانه</option>
                    <option value="weekly">هفتگی</option>
                    <option value="daily">روزانه</option>
                    <option value="quarterly">فصلی</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="routine-assigned-input" className="block text-xs font-bold text-slate-700 mb-1">نام مسئول پیگیری:</label>
                <input
                  id="routine-assigned-input"
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="مثال: خانم رضایی / تیم DevOps"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-medium"
                />
              </div>

              <div>
                <label htmlFor="routine-notes-textarea" className="block text-xs font-bold text-slate-700 mb-1">یادداشت‌ها و مهلت اجرا:</label>
                <textarea
                  id="routine-notes-textarea"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مهلت تحویل تا پنجم هر ماه، دستورالعمل‌ها..."
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
                  {editingRoutine ? 'ذخیره تغییرات' : 'ثبت کار روتین'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
