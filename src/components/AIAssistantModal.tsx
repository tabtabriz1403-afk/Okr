import React, { useState } from 'react';
import { StrategicGoal, SubGoal, OKRItem, DepartmentInfo } from '../types';
import { Sparkles, Bot, ArrowRight, Check, RefreshCw, Layers } from 'lucide-react';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategicGoals: StrategicGoal[];
  departments: DepartmentInfo[];
  initialGoal?: StrategicGoal | null;
  onAddGeneratedSubGoals: (subGoals: Omit<SubGoal, 'id' | 'createdAt'>[]) => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  strategicGoals,
  departments,
  initialGoal,
  onAddGeneratedSubGoals,
}) => {
  const [selectedGoalId, setSelectedGoalId] = useState<string>(initialGoal?.id || strategicGoals[0]?.id || '');
  const [industryFocus, setIndustryFocus] = useState<string>('فناوری اطلاعات و تجارت الکترونیک');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<{ title: string; season: any; metric: string; department: string }[]>([]);

  if (!isOpen) return null;

  const currentGoal = strategicGoals.find((g) => g.id === selectedGoalId) || strategicGoals[0];

  const handleGenerate = () => {
    setIsGenerating(true);

    setTimeout(() => {
      // Intelligent contextual breakdown generator
      const goalTitle = currentGoal ? currentGoal.title : 'رشد سازمان';
      const dept = currentGoal ? currentGoal.department : 'فروش و بازاریابی';

      const suggestions = [
        {
          title: `راه‌اندازی فاز اول زیرساخت اختصاصی جهت تحقق: ${goalTitle.slice(0, 40)}`,
          season: 'spring',
          metric: '۱۰۰٪ استقرار فاز ۱',
          department: dept,
        },
        {
          title: `طراحی و اجرای کمپین یکپارچه و بهینه‌سازی کانال‌های جذب و تبدیل`,
          season: 'summer',
          metric: 'افزایش ۳۵ درصدی شاخص هدف',
          department: dept,
        },
        {
          title: `استانداردسازی فرآیندها، تدوین مستندات فنی و برگزاری دوره‌های توانمندسازی تیم`,
          season: 'autumn',
          metric: 'کاهش ۵۰ درصدی خطاهای عملیاتی',
          department: dept,
        },
        {
          title: `ارزیابی نهایی، بازنگری فصلی شاخص‌های کلیدی و آماده‌سازی گزارش جامع سالانه`,
          season: 'winter',
          metric: 'تحقق کامل تارگت‌های سال',
          department: dept,
        },
      ];

      setGeneratedItems(suggestions);
      setIsGenerating(false);
    }, 900);
  };

  const handleAcceptAll = () => {
    if (!currentGoal) return;

    const toAdd = generatedItems.map((item, idx) => ({
      code: `S${currentGoal.code}.${idx + 1}`,
      strategicGoalId: currentGoal.id,
      title: item.title,
      department: item.department,
      suggestedSeason: item.season,
      targetMetric: item.metric,
      notes: 'تولید شده توسط دستیار هوشمند OKR',
    }));

    onAddGeneratedSubGoals(toAdd);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">دستیار هوشمند شکستن اهداف به OKR و اقدامات خرد</h3>
              <p className="text-xs text-slate-500">طراحی خودکار اقدامات عملیاتی ۴ فصل بر اساس هدف کلان</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="ai-target-goal-select" className="block text-xs font-bold text-slate-700 mb-1">انتخاب هدف کلان مرجع:</label>
            <select
              id="ai-target-goal-select"
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-medium text-slate-800 transition-colors"
            >
              {strategicGoals.map((g) => (
                <option key={g.id} value={g.id}>
                  [{g.code}] {g.title} ({g.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ai-industry-input" className="block text-xs font-bold text-slate-700 mb-1">حوزه و صنعت کسب‌وکار:</label>
            <input
              id="ai-industry-input"
              type="text"
              value={industryFocus}
              onChange={(e) => setIndustryFocus(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-medium text-slate-800"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-400 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors ring-1 ring-indigo-500/20"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>در حال تحلیل و تولید اقدامات ۴ فصل...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>تولید پیشنهادهای هوشمند اهداف خرد</span>
              </>
            )}
          </button>

          {/* Results List */}
          {generatedItems.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">پیشنهادهای تولید شده برای ۴ فصل سال:</span>
                <span className="text-[11px] text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                  {generatedItems.length} اقدام عملیاتی
                </span>
              </div>

              <div className="space-y-2">
                {generatedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-indigo-50/40 border border-indigo-100/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-900 bg-white px-2 py-0.5 rounded-md border border-indigo-200 text-[11px] shadow-2xs">
                          فصل {item.season === 'spring' ? 'بهار' : item.season === 'summer' ? 'تابستان' : item.season === 'autumn' ? 'پاییز' : 'زمستان'}
                        </span>
                        <span className="text-slate-500 font-medium">واحد: {item.department}</span>
                      </div>
                      <p className="font-bold text-slate-900 leading-snug">{item.title}</p>
                      <p className="text-[11px] text-slate-600">
                        شاخص کلیدی پیشنهادی: <strong className="text-indigo-800">{item.metric}</strong>
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>افزودن همه به برگه اهداف خرد</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
