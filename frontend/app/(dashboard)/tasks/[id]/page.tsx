"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { taskService } from "@/services/task-service";
import { Task } from "@/types";
import { TaskWorkflowStepper } from "@/components/tasks/TaskWorkflowStepper";
import { TaskDelegateDialog } from "@/components/tasks/TaskDelegateDialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/utils";
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from "@/lib/constants";
import {
  ArrowLeft,
  CheckSquare,
  User,
  UserCheck,
  Layers,
  History,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDelegateOpen, setIsDelegateOpen] = useState(false);

  const loadTaskDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await taskService.getTask(taskId);
      setTask(data);
    } catch (err: unknown) {
      console.error("Failed to load task details:", err);
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (taskId) {
      loadTaskDetail();
    }
  }, [taskId, loadTaskDetail]);

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <p className="text-sm">Loading task workflow details...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center min-h-[60vh]">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-3" />
        <h3 className="text-lg font-semibold text-slate-200">Task Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">The task you requested could not be located in your team workspace.</p>
        <Button onClick={() => router.push("/tasks")} className="bg-blue-600 hover:bg-blue-500 text-white">
          Back to Tasks Directory
        </Button>
      </div>
    );
  }

  const statusConfig = TASK_STATUS_CONFIG[task.status] || TASK_STATUS_CONFIG.NEW;
  const priorityConfig = TASK_PRIORITY_CONFIG[task.priority] || TASK_PRIORITY_CONFIG.MEDIUM;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/tasks")}
          className="text-slate-400 hover:text-slate-200 hover:bg-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Team Tasks
        </Button>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadTaskDetail}
            className="border-slate-800 hover:bg-slate-900 text-slate-300"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Refresh
          </Button>
          {task.can_delegate && (
            <Button
              onClick={() => setIsDelegateOpen(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20"
            >
              <UserCheck className="w-3.5 h-3.5 mr-1.5" />
              Delegate Task
            </Button>
          )}
        </div>
      </div>

      {/* Task Header Banner */}
      <Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                {task.task_number}
              </span>
              <Badge className={`${statusConfig.color} border-0 text-xs font-semibold`}>
                {statusConfig.label}
              </Badge>
              <Badge className={`${priorityConfig.color} border-0 text-[11px] font-semibold uppercase`}>
                {priorityConfig.label} Priority
              </Badge>
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Category: <strong>{task.category_name} ({task.category_code})</strong></span>
            </div>
          </div>

          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">{task.title}</h1>

          {task.description && (
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-3.5 rounded-lg border border-slate-800/60">
              {task.description}
            </p>
          )}

          {/* Progress Bar & People info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800/60 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-400 font-medium">
                <span>Overall Progress</span>
                <span className="font-mono font-bold text-blue-400">{Math.round(task.progress_percentage)}%</span>
              </div>
              <Progress value={task.progress_percentage} className="h-2 bg-slate-800" />
            </div>

            <div className="flex items-center space-x-3 text-slate-300">
              <User className="w-4 h-4 text-slate-500 shrink-0" />
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">Creator</span>
                <span>{task.creator_name}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-slate-300">
              <UserCheck className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">Assignee</span>
                <span className="font-medium text-purple-300">{task.assignee_name}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid: Workflow Stepper (Left 2 cols) & Delegation History (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Workflow Stages */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-xl">
            <CardHeader className="border-b border-slate-800/60 pb-4">
              <CardTitle className="text-base font-bold text-white flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-blue-400" />
                <span>Workflow Stage Pipeline</span>
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Process workflow stages sequentially. Completing the final completion stage automatically closes the task.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <TaskWorkflowStepper task={task} onUpdate={setTask} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Delegation History */}
        <div className="space-y-4">
          <Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-xl">
            <CardHeader className="border-b border-slate-800/60 pb-4">
              <CardTitle className="text-base font-bold text-white flex items-center space-x-2">
                <History className="w-5 h-5 text-purple-400" />
                <span>Delegation Audit Trail</span>
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Permanent record of task transfers and reassignments.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {task.delegations.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  <UserCheck className="w-8 h-8 text-slate-600 mx-auto mb-2 stroke-[1.5]" />
                  No task delegations recorded.
                </div>
              ) : (
                <div className="space-y-3">
                  {task.delegations.map((d, i) => (
                    <div key={d.id} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="font-mono text-[10px]"># {i + 1}</span>
                        <span className="font-mono text-[10px] text-slate-500">{formatDate(d.delegated_at)}</span>
                      </div>
                      <div className="text-slate-200">
                        <strong className="text-slate-100">{d.delegator_name}</strong> reassigned task to{" "}
                        <strong className="text-purple-300">{d.new_assignee_name}</strong>
                      </div>
                      {d.reason && (
                        <p className="text-[11px] text-slate-400 italic bg-slate-900/80 p-2 rounded border border-slate-800/60 mt-1">
                          &ldquo;{d.reason}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delegate Task Dialog */}
      <TaskDelegateDialog
        isOpen={isDelegateOpen}
        onClose={() => setIsDelegateOpen(false)}
        onSuccess={loadTaskDetail}
        task={task}
      />
    </div>
  );
}
