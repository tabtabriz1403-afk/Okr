export type SeasonKey = 'spring' | 'summer' | 'autumn' | 'winter';
export type OKRStatus = 'not_started' | 'in_progress' | 'completed' | 'behind';
export type ManagerEval = 'ahead' | 'on_track' | 'behind' | 'none';
export type RoutineFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface StrategicGoal {
  id: string;
  code: string; // e.g. G1, G2
  title: string;
  department: string;
  weight: number; // 1 - 100
  year: number; // 1404 / 2026
  description?: string;
  createdAt: string;
}

export interface SubGoal {
  id: string;
  strategicGoalId: string;
  code: string; // e.g. SG1.1
  title: string;
  department: string;
  suggestedSeason: SeasonKey | 'all_year';
  targetMetric?: string;
  notes?: string;
  createdAt: string;
}

export interface OKRItem {
  id: string;
  subGoalId: string;
  quarter: SeasonKey;
  keyResultTitle: string; // e.g. جذب ۵۰ مشتری سازمانی جدید
  targetValue: string; // e.g. 50
  currentValue: string; // e.g. 35
  unit: string; // e.g. مشتری, درصد, میلیارد تومان
  month1Progress: number; // 0 - 100
  month2Progress: number; // 0 - 100
  month3Progress: number; // 0 - 100
  status: OKRStatus;
  managerEvaluation: ManagerEval;
  obstaclesComment?: string;
  actionPlan?: string;
  updatedAt: string;
}

export interface RoutineTask {
  id: string;
  title: string;
  department: string;
  frequency: RoutineFrequency;
  quarterTarget: SeasonKey | 'all_year';
  // 1 to 12 representing Farvardin (1) to Esfand (12)
  monthsChecked: Record<number, boolean>;
  assignedTo?: string;
  notes?: string;
}

export type GroupSyncStatus = 'synced' | 'pending' | 'error' | 'not_configured';

export interface DepartmentInfo {
  id: string;
  name: string;
  code: string; // e.g. G01, G02
  color: string;
  managerName: string;
  roleTitle?: string;
  description?: string;
  sheetUrl?: string;
  sheetId?: string;
  lastSyncTime?: string;
  syncStatus: GroupSyncStatus;
  errorMessage?: string;
}

export interface GroupSummaryMetric {
  groupId: string;
  groupName: string;
  managerName: string;
  color: string;
  totalStrategic: number;
  totalSubGoals: number;
  totalOkrs: number;
  completedOkrs: number;
  inProgressOkrs: number;
  behindOkrs: number;
  remainingOkrs: number;
  avgProgress: number;
  totalRoutines: number;
  routinesCompletionRate: number;
  syncStatus: GroupSyncStatus;
  lastSyncTime?: string;
  sheetUrl?: string;
  rank: number;
}

export const MONTH_NAMES_PERSIAN: { id: number; name: string; season: SeasonKey }[] = [
  { id: 1, name: 'فروردین', season: 'spring' },
  { id: 2, name: 'اردیبهشت', season: 'spring' },
  { id: 3, name: 'خرداد', season: 'spring' },
  { id: 4, name: 'تیر', season: 'summer' },
  { id: 5, name: 'مرداد', season: 'summer' },
  { id: 6, name: 'شهریور', season: 'summer' },
  { id: 7, name: 'مهر', season: 'autumn' },
  { id: 8, name: 'آبان', season: 'autumn' },
  { id: 9, name: 'آذر', season: 'autumn' },
  { id: 10, name: 'دی', season: 'winter' },
  { id: 11, name: 'بهمن', season: 'winter' },
  { id: 12, name: 'اسفند', season: 'winter' },
];

export const SEASONS_CONFIG: Record<SeasonKey, { name: string; months: string[]; monthIndices: number[]; color: string; bg: string }> = {
  spring: {
    name: 'بهار (فصل ۱)',
    months: ['فروردین', 'اردیبهشت', 'خرداد'],
    monthIndices: [1, 2, 3],
    color: 'emerald',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  summer: {
    name: 'تابستان (فصل ۲)',
    months: ['تیر', 'مرداد', 'شهریور'],
    monthIndices: [4, 5, 6],
    color: 'amber',
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  autumn: {
    name: 'پاییز (فصل ۳)',
    months: ['مهر', 'آبان', 'آذر'],
    monthIndices: [7, 8, 9],
    color: 'orange',
    bg: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  winter: {
    name: 'زمستان (فصل ۴)',
    months: ['دی', 'بهمن', 'اسفند'],
    monthIndices: [10, 11, 12],
    color: 'indigo',
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
};
