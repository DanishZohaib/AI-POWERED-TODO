import { api } from "@/lib/api-client";
import { LoginRequest, LoginResponse, User, ChangePasswordRequest } from "@/types";

export const authService = {
  /**
   * Log in with User ID and Password.
   * Sets HTTP-only authentication cookie via backend response.
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return api.post<LoginResponse>("/auth/login", credentials);
  },

  /**
   * Log out and clear session cookie.
   */
  async logout(): Promise<{ message: string }> {
    return api.post<{ message: string }>("/auth/logout");
  },

  /**
   * Get current authenticated user profile.
   */
  async getMe(): Promise<User> {
    return api.get<User>("/auth/me");
  },

  async getCurrentUser(): Promise<User> {
    return this.getMe();
  },

  /**
   * Change current user password.
   */
  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    return api.post<{ message: string }>("/auth/change-password", data);
  },
};
