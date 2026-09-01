"use client";

import React, { useState, useEffect, useCallback } from "react";
import { taskService } from "@/services/task-service";
import { categoryService } from "@/services/category-service";
import { TaskListItem, CategoryListItem, PaginatedResponse, TaskPriority, TaskStatus } from "@/types";
import { TaskFormDialog } from "@/components/tasks/TaskFormDialog";
import { TaskDelegateDialog } from "@/components/tasks/TaskDelegateDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from "@/lib/constants";
import {
  CheckSquare,
  Plus,
  Search,
  MoreVertical,
  Edit3,
  UserCheck,
  Trash2,
  RefreshCw,
  Loader2,
  Clock,
  AlertTriangle,
  User,
  Layers,
  Filter,
  CheckCircle2,
} from "lucide-react";

export default function TasksPage() {
  const [data, setData] = useState<PaginatedResponse<TaskListItem> | null>(null);
  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View Scope Tab: "all" (Default Shared Workspace), "my_tasks", "created_by_me", "assigned_to_me"
  const [view, setView] = useState<"all" | "my_tasks" | "created_by_me" | "assigned_to_me">("all");

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [page, setPage] = useState(1);

  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);

  const [isDelegateOpen, setIsDelegateOpen] = useState(false);
  const [delegateTargetTask, setDelegateTargetTask] = useState<TaskListItem | null>(null);

  useEffect(() => {
    categoryService.listCategories(false).then(setCategories).catch(console.error);
  }, []);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await taskService.listTasks({
        search: search.trim() || undefined,
        category_id: selectedCategory !== "ALL" ? selectedCategory : undefined,
        priority: selectedPriority !== "ALL" ? (selectedPriority as TaskPriority) : undefined,
        status: selectedStatus !== "ALL" ? (selectedStatus as TaskStatus) : undefined,
        overdue_only: overdueOnly || undefined,
        view,
        page,
        page_size: 15,
      });
      setData(response);
    } catch (err: any) {
      console.error("Failed to load tasks:", err);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCategory, selectedPriority, selectedStatus, overdueOnly, view, page]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleEdit = async (item: TaskListItem) => {
    try {
      const fullTask = await taskService.getTask(item.id);
      setEditingTask(fullTask);
      setIsFormOpen(true);
    } catch (err: any) {
      alert(err.message || "Failed to load task details.");
    }
  };

  const handleDelete = async (item: TaskListItem) => {
    if (!confirm(`Are you sure you want to delete task ${item.task_number}?`)) return;
    try {
      await taskService.deleteTask(item.id);
      loadTasks();
    } catch (err: any) {
      alert(err.message || "Failed to delete task.");
    }
  };

  const renderStatusBadge = (statusKey: TaskStatus) => {
    const config = TASK_STATUS_CONFIG[statusKey] || TASK_STATUS_CONFIG.NEW;
    return (
      <Badge className={`${config.color} border-0 text-[11px] font-semibold`}>
        {config.label}
      </Badge>
    );
  };

  const renderPriorityBadge = (priorityKey: TaskPriority) => {
    const config = TASK_PRIORITY_CONFIG[priorityKey] || TASK_PRIORITY_CONFIG.MEDIUM;
    return (
      <Badge className={`${config.color} border-0 text-[10px] font-medium uppercase`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 mb-1">
            <CheckSquare className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Shared Team Workspace</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Workflow & Task Tracking
          </h1>
          <p className="text-sm text-slate-400">
            View all team tasks by default or filter by your personal assignments and creation.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadTasks()}
            disabled={isLoading}
            className="border-slate-800 hover:bg-slate-900 text-slate-300"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => {
              setEditingTask(null);
              setIsFormOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </Button>
        </div>
      </div>

      {/* Shared Team Workspace View Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-3">
        {[
          { id: "all", label: "All Team Tasks (Shared Default)" },
          { id: "my_tasks", label: "My Tasks (Created or Assigned)" },
          { id: "assigned_to_me", label: "Assigned to Me" },
          { id: "created_by_me", label: "Created by Me" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setView(tab.id as any);
              setPage(1);
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              view === tab.id
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search Task # (e.g. NFS-2026-000001) or Title..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 bg-slate-900/80 border-slate-800 text-slate-100 placeholder:text-slate-500"
          />
        </div>

        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={(val) => { setSelectedCategory(val); setPage(1); }}>
          <SelectTrigger className="bg-slate-900/80 border-slate-800 text-slate-100 text-xs">
            <SelectValue placeholder="Filter Category" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 text-xs">
            <SelectItem value="ALL">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                [{c.category_code}] {c.category_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select value={selectedPriority} onValueChange={(val) => { setSelectedPriority(val); setPage(1); }}>
          <SelectTrigger className="bg-slate-900/80 border-slate-800 text-slate-100 text-xs">
            <SelectValue placeholder="Filter Priority" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 text-xs">
            <SelectItem value="ALL">All Priorities</SelectItem>
            {Object.entries(TASK_PRIORITY_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={selectedStatus} onValueChange={(val) => { setSelectedStatus(val); setPage(1); }}>
          <SelectTrigger className="bg-slate-900/80 border-slate-800 text-slate-100 text-xs">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 text-xs">
            <SelectItem value="ALL">All Statuses</SelectItem>
            {Object.entries(TASK_STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Task Table Card */}
      <Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
              <p className="text-sm">Loading task directory...</p>
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
              <CheckSquare className="w-12 h-12 text-slate-600 mb-3 stroke-[1.5]" />
              <h3 className="text-base font-semibold text-slate-300">No tasks found</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                No corporate tasks match your current view and filter selection.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 bg-slate-950/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-3.5 px-4">Task # & Title</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Priority</th>
                      <th className="py-3.5 px-4">Status & Progress</th>
                      <th className="py-3.5 px-4">Active Stage</th>
                      <th className="py-3.5 px-4">Assignee</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {data.items.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-800/30 transition-colors group">
                        {/* Task Number & Title */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-xs text-blue-400 font-bold mb-0.5">
                            {t.task_number}
                          </div>
                          <div className="font-medium text-slate-100 text-sm line-clamp-1">
                            {t.title}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4">
                          <Badge variant="outline" className="text-[10px] font-mono border-slate-700 text-slate-300">
                            {t.category_code}
                          </Badge>
                        </td>

                        {/* Priority */}
                        <td className="py-3.5 px-4">
                          {renderPriorityBadge(t.priority as TaskPriority)}
                        </td>

                        {/* Status & Progress Bar */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1.5 w-32">
                            {renderStatusBadge(t.status as TaskStatus)}
                            <div className="flex items-center space-x-2">
                              <Progress value={t.progress_percentage} className="h-1.5 bg-slate-800" />
                              <span className="text-[10px] font-mono text-slate-400">
                                {Math.round(t.progress_percentage)}%
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Active Stage */}
                        <td className="py-3.5 px-4">
                          <div className="text-xs text-slate-200 font-medium line-clamp-1">
                            {t.current_stage || "N/A"}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Stage {t.completed_stages} of {t.total_stages}
                          </div>
                        </td>

                        {/* Assignee */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                              {t.assignee_name?.charAt(0)}
                            </div>
                            <span className="text-xs text-slate-300 truncate max-w-[110px]">
                              {t.assignee_name}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800 text-slate-400">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-800 text-slate-200">
                              <DropdownMenuLabel className="text-xs text-slate-500">Task Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEdit(t)} className="cursor-pointer hover:bg-slate-800">
                                <Edit3 className="w-4 h-4 mr-2 text-blue-400" />
                                Edit Task / Process Stages
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => {
                                  setDelegateTargetTask(t);
                                  setIsDelegateOpen(true);
                                }}
                                className="cursor-pointer hover:bg-slate-800"
                              >
                                <UserCheck className="w-4 h-4 mr-2 text-purple-400" />
                                Delegate Task
                              </DropdownMenuItem>

                              <DropdownMenuSeparator className="bg-slate-800" />

                              <DropdownMenuItem
                                onClick={() => handleDelete(t)}
                                className="cursor-pointer text-red-400 hover:bg-slate-800"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Task
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Layout */}
              <div className="md:hidden divide-y divide-slate-800/80">
                {data.items.map((t) => (
                  <div key={t.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-blue-400 font-bold">{t.task_number}</span>
                      {renderStatusBadge(t.status as TaskStatus)}
                    </div>

                    <h4 className="font-semibold text-slate-100 text-sm">{t.title}</h4>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Category: {t.category_code}</span>
                      <span>Assignee: {t.assignee_name}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Progress: {t.current_stage}</span>
                        <span>{Math.round(t.progress_percentage)}%</span>
                      </div>
                      <Progress value={t.progress_percentage} className="h-1.5 bg-slate-800" />
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800/60">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(t)}
                        className="h-8 text-xs border-slate-800 hover:bg-slate-800"
                      >
                        Process Stages
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDelegateTargetTask(t);
                          setIsDelegateOpen(true);
                        }}
                        className="h-8 text-xs border-slate-800 text-purple-400 hover:bg-slate-800"
                      >
                        Delegate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {data.total_pages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-slate-800/80 text-xs text-slate-400">
                  <span>
                    Page {data.page} of {data.total_pages} ({data.total} total team tasks)
                  </span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="h-8 border-slate-800 text-slate-300"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.page >= data.total_pages}
                      onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                      className="h-8 border-slate-800 text-slate-300"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Task Form Dialog */}
      <TaskFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => loadTasks()}
        editingTask={editingTask}
      />

      {/* Delegate Task Dialog */}
      <TaskDelegateDialog
        isOpen={isDelegateOpen}
        onClose={() => setIsDelegateOpen(false)}
        onSuccess={() => loadTasks()}
        task={delegateTargetTask}
      />
    </div>
  );
}
