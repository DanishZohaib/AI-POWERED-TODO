"use client";

import React, { useState } from "react";
import { Task, TaskStage } from "@/types";
import { workflowService } from "@/services/workflow-service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Flag,
  User,
  MessageSquare,
  Undo2,
} from "lucide-react";

interface TaskWorkflowStepperProps {
  task: Task;
  onUpdate: (updatedTask: Task) => void;
}

export function TaskWorkflowStepper({ task, onUpdate }: TaskWorkflowStepperProps) {
  const [loadingStageId, setLoadingStageId] = useState<string | null>(null);
  const [stageComments, setStageComments] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sortedStages = [...task.stages].sort((a, b) => a.stage_order - b.stage_order);

  const handleCommentChange = (stageId: string, val: string) => {
    setStageComments((prev) => ({ ...prev, [stageId]: val }));
  };

  const handleComplete = async (stage: TaskStage) => {
    setErrorMessage(null);
    setLoadingStageId(stage.id);

    try {
      const comments = stageComments[stage.id] || "";
      const updated = await workflowService.completeStage(task.id, stage.id, { comments });
      onUpdate(updated);
      setStageComments((prev) => ({ ...prev, [stage.id]: "" }));
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "Failed to complete stage.");
    } finally {
      setLoadingStageId(null);
    }
  };

  const handleUncomplete = async (stage: TaskStage) => {
    setErrorMessage(null);
    setLoadingStageId(stage.id);

    try {
      const updated = await workflowService.uncompleteStage(task.id, stage.id);
      onUpdate(updated);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "Failed to revert stage status.");
    } finally {
      setLoadingStageId(null);
    }
  };

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start space-x-2.5 text-red-400 text-xs shadow-lg animate-in fade-in-50">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold">Sequential Rule Exception</span>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Workflow Stepper Timeline */}
      <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {sortedStages.map((stage, idx) => {
          const isCompleted = stage.is_completed;
          const isLoading = loadingStageId === stage.id;

          // Check if this stage is the current active stage (first incomplete)
          const isCurrentActive =
            !isCompleted &&
            sortedStages.slice(0, idx).every((s) => s.is_completed);

          // Check if blocked by prior required stage
          const isBlocked =
            !isCompleted &&
            sortedStages.slice(0, idx).some((s) => s.is_required && !s.is_completed);

          return (
            <div key={stage.id} className="relative group">
              {/* Stepper Node Icon */}
              <div
                className={`absolute -left-[31px] top-0 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/20"
                    : isCurrentActive
                    ? "bg-blue-500/20 border-blue-500 text-blue-400 animate-pulse shadow-lg shadow-blue-500/20"
                    : isBlocked
                    ? "bg-slate-900 border-slate-700 text-slate-600"
                    : "bg-slate-900 border-slate-700 text-slate-400"
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isBlocked ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-xs font-mono font-bold">{stage.stage_order}</span>
                )}
              </div>

              {/* Stage Container */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  isCompleted
                    ? "bg-slate-900/40 border-slate-800/80"
                    : isCurrentActive
                    ? "bg-slate-900/90 border-blue-500/40 shadow-xl shadow-blue-500/5 ring-1 ring-blue-500/20"
                    : "bg-slate-950/40 border-slate-800/40 opacity-75"
                }`}
              >
                {/* Stage Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-100 text-sm">
                      Stage {stage.stage_order}: {stage.stage_name}
                    </span>
                    {stage.is_required && (
                      <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                        Required
                      </Badge>
                    )}
                    {stage.is_completion_stage && (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
                        <Flag className="w-3 h-3 mr-1" />
                        Final Completion Stage
                      </Badge>
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-slate-500">
                    {isCompleted ? "Completed" : isCurrentActive ? "Active Step" : "Pending"}
                  </span>
                </div>

                {/* Completion Metadata */}
                {isCompleted && (
                  <div className="mt-2 pt-2 border-t border-slate-800/60 space-y-1 text-xs text-slate-400">
                    <div className="flex items-center space-x-2 text-slate-300">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>Completed by: <strong>{stage.completer_name || "User"}</strong></span>
                      {stage.completed_at && (
                        <span className="text-slate-500 text-[11px] font-mono">
                          on {formatDate(stage.completed_at)}
                        </span>
                      )}
                    </div>
                    {stage.comments && (
                      <div className="flex items-start space-x-2 text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 mt-1">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-xs italic">&ldquo;{stage.comments}&rdquo;</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Stage Action Controls */}
                {!isCompleted && (task.can_complete_stages ?? task.can_process_stages) && (
                  <div className="mt-3 space-y-3 pt-3 border-t border-slate-800/60">
                    <div className="space-y-1">
                      <Textarea
                        disabled={isLoading || isBlocked}
                        placeholder="Add completion remarks or reference notes (optional)..."
                        value={stageComments[stage.id] || ""}
                        onChange={(e) => handleCommentChange(stage.id, e.target.value)}
                        className="bg-slate-950/80 border-slate-800 text-slate-100 text-xs resize-none"
                        rows={2}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        disabled={isLoading || isBlocked}
                        onClick={() => handleComplete(stage)}
                        className={`${
                          stage.is_completion_stage
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                            : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
                        }`}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : stage.is_completion_stage ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
                            Complete Final Stage & Finish Task
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
                            Mark Stage Completed
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Uncomplete Action (If allowed) */}
                {isCompleted && task.can_complete_stages && (
                  <div className="mt-2 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isLoading}
                      onClick={() => handleUncomplete(stage)}
                      className="text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    >
                      <Undo2 className="w-3 h-3 mr-1.5" />
                      Revert Stage
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
