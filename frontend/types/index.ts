/**
 * Core TypeScript type definitions for the application.
 * These mirror the backend Pydantic schemas and database models.
 */

// ─── Enums ───

export type UserRole = "POWER_ADMIN" | "STANDARD_USER";

export type TaskStatus =
  | "NEW"
  | "IN_PROGRESS"
  | "PENDING"
  | "COMPLETED"
  | "OVERDUE"
  | "CANCELLED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type NotificationType =
  | "TASK_DELEGATED"
  | "TASK_DUE_SOON"
  | "TASK_OVERDUE"
  | "TASK_COMPLETED"
  | "STAGE_COMPLETED"
  | "PASSWORD_EXPIRY_WARNING"
  | "PASSWORD_EXPIRED";

// ─── Team ───

export interface Team {
  id: string;
  team_code: string;
  team_name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── User ───

export interface User {
  id: string;
  user_code: string;
  full_name: string;
  department: string | null;
  designation: string | null;
  role: UserRole;
  team_id: string;
  team_name?: string | null;
  team_code?: string | null;
  is_active: boolean;
  password_expiry_days: number;
  password_expires_at: string;
  must_change_password: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserListItem {
  id: string;
  user_code: string;
  full_name: string;
  department: string | null;
  designation: string | null;
  role: UserRole;
  is_active: boolean;
  password_expires_at: string;
  days_until_expiry: number;
  last_login_at: string | null;
  created_at: string;
}

// ─── Category ───

export interface Category {
  id: string;
  category_code: string;
  category_name: string;
  description: string | null;
  allow_stage_skipping: boolean;
  is_active: boolean;
  created_by: string;
  creator_name: string;
  stages: CategoryStage[];
  active_tasks_count: number;
  completed_tasks_count: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryStage {
  id: string;
  category_id: string;
  stage_name: string;
  stage_description: string | null;
  stage_order: number;
  is_required: boolean;
  is_completion_stage: boolean;
  is_active: boolean;
}

export interface CategoryListItem {
  id: string;
  category_code: string;
  category_name: string;
  description: string | null;
  allow_stage_skipping: boolean;
  is_active: boolean;
  creator_name: string;
  total_stages: number;
  stages_count: number;
  active_tasks_count: number;
  completed_tasks_count: number;
  created_at: string;
}



// ─── Task ───

export interface Task {
  id: string;
  task_number: string;
  title: string;
  description: string | null;
  category_id: string;
  category_name: string;
  category_code: string;
  team_id: string;
  created_by: string;
  creator_name: string;
  assigned_to: string;
  assignee_name: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress_percentage: number;
  due_date: string | null;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  stages: TaskStage[];
  delegations: TaskDelegation[];
  can_edit?: boolean;
  can_delegate?: boolean;
  can_delete?: boolean;
  can_process_stages?: boolean;
  can_complete_stages?: boolean;
}

export interface TaskListItem {
  id: string;
  task_number: string;
  title: string;
  category_name: string;
  category_code: string;
  creator_name: string;
  assignee_name: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress_percentage: number;
  due_date: string | null;
  current_stage: string | null;
  total_stages: number;
  completed_stages: number;
  created_at: string;
}

export interface TaskStage {
  id: string;
  task_id: string;
  stage_name: string;
  stage_order: number;
  is_required: boolean;
  is_completion_stage: boolean;
  is_completed: boolean;
  completed_by: string | null;
  completer_name: string | null;
  completed_at: string | null;
  comments: string | null;
}

export interface TaskDelegation {
  id: string;
  task_id: string;
  delegated_by: string;
  delegator_name: string;
  previous_assignee: string | null;
  previous_assignee_name: string | null;
  delegated_to: string;
  new_assignee_name: string;
  delegated_at: string;
  reason: string | null;
}

// ─── Dashboard ───

export interface StatusDistributionItem {
  status: TaskStatus;
  label: string;
  count: number;
  color: string;
}

export interface PriorityDistributionItem {
  priority: TaskPriority;
  label: string;
  count: number;
  color: string;
}

export interface AuditActivityItem {
  id: string;
  action_type: string;
  user_name: string;
  description: string;
  timestamp: string;
}

export interface DashboardSummary {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  delegated_tasks: number;
  completion_percentage: number;
  completion_rate: number;
  tasks_created_today: number;
  new_tasks: number;
  cancelled_tasks: number;
  status_distribution?: StatusDistributionItem[];
  priority_distribution?: PriorityDistributionItem[];
  category_performance?: CategoryPerformance[];
  category_statistics?: CategoryPerformance[];
  recent_audit_logs?: AuditLog[];
  recent_activities?: AuditActivityItem[];
}

export interface DashboardTrend {
  date: string;
  completed: number;
  created: number;
}

export interface CategoryPerformance {
  category_name: string;
  category_code: string;
  total?: number;
  total_tasks?: number;
  completed?: number;
  completed_tasks?: number;
  in_progress?: number;
  pending?: number;
  pending_tasks?: number;
  overdue?: number;
}

export interface UserPerformance {
  user_code: string;
  full_name: string;
  assigned: number;
  completed: number;
  pending: number;
  completion_percentage: number;
}

// ─── Dashboard Period ───

export type DashboardPeriod =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "half_yearly"
  | "annual";

// ─── Notification ───

export interface Notification {
  id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

// ─── Audit Log ───

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action_type: string;
  entity_type: string | null;
  entity_id: string | null;
  old_value: string | null;
  new_value: string | null;
  timestamp: string;
  ip_address: string | null;
}

// ─── API Response Wrappers ───

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: true;
  error_code: string;
  message: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ─── Auth ───

export interface LoginRequest {
  user_code: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  password_expired: boolean;
  must_change_password: boolean;
  days_until_expiry: number;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// ─── Task Filters ───

export interface TaskFilters {
  search?: string;
  status?: TaskStatus;
  category_id?: string;
  assigned_to?: string;
  created_by?: string;
  priority?: TaskPriority;
  date_from?: string;
  date_to?: string;
  overdue?: boolean;
  view?: "all" | "my_tasks" | "created_by_me" | "assigned_to_me";
  page?: number;
  page_size?: number;
}
