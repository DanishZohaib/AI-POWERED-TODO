/**
 * Application-wide constants.
 */

// ─── Task Status Config ───
export const TASK_STATUS_CONFIG = {
  NEW: { label: "New", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: "circle" },
  IN_PROGRESS: { label: "In Progress", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: "loader" },
  PENDING: { label: "Pending", color: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400", icon: "pause-circle" },
  COMPLETED: { label: "Completed", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: "check-circle" },
  OVERDUE: { label: "Overdue", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: "alert-circle" },
  CANCELLED: { label: "Cancelled", color: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800/30 dark:text-zinc-400", icon: "x-circle" },
} as const;

// ─── Task Priority Config ───
export const TASK_PRIORITY_CONFIG = {
  LOW: { label: "Low", color: "bg-slate-100 text-slate-700 dark:bg-slate-800/30 dark:text-slate-400", order: 1 },
  MEDIUM: { label: "Medium", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", order: 2 },
  HIGH: { label: "High", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", order: 3 },
  CRITICAL: { label: "Critical", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", order: 4 },
} as const;

// ─── Dashboard Periods ───
export const DASHBOARD_PERIODS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "half_yearly", label: "Half-Year" },
  { value: "annual", label: "Annual" },
] as const;

// ─── User Roles ───
export const USER_ROLES = {
  POWER_ADMIN: { label: "Power Admin", description: "Full system control" },
  STANDARD_USER: { label: "Standard User", description: "Task management" },
} as const;

// ─── Password Policy ───
export const PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
} as const;

// ─── Password Expiry Days Options ───
export const PASSWORD_EXPIRY_OPTIONS = [15, 30, 45, 60, 90] as const;

// ─── Pagination ───
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

// ─── Chart Colors ───
export const CHART_COLORS = {
  primary: "hsl(217, 91%, 60%)",       // Blue
  success: "hsl(142, 76%, 36%)",       // Green
  warning: "hsl(38, 92%, 50%)",        // Amber
  danger: "hsl(0, 84%, 60%)",          // Red
  muted: "hsl(215, 14%, 55%)",         // Gray
  info: "hsl(199, 89%, 48%)",          // Cyan
  purple: "hsl(271, 91%, 65%)",        // Purple
  accent: "hsl(47, 96%, 53%)",         // Gold
} as const;
