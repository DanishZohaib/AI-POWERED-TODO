import { api } from "@/lib/api-client";
import { DashboardSummary } from "@/types";

export const dashboardService = {
  /**
   * Get shared team workspace executive dashboard summary & chart metrics.
   */
  async getSummary(period: "7d" | "30d" | "90d" | "1y" | "all" = "all"): Promise<DashboardSummary> {
    return api.get<DashboardSummary>("/dashboard/summary", { period });
  },
};
