import { api } from "@/lib/api-client";
import { Category, CategoryListItem, CategoryStage } from "@/types";

export interface CategoryStagePayload {
  id?: string;
  stage_name: string;
  stage_description?: string;
  stage_order: number;
  is_required: boolean;
  is_completion_stage: boolean;
  is_active?: boolean;
}

export interface CreateCategoryPayload {
  category_code: string;
  category_name: string;
  description?: string;
  allow_stage_skipping: boolean;
  is_active?: boolean;
  stages: CategoryStagePayload[];
}

export interface UpdateCategoryPayload {
  category_name?: string;
  description?: string;
  allow_stage_skipping?: boolean;
  is_active?: boolean;
}

export const categoryService = {
  /**
   * List categories with task counts.
   */
  async listCategories(isActiveOnly: boolean = false): Promise<CategoryListItem[]> {
    return api.get<CategoryListItem[]>("/categories", { is_active_only: isActiveOnly });
  },

  /**
   * Get full category detail with workflow stages.
   */
  async getCategory(categoryId: string): Promise<Category> {
    return api.get<Category>(`/categories/${categoryId}`);
  },

  /**
   * Create a new category with stages (Admin only).
   */
  async createCategory(data: CreateCategoryPayload): Promise<Category> {
    return api.post<Category>("/categories", data);
  },

  /**
   * Update category metadata (Admin only).
   */
  async updateCategory(categoryId: string, data: UpdateCategoryPayload): Promise<Category> {
    return api.patch<Category>(`/categories/${categoryId}`, data);
  },

  /**
   * Reorder or replace workflow stages (Admin only).
   */
  async replaceStages(categoryId: string, stages: CategoryStagePayload[]): Promise<Category> {
    return api.put<Category>(`/categories/${categoryId}/stages`, { stages });
  },

  /**
   * Duplicate category with its workflow template (Admin only).
   */
  async duplicateCategory(categoryId: string): Promise<Category> {
    return api.post<Category>(`/categories/${categoryId}/duplicate`);
  },

  /**
   * Activate or deactivate a category (Admin only).
   */
  async toggleActive(categoryId: string): Promise<Category> {
    return api.post<Category>(`/categories/${categoryId}/toggle-active`);
  },
};
