import React, { useState, useEffect } from 'react';
import {
  StrategicGoal,
  SubGoal,
  OKRItem,
  RoutineTask,
  DepartmentInfo,
  SeasonKey,
} from './types';
import {
  INITIAL_STRATEGIC_GOALS,
  INITIAL_SUB_GOALS,
  INITIAL_OKRS,
  INITIAL_ROUTINES,
  INITIAL_DEPARTMENTS,
} from './data/sampleData';
import { Header } from './components/Header';
import { DashboardTab } from './components/DashboardTab';
import { StrategicGoalsTab } from './components/StrategicGoalsTab';
import { SubGoalsTab } from './components/SubGoalsTab';
import { OKRTrackingTab } from './components/OKRTrackingTab';
import { RoutinesTab } from './components/RoutinesTab';
import { MultiGroupHubTab } from './components/MultiGroupHubTab';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { exportToExcel } from './utils/excelExport';
import { CheckCircle2, Download } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('multigroups');
  const [currentYear, setCurrentYear] = useState<number>(1404);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiTargetGoal, setAiTargetGoal] = useState<StrategicGoal | null>(null);
  const [subGoalStrategicFilter, setSubGoalStrategicFilter] = useState<string | null>(null);

  // Main Data States with LocalStorage
  const [strategicGoals, setStrategicGoals] = useState<StrategicGoal[]>(() => {
    const saved = localStorage.getItem('app_strategic_goals');
    return saved ? JSON.parse(saved) : INITIAL_STRATEGIC_GOALS;
  });

  const [subGoals, setSubGoals] = useState<SubGoal[]>(() => {
    const saved = localStorage.getItem('app_sub_goals');
    return saved ? JSON.parse(saved) : INITIAL_SUB_GOALS;
  });

  const [okrs, setOkrs] = useState<OKRItem[]>(() => {
    const saved = localStorage.getItem('app_okrs');
    return saved ? JSON.parse(saved) : INITIAL_OKRS;
  });

  const [routines, setRoutines] = useState<RoutineTask[]>(() => {
    const saved = localStorage.getItem('app_routines');
    return saved ? JSON.parse(saved) : INITIAL_ROUTINES;
  });

  const [departments, setDepartments] = useState<DepartmentInfo[]>(() => {
    const saved = localStorage.getItem('app_departments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 11) {
          return parsed;
        }
      } catch {}
    }
    return INITIAL_DEPARTMENTS;
  });

  // Persist to local storage
  useEffect(() => {
    localStorage.setItem('app_strategic_goals', JSON.stringify(strategicGoals));
  }, [strategicGoals]);

  useEffect(() => {
    localStorage.setItem('app_sub_goals', JSON.stringify(subGoals));
  }, [subGoals]);

  useEffect(() => {
    localStorage.setItem('app_okrs', JSON.stringify(okrs));
  }, [okrs]);

  useEffect(() => {
    localStorage.setItem('app_routines', JSON.stringify(routines));
  }, [routines]);

  useEffect(() => {
    localStorage.setItem('app_departments', JSON.stringify(departments));
  }, [departments]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Strategic Goals CRUD
  const handleAddStrategicGoal = (goal: Omit<StrategicGoal, 'id' | 'createdAt'>) => {
    const newGoal: StrategicGoal = {
      ...goal,
      id: `sg-${Date.now()}`,
      createdAt: `${currentYear}/01/01`,
    };
    setStrategicGoals((prev) => [...prev, newGoal]);
    showToast(`هدف کلان [${newGoal.code}] با موفقیت ثبت شد.`);
  };

  const handleUpdateStrategicGoal = (goal: StrategicGoal) => {
    setStrategicGoals((prev) => prev.map((g) => (g.id === goal.id ? goal : g)));
    showToast(`هدف کلان [${goal.code}] به‌روزرسانی شد.`);
  };

  const handleDeleteStrategicGoal = (id: string) => {
    setStrategicGoals((prev) => prev.filter((g) => g.id !== id));
    showToast('هدف کلان حذف گردید.');
  };

  // SubGoals CRUD
  const handleAddSubGoal = (subGoal: Omit<SubGoal, 'id' | 'createdAt'>) => {
    const newSub: SubGoal = {
      ...subGoal,
      id: `sub-${Date.now()}`,
      createdAt: `${currentYear}/01/01`,
    };
    setSubGoals((prev) => [...prev, newSub]);
    showToast(`هدف خرد [${newSub.code}] ثبت شد.`);
  };

  const handleUpdateSubGoal = (subGoal: SubGoal) => {
    setSubGoals((prev) => prev.map((s) => (s.id === subGoal.id ? subGoal : s)));
    showToast(`هدف خرد [${subGoal.code}] به‌روزرسانی شد.`);
  };

  const handleDeleteSubGoal = (id: string) => {
    setSubGoals((prev) => prev.filter((s) => s.id !== id));
    showToast('هدف خرد حذف گردید.');
  };

  const handlePromoteToOKR = (subGoal: SubGoal, season: SeasonKey) => {
    const newOKR: OKRItem = {
      id: `okr-${Date.now()}`,
      subGoalId: subGoal.id,
      quarter: season,
      keyResultTitle: subGoal.title,
      targetValue: '100',
      currentValue: '0',
      unit: 'درصد',
      month1Progress: 0,
      month2Progress: 0,
      month3Progress: 0,
      status: 'in_progress',
      managerEvaluation: 'on_track',
      updatedAt: `${currentYear}/01/01`,
    };
    setOkrs((prev) => [...prev, newOKR]);
    setActiveTab('okr');
    showToast(`اقدام «${subGoal.title}» به عنوان OKR فصلی اضافه شد.`);
  };

  // OKR CRUD
  const handleAddOKR = (okr: Omit<OKRItem, 'id' | 'updatedAt'>) => {
    const newOKR: OKRItem = {
      ...okr,
      id: `okr-${Date.now()}`,
      updatedAt: `${currentYear}/01/01`,
    };
    setOkrs((prev) => [...prev, newOKR]);
    showToast('نتیجه کلیدی OKR با موفقیت ثبت شد.');
  };

  const handleUpdateOKR = (okr: OKRItem) => {
    setOkrs((prev) => prev.map((o) => (o.id === okr.id ? okr : o)));
  };

  const handleDeleteOKR = (id: string) => {
    setOkrs((prev) => prev.filter((o) => o.id !== id));
    showToast('OKR حذف گردید.');
  };

  // Routines CRUD
  const handleAddRoutine = (routine: Omit<RoutineTask, 'id'>) => {
    const newRoutine: RoutineTask = {
      ...routine,
      id: `rt-${Date.now()}`,
    };
    setRoutines((prev) => [...prev, newRoutine]);
    showToast('کار روتین جدید به چک‌لیست اضافه شد.');
  };

  const handleUpdateRoutine = (routine: RoutineTask) => {
    setRoutines((prev) => prev.map((r) => (r.id === routine.id ? routine : r)));
  };

  const handleDeleteRoutine = (id: string) => {
    setRoutines((prev) => prev.filter((r) => r.id !== id));
    showToast('کار روتین حذف شد.');
  };

  // Reset to initial sample data
  const handleResetData = () => {
    if (confirm('آیا می‌خواهید تمام اطلاعات را به داده‌های نمونه اولیه بازگردانید؟')) {
      setStrategicGoals(INITIAL_STRATEGIC_GOALS);
      setSubGoals(INITIAL_SUB_GOALS);
      setOkrs(INITIAL_OKRS);
      setRoutines(INITIAL_ROUTINES);
      setDepartments(INITIAL_DEPARTMENTS);
      showToast('داده‌های نمونه مجدداً بارگذاری شدند.');
    }
  };

  // Import data for specific group from Google Sheets
  const handleImportGroupData = (
    groupId: string,
    newStrategic: StrategicGoal[],
    newSubGoals: SubGoal[],
    newOkrs: OKRItem[]
  ) => {
    if (newStrategic.length > 0) {
      setStrategicGoals((prev) => [...prev, ...newStrategic]);
    }
    if (newSubGoals.length > 0) {
      setSubGoals((prev) => [...prev, ...newSubGoals]);
    }
    if (newOkrs.length > 0) {
      setOkrs((prev) => [...prev, ...newOkrs]);
    }
    showToast(`اطلاعات جدید برای این گروه با موفقیت بارگذاری شد.`);
  };

  // Excel Export
  const handleExportExcel = () => {
    exportToExcel(strategicGoals, subGoals, okrs, routines);
    showToast('فایل اکسل (.xlsx) با ۵ برگه و فرمول‌های خودکار دانلود شد.');
  };

  // Calculate Overall Stats
  const completedOkrs = okrs.filter((o) => o.status === 'completed').length;
  const remainingOkrs = okrs.length - completedOkrs;
  const overallProgress =
    okrs.length > 0
      ? Math.round(
          okrs.reduce(
            (acc, cur) => acc + (cur.month1Progress + cur.month2Progress + cur.month3Progress) / 3,
            0
          ) / okrs.length
        )
      : 0;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 pb-16 flex flex-col justify-between">
      <div>
        {/* Navigation & Top Controls */}
        <Header
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setSubGoalStrategicFilter(null);
          }}
          onExportExcel={handleExportExcel}
          onOpenGoogleSheetsGuide={() => setIsGuideOpen(true)}
          onOpenAIModal={() => {
            setAiTargetGoal(null);
            setIsAIOpen(true);
          }}
          onResetData={handleResetData}
          currentYear={currentYear}
          setCurrentYear={setCurrentYear}
          stats={{
            totalStrategic: strategicGoals.length,
            totalSub: subGoals.length,
            totalOkrs: okrs.length,
            completedOkrs,
            remainingOkrs,
            overallProgress,
          }}
        />

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          {activeTab === 'multigroups' && (
            <MultiGroupHubTab
              departments={departments}
              onUpdateDepartments={setDepartments}
              strategicGoals={strategicGoals}
              subGoals={subGoals}
              okrs={okrs}
              routines={routines}
              onImportGroupData={handleImportGroupData}
              currentYear={currentYear}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardTab
              strategicGoals={strategicGoals}
              subGoals={subGoals}
              okrs={okrs}
              routines={routines}
              onNavigateToTab={setActiveTab}
              onOpenGoogleSheets={() => setIsGuideOpen(true)}
            />
          )}

          {activeTab === 'strategic' && (
            <StrategicGoalsTab
              strategicGoals={strategicGoals}
              subGoals={subGoals}
              okrs={okrs}
              departments={departments}
              currentYear={currentYear}
              onAddGoal={handleAddStrategicGoal}
              onUpdateGoal={handleUpdateStrategicGoal}
              onDeleteGoal={handleDeleteStrategicGoal}
              onOpenAIModalWithGoal={(goal) => {
                setAiTargetGoal(goal);
                setIsAIOpen(true);
              }}
              onNavigateToSubGoalsWithFilter={(id) => {
                setSubGoalStrategicFilter(id);
                setActiveTab('subgoals');
              }}
            />
          )}

          {activeTab === 'subgoals' && (
            <SubGoalsTab
              strategicGoals={strategicGoals}
              subGoals={subGoals}
              okrs={okrs}
              departments={departments}
              selectedStrategicFilter={subGoalStrategicFilter}
              onClearStrategicFilter={() => setSubGoalStrategicFilter(null)}
              onAddSubGoal={handleAddSubGoal}
              onUpdateSubGoal={handleUpdateSubGoal}
              onDeleteSubGoal={handleDeleteSubGoal}
              onPromoteToOKR={handlePromoteToOKR}
            />
          )}

          {activeTab === 'okr' && (
            <OKRTrackingTab
              okrs={okrs}
              subGoals={subGoals}
              strategicGoals={strategicGoals}
              onAddOKR={handleAddOKR}
              onUpdateOKR={handleUpdateOKR}
              onDeleteOKR={handleDeleteOKR}
            />
          )}

          {activeTab === 'routines' && (
            <RoutinesTab
              routines={routines}
              departments={departments}
              onAddRoutine={handleAddRoutine}
              onUpdateRoutine={handleUpdateRoutine}
              onDeleteRoutine={handleDeleteRoutine}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 text-center text-xs text-slate-500">
        <div className="flex flex-wrap items-center justify-center gap-4 border-t border-slate-200/80 pt-6">
          <span>سامانه جامع برنامه‌ریزی سالانه و داشبورد پایش OKR</span>
          <span>•</span>
          <span>پشتیبانی کامل از فرمول‌های محاسباتی اکسل و گوگل شیت</span>
          <span>•</span>
          <button
            type="button"
            onClick={handleExportExcel}
            className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>دانلود آنی اکسل (.xlsx)</span>
          </button>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Google Sheets Sync & Creation Modal */}
      <GoogleSheetsSyncModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        strategicGoals={strategicGoals}
        subGoals={subGoals}
        okrs={okrs}
        routines={routines}
        currentYear={currentYear}
      />

      {/* AI Assistant Modal */}
      <AIAssistantModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        strategicGoals={strategicGoals}
        departments={departments}
        initialGoal={aiTargetGoal}
        onAddGeneratedSubGoals={(newSubs) => {
          newSubs.forEach((sg) => handleAddSubGoal(sg));
          setActiveTab('subgoals');
          showToast(`${newSubs.length} هدف خرد جدید اضافه شد.`);
        }}
      />
    </div>
  );
}
