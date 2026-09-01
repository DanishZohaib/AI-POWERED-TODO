import { api } from "@/lib/api-client";
import { User, UserListItem, PaginatedResponse } from "@/types";

export interface CreateUserPayload {
  user_code: string;
  full_name: string;
  department?: string;
  designation?: string;
  role: "POWER_ADMIN" | "STANDARD_USER";
  temporary_password: string;
  password_expiry_days: number;
  must_change_password?: boolean;
  is_active?: boolean;
}

export interface UpdateUserPayload {
  full_name?: string;
  department?: string;
  designation?: string;
  role?: "POWER_ADMIN" | "STANDARD_USER";
  password_expiry_days?: number;
}

export interface UserFilterParams {
  search?: string;
  role?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

export const userService = {
  /**
   * List users with optional search, role, status filters, and pagination.
   */
  async listUsers(params?: UserFilterParams): Promise<PaginatedResponse<UserListItem>> {
    return api.get<PaginatedResponse<UserListItem>>("/users", params as any);
  },

  /**
   * Create a new user (Admin only).
   */
  async createUser(data: CreateUserPayload): Promise<User> {
    return api.post<User>("/users", data);
  },

  /**
   * Update an existing user's details (Admin only).
   */
  async updateUser(userId: string, data: UpdateUserPayload): Promise<User> {
    return api.patch<User>(`/users/${userId}`, data);
  },

  /**
   * Activate or deactivate a user account (Admin only).
   */
  async toggleActive(userId: string): Promise<User> {
    return api.post<User>(`/users/${userId}/toggle-active`);
  },

  /**
   * Reset user password and set force change flag (Admin only).
   */
  async resetPassword(userId: string, newTemporaryPassword: string): Promise<User> {
    return api.post<User>(`/users/${userId}/reset-password`, {
      new_temporary_password: newTemporaryPassword,
      must_change_password: true,
    });
  },

  /**
   * Extend password validity period by N days (Admin only).
   */
  async extendPasswordExpiry(userId: string, additionalDays: number): Promise<User> {
    return api.post<User>(`/users/${userId}/extend-password-expiry`, {
      additional_days: additionalDays,
    });
  },
};
