"use client";

import React from "react";
import { CategoryStagePayload } from "@/services/category-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Flag,
  GripVertical,
  HelpCircle,
} from "lucide-react";

interface WorkflowBuilderProps {
  stages: CategoryStagePayload[];
  onChange: (stages: CategoryStagePayload[]) => void;
  readOnly?: boolean;
}

export function WorkflowBuilder({ stages, onChange, readOnly = false }: WorkflowBuilderProps) {
  const addStage = () => {
    const newStage: CategoryStagePayload = {
      stage_name: "",
      stage_description: "",
      stage_order: stages.length + 1,
      is_required: true,
      is_completion_stage: false,
      is_active: true,
    };
    onChange([...stages, newStage]);
  };

  const updateStage = (index: number, field: keyof CategoryStagePayload, value: any) => {
    const updated = [...stages];
    
    // If marking as completion stage, optionally unmark others or allow single completion stage
    if (field === "is_completion_stage" && value === true) {
      updated.forEach((s, i) => {
        if (i !== index) s.is_completion_stage = false;
      });
    }

    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeStage = (index: number) => {
    if (stages.length <= 1) return;
    const filtered = stages.filter((_, i) => i !== index);
    // Re-index stage orders
    const reordered = filtered.map((s, idx) => ({ ...s, stage_order: idx + 1 }));
    onChange(reordered);
  };

  const moveStage = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= stages.length) return;

    const copy = [...stages];
    const temp = copy[index];
    copy[index] = copy[newIndex];
    copy[newIndex] = temp;

    // Re-index stage orders
    const reordered = copy.map((s, idx) => ({ ...s, stage_order: idx + 1 }));
    onChange(reordered);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
            <span>Workflow Completion Stages</span>
            <Badge variant="outline" className="font-mono text-[10px]">
              {stages.length} {stages.length === 1 ? "Stage" : "Stages"}
            </Badge>
          </h4>
          <p className="text-xs text-slate-400">
            Define sequential stages. Marking a stage as <strong className="text-emerald-400">Completion Stage</strong> will automatically mark the task as 100% Completed when checked.
          </p>
        </div>

        {!readOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addStage}
            className="border-slate-800 text-blue-400 hover:bg-slate-800 hover:text-blue-300"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Stage
          </Button>
        )}
      </div>

      {/* Visual Timeline Stepper */}
      <div className="space-y-3 pt-2">
        {stages.map((stage, index) => (
          <React.Fragment key={index}>
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 relative group hover:border-slate-700 transition-all">
              <div className="flex items-start gap-3">
                {/* Drag / Move Handle */}
                {!readOnly && (
                  <div className="flex flex-col items-center justify-center pt-2 space-y-1 text-slate-600 group-hover:text-slate-400">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveStage(index, "up")}
                      className="hover:text-blue-400 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-mono font-bold text-xs">
                      {index + 1}
                    </span>
                    <button
                      type="button"
                      disabled={index === stages.length - 1}
                      onClick={() => moveStage(index, "down")}
                      className="hover:text-blue-400 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Stage Form Inputs */}
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Input
                        disabled={readOnly}
                        placeholder={`Stage ${index + 1} Name (e.g. Clearance Received)`}
                        value={stage.stage_name}
                        onChange={(e) => updateStage(index, "stage_name", e.target.value)}
                        className="bg-slate-900 border-slate-800 text-slate-100 text-sm font-medium"
                      />
                    </div>
                    <div>
                      <Input
                        disabled={readOnly}
                        placeholder="Description / Notes (Optional)"
                        value={stage.stage_description || ""}
                        onChange={(e) => updateStage(index, "stage_description", e.target.value)}
                        className="bg-slate-900 border-slate-800 text-slate-100 text-xs"
                      />
                    </div>
                  </div>

                  {/* Stage Properties Checkboxes */}
                  <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                    <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300">
                      <Checkbox
                        disabled={readOnly}
                        checked={stage.is_required}
                        onCheckedChange={(checked) => updateStage(index, "is_required", !!checked)}
                      />
                      <span>Mandatory Stage</span>
                    </label>

                    <label className="flex items-center space-x-1.5 cursor-pointer text-emerald-400 font-medium">
                      <Checkbox
                        disabled={readOnly}
                        checked={stage.is_completion_stage}
                        onCheckedChange={(checked) => updateStage(index, "is_completion_stage", !!checked)}
                      />
                      <Flag className="w-3.5 h-3.5 text-emerald-400 inline" />
                      <span>Final Completion Stage (100% Progress)</span>
                    </label>
                  </div>
                </div>

                {/* Delete Button */}
                {!readOnly && stages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStage(index)}
                    className="text-slate-600 hover:text-red-400 p-1 transition-colors mt-2"
                    title="Remove Stage"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Visual Connector Arrow between stages */}
            {index < stages.length - 1 && (
              <div className="flex items-center justify-center my-0.5">
                <div className="w-0.5 h-4 bg-slate-800 relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
