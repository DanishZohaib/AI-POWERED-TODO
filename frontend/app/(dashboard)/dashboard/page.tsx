"use client";

import React, { useState, useEffect, useCallback } from "react";
import { dashboardService } from "@/services/dashboard-service";
import { reportService } from "@/services/report-service";
import { DashboardSummary } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/utils";
import {
  PieChart as PieIcon,
  BarChart3,
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Activity,
  RefreshCw,
  Loader2,
  Calendar,
  User,
  ShieldCheck,
  Layers,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  NEW: "#3b82f6",
  IN_PROGRESS: "#a855f7",
  PENDING: "#f59e0b",
  COMPLETED: "#10b981",
  OVERDUE: "#ef4444",
  CANCELLED: "#64748b",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "1y" | "all">("all");

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const summary = await dashboardService.getSummary(period);
      setData(summary);
    } catch (err: any) {
      console.error("Failed to load dashboard summary:", err);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await reportService.downloadExcelReport();
    } catch (err: any) {
      alert(err.message || "Failed to download Excel report.");
    } finally {
      setIsExporting(false);
    }
  };

  const chartStatusData =
    data?.status_distribution?.filter((s) => s.count > 0).map((s) => ({
      name: s.label,
      value: s.count,
      color: STATUS_COLORS[s.status] || "#3b82f6",
    })) || [];

  const chartCategoryData =
    (data?.category_statistics || data?.category_performance)?.map((c) => ({
      name: c.category_code,
      fullName: c.category_name,
      Total: c.total_tasks ?? c.total ?? 0,
      Completed: c.completed_tasks ?? c.completed ?? 0,
      Pending: c.pending_tasks ?? c.pending ?? 0,
    })) || [];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 mb-1">
            <Activity className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Shared Team Intelligence</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Corporate Executive Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Real-time KPIs, workflow distribution, category statistics, and live team audit stream.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Period Filter Tabs */}
          <div className="hidden md:flex items-center bg-slate-900/80 border border-slate-800 rounded-lg p-1 space-x-1">
            {[
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "90d", label: "90 Days" },
              { id: "1y", label: "1 Year" },
              { id: "all", label: "All Time" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as any)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  period === p.id
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboard}
            disabled={isLoading}
            className="border-slate-800 hover:bg-slate-900 text-slate-300"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {/* Excel Export CTA */}
          <Button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Excel...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export Excel Report (.xlsx)
              </>
            )}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
          <p className="text-sm">Calculating corporate team analytics...</p>
        </div>
      ) : !data ? (
        <div className="p-16 text-center text-slate-500">Failed to load analytics dashboard data.</div>
      ) : (
        <>
          {/* Executive KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Tasks */}
            <Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-xl hover:border-blue-500/40 transition-all">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Total Team Tasks
                  </span>
                  <div className="text-2xl md:text-3xl font-bold text-white font-mono">{data.total_tasks}</div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Shared workspace scope</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <CheckSquare className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            {/* Pending Tasks */}
            <Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-xl hover:border-purple-500/40 transition-all">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Active Pending
                  </span>
                  <div className="text-2xl md:text-3xl font-bold text-purple-300 font-mono">{data.pending_tasks}</div>
                  <span className="text-[10px] text-slate-500 mt-1 block">In-progress & active</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Clock className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            {/* Completed Tasks */}
            <Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-xl hover:border-emerald-500/40 transition-all">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Completed Tasks
                  </span>
                  <div className="text-2xl md:text-3xl font-bold text-emerald-400 font-mono">{data.completed_tasks}</div>
                  <span className="text-[10px] text-emerald-500/80 font-medium mt-1 block">Successfully closed</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            {/* Overdue Tasks */}
            <Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-xl hover:border-red-500/40 transition-all">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Overdue Tasks
                  </span>
                  <div className="text-2xl md:text-3xl font-bold text-red-400 font-mono">{data.overdue_tasks}</div>
                  <span className="text-[10px] text-red-500/80 font-medium mt-1 block">Requires action</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            {/* Completion Rate % */}
            <Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-xl hover:border-blue-500/40 transition-all">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Completion Rate
                  </span>
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white font-mono">
                  {data.completion_rate ?? data.completion_percentage ?? 0}%
                </div>
                <Progress value={data.completion_rate ?? data.completion_percentage ?? 0} className="h-1.5 bg-slate-800" />
              </CardContent>
            </Card>
          </div>

          {/* Recharts Visual Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut Chart: Status Distribution */}
            <Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-xl">
              <CardHeader className="border-b border-slate-800/60 pb-4">
                <CardTitle className="text-base font-bold text-white flex items-center space-x-2">
                  <PieIcon className="w-5 h-5 text-blue-400" />
                  <span>Task Status Distribution</span>
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Breakdown of team tasks across workflow statuses.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 flex flex-col items-center justify-center">
                {chartStatusData.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-xs">No status data available.</div>
                ) : (
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {chartStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "#334155",
                            borderRadius: "8px",
                            color: "#f8fafc",
                            fontSize: "12px",
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bar Chart: Category Statistics */}
            <Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-xl">
              <CardHeader className="border-b border-slate-800/60 pb-4">
                <CardTitle className="text-base font-bold text-white flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <span>Workflow Category Performance</span>
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Total vs Completed tasks across active categories.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {chartCategoryData.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-xs">No category data available.</div>
                ) : (
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartCategoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "#334155",
                            borderRadius: "8px",
                            color: "#f8fafc",
                            fontSize: "12px",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
                        <Bar dataKey="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bottom Section: Live Team Audit Activity Stream */}
          <Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-xl">
            <CardHeader className="border-b border-slate-800/60 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Live Team Audit & Activity Stream</span>
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Real-time log of team actions, workflow processing, and task delegations.
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-slate-800 text-slate-400 font-mono text-[10px]">
                Audit Enabled
              </Badge>
            </CardHeader>
            <CardContent className="p-6">
              {(data?.recent_activities || data?.recent_audit_logs || []).length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">No recent team activities recorded.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(data?.recent_activities || data?.recent_audit_logs || []).map((act: any) => (
                    <div
                      key={act.id}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start space-x-3 text-xs"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200 truncate">{act.user_name}</span>
                          <span className="text-[10px] font-mono text-slate-500">{formatDate(act.created_at)}</span>
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          Action: <span className="font-mono text-blue-400">{act.action_type}</span>
                        </div>
                        {act.details && (
                          <div className="text-[10px] text-slate-400 truncate bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800/60">
                            {act.details}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
