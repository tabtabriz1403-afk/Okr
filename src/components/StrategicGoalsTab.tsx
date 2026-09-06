import React, { useState } from 'react';
import { StrategicGoal, SubGoal, OKRItem, DepartmentInfo } from '../types';
import { Plus, Edit2, Trash2, Target, Sparkles, Layers, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface StrategicGoalsTabProps {
  strategicGoals: StrategicGoal[];
  subGoals: SubGoal[];
  okrs: OKRItem[];
  departments: DepartmentInfo[];
  currentYear: number;
  onAddGoal: (goal: Omit<StrategicGoal, 'id' | 'createdAt'>) => void;
  onUpdateGoal: (goal: StrategicGoal) => void;
  onDeleteGoal: (id: string) => void;
  onOpenAIModalWithGoal?: (goal: StrategicGoal) => void;
  onNavigateToSubGoalsWithFilter?: (strategicId: string) => void;
}

export const StrategicGoalsTab: React.FC<StrategicGoalsTabProps> = ({
  strategicGoals,
  subGoals,
  okrs,
  departments,
  currentYear,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onOpenAIModalWithGoal,
  onNavigateToSubGoalsWithFilter,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<StrategicGoal | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState(departments[0]?.name || 'فروش و بازاریابی');
  const [weight, setWeight] = useState(25);
  const [description, setDescription] = useState('');

  const handleOpenAdd = () => {
    setEditingGoal(null);
    setCode(`G${strategicGoals.length + 1}`);
    setTitle('');
    setDepartment(departments[0]?.name || 'فروش و بازاریابی');
    setWeight(25);
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (goal: StrategicGoal) => {
    setEditingGoal(goal);
    setCode(goal.code);
    setTitle(goal.title);
    setDepartment(goal.department);
    setWeight(goal.weight);
    setDescription(goal.description || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingGoal) {
      onUpdateGoal({
        ...editingGoal,
        code,
        title,
        department,
        weight: Number(weight),
        description,
      });
    } else {
      onAddGoal({
        code: code || `G${strategicGoals.length + 1}`,
        title,
        department,
        weight: Number(weight),
        year: currentYear,
        description,
      });
    }
    setIsModalOpen(false);
  };

  const totalWeight = strategicGoals.reduce((sum, g) => sum + g.weight, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
              <Target className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">برگه ۱: اهداف کلان و استراتژیک (Strategic Goals)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            در این بخش، به عنوان مدیر مسیر کلی سازمان در سال {currentYear} را مشخص کنید تا واحدها آن را به اهداف خرد تبدیل کنند.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold">
            مجموع وزن اهداف: <span className={totalWeight === 100 ? 'text-emerald-600 font-extrabold' : 'text-amber-600 font-extrabold'}>{totalWeight} از ۱۰۰</span>
          </div>

          <button
            id="add-strategic-goal-btn"
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-lg shadow-xs transition-all ring-1 ring-indigo-500/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>تعریف هدف کلان جدید</span>
          </button>
        </div>
      </div>

      {/* Strategic Goals Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {strategicGoals.map((goal) => {
          const linkedSubGoals = subGoals.filter((s) => s.strategicGoalId === goal.id);
          const subGoalIds = linkedSubGoals.map((s) => s.id);
          const linkedOkrs = okrs.filter((o) => subGoalIds.includes(o.subGoalId));
          const completedOkrs = linkedOkrs.filter((o) => o.status === 'completed').length;
          const avgProgress =
            linkedOkrs.length > 0
              ? Math.round(
                  linkedOkrs.reduce(
                    (acc, cur) => acc + (cur.month1Progress + cur.month2Progress + cur.month3Progress) / 3,
                    0
                  ) / linkedOkrs.length
                )
              : 0;

          return (
            <div
              key={goal.id}
              className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-black rounded-md border border-indigo-200/60">
                      {goal.code}
                    </span>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold border border-slate-200/50">
                      {goal.department}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400">
                    {onOpenAIModalWithGoal && (
                      <button
                        type="button"
                        onClick={() => onOpenAIModalWithGoal(goal)}
                        title="شکستن به اهداف خرد با هوش مصنوعی"
                        className="p-1 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(goal)}
                      title="ویرایش"
                      className="p-1 hover:text-indigo-600 hover:bg-slate-50 rounded-md transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('آیا از حذف این هدف کلان اطمینان دارید؟')) {
                          onDeleteGoal(goal.id);
                        }
                      }}
                      title="حذف"
                      className="p-1 hover:text-rose-600 hover:bg-slate-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-base mt-3 leading-snug">{goal.title}</h3>

                {goal.description && (
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed font-normal">{goal.description}</p>
                )}

                {/* Progress bar and metrics */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>پیشرفت تحقق استراتژی:</span>
                    <span className="font-extrabold text-slate-900">{avgProgress}٪</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${avgProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom stats and action */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    {linkedSubGoals.length} هدف خرد
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    {completedOkrs} OKR محقق شده
                  </span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-700 border border-slate-200/60">
                    وزن: {goal.weight}٪
                  </span>
                </div>

                {onNavigateToSubGoalsWithFilter && (
                  <button
                    type="button"
                    onClick={() => onNavigateToSubGoalsWithFilter(goal.id)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <span>مشاهده اهداف خرد</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 text-base">
                {editingGoal ? 'ویرایش هدف کلان' : 'تعریف هدف کلان استراتژیک جدید'}
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
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="goal-code-input" className="block text-xs font-bold text-slate-700 mb-1">کد هدف:</label>
                  <input
                    id="goal-code-input"
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="G1"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-bold"
                  />
                </div>

                <div className="col-span-2">
                  <label htmlFor="goal-dept-select" className="block text-xs font-bold text-slate-700 mb-1">واحد / دپارتمان مسئول:</label>
                  <select
                    id="goal-dept-select"
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
                <label htmlFor="goal-title-input" className="block text-xs font-bold text-slate-700 mb-1">عنوان هدف کلان:</label>
                <input
                  id="goal-title-input"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: رشد درآمد سالانه و افزایش سهم بازار تا ۴۵٪"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-medium"
                />
              </div>

              <div>
                <label htmlFor="goal-weight-range" className="block text-xs font-bold text-slate-700 mb-1">
                  وزن هدف (اهمیت از ۱ تا ۱۰۰): <span className="text-indigo-600 font-extrabold">{weight}٪</span>
                </label>
                <input
                  id="goal-weight-range"
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <label htmlFor="goal-desc-textarea" className="block text-xs font-bold text-slate-700 mb-1">شرح و توضیحات استراتژی:</label>
                <textarea
                  id="goal-desc-textarea"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="جزییات، اقدامات راهبردی یا الزامات..."
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
                  {editingGoal ? 'ذخیره تغییرات' : 'ثبت هدف کلان'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
