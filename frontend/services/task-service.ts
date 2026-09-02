import { api } from "@/lib/api-client";
import { Task, TaskListItem, TaskStatus, TaskPriority, PaginatedResponse } from "@/types";

export interface CreateTaskPayload {
  title: string;
  description?: string;
  category_id: string;
  assigned_to?: string;
  priority: TaskPriority;
  due_date?: string;
  notes?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string;
  notes?: string;
  status?: TaskStatus;
}

export interface DelegateTaskPayload {
  delegated_to: string;
  reason?: string;
}

export interface TaskFilterParams {
  search?: string;
  status?: TaskStatus;
  category_id?: string;
  assigned_to?: string;
  created_by?: string;
  priority?: TaskPriority;
  date_from?: string;
  date_to?: string;
  overdue_only?: boolean;
  view?: "all" | "my_tasks" | "created_by_me" | "assigned_to_me";
  page?: number;
  page_size?: number;
}

export const taskService = {
  /**
   * List team tasks with view scope and filters.
   * Default view="all" returns all team tasks (shared workspace).
   */
  async listTasks(params?: TaskFilterParams): Promise<PaginatedResponse<TaskListItem>> {
    return api.get<PaginatedResponse<TaskListItem>>(
      "/tasks",
      params as unknown as Record<string, string | number | boolean | undefined>
    );
  },

  /**
   * Get full details of a single task including copied workflow stages and delegation history.
   */
  async getTask(taskId: string): Promise<Task> {
    return api.get<Task>(`/tasks/${taskId}`);
  },

  /**
   * Create a new task with category stage copies.
   */
  async createTask(data: CreateTaskPayload): Promise<Task> {
    return api.post<Task>("/tasks", data);
  },

  /**
   * Update task metadata.
   */
  async updateTask(taskId: string, data: UpdateTaskPayload): Promise<Task> {
    return api.patch<Task>(`/tasks/${taskId}`, data);
  },

  /**
   * Delegate task to another team member while preserving delegation history.
   */
  async delegateTask(taskId: string, data: DelegateTaskPayload): Promise<Task> {
    return api.post<Task>(`/tasks/${taskId}/delegate`, data);
  },

  /**
   * Delete a task (Creator or Power Admin only).
   */
  async deleteTask(taskId: string): Promise<{ message: string }> {
    return api.del<{ message: string }>(`/tasks/${taskId}`);
  },
};
