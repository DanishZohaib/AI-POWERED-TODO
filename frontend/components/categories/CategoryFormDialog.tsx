"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { WorkflowBuilder } from "@/components/categories/WorkflowBuilder";
import { categoryService, CategoryStagePayload, CreateCategoryPayload } from "@/services/category-service";
import { Category } from "@/types";
import { Loader2, Layers, AlertCircle, Sparkles } from "lucide-react";

interface CategoryFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingCategory?: Category | null;
}

export function CategoryFormDialog({ isOpen, onClose, onSuccess, editingCategory }: CategoryFormDialogProps) {
  const isEditing = !!editingCategory;

  const [categoryCode, setCategoryCode] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [allowStageSkipping, setAllowStageSkipping] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [stages, setStages] = useState<CategoryStagePayload[]>([
    { stage_name: "Initial Review", stage_description: "", stage_order: 1, is_required: true, is_completion_stage: false },
    { stage_name: "Approval Obtained", stage_description: "", stage_order: 2, is_required: true, is_completion_stage: false },
    { stage_name: "Final Completion", stage_description: "", stage_order: 3, is_required: true, is_completion_stage: true },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (editingCategory) {
      setCategoryCode(editingCategory.category_code);
      setCategoryName(editingCategory.category_name);
      setDescription(editingCategory.description || "");
      setAllowStageSkipping(editingCategory.allow_stage_skipping);
      setIsActive(editingCategory.is_active);
      setStages(
        editingCategory.stages.map((s) => ({
          id: s.id,
          stage_name: s.stage_name,
          stage_description: s.stage_description || "",
          stage_order: s.stage_order,
          is_required: s.is_required,
          is_completion_stage: s.is_completion_stage,
          is_active: s.is_active,
        }))
      );
    } else {
      setCategoryCode("");
      setCategoryName("");
      setDescription("");
      setAllowStageSkipping(false);
      setIsActive(true);
      setStages([
        { stage_name: "Initial Review", stage_description: "", stage_order: 1, is_required: true, is_completion_stage: false },
        { stage_name: "Approval Obtained", stage_description: "", stage_order: 2, is_required: true, is_completion_stage: false },
        { stage_name: "Final Completion", stage_description: "", stage_order: 3, is_required: true, is_completion_stage: true },
      ]);
    }
    setErrorMessage(null);
  }, [editingCategory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isEditing && !categoryCode.trim()) {
      setErrorMessage("Category short code is required.");
      return;
    }
    if (!categoryName.trim()) {
      setErrorMessage("Category name is required.");
      return;
    }
    if (stages.length === 0) {
      setErrorMessage("Please define at least 1 workflow stage.");
      return;
    }
    const emptyStage = stages.find((s) => !s.stage_name.trim());
    if (emptyStage) {
      setErrorMessage("All workflow stage names must be filled.");
      return;
    }

    setIsLoading(true);

    try {
      if (isEditing && editingCategory) {
        // Update metadata
        await categoryService.updateCategory(editingCategory.id, {
          category_name: categoryName.trim(),
          description: description.trim() || undefined,
          allow_stage_skipping: allowStageSkipping,
          is_active: isActive,
        });
        // Replace stages
        await categoryService.replaceStages(editingCategory.id, stages);
      } else {
        const payload: CreateCategoryPayload = {
          category_code: categoryCode.trim().toUpperCase(),
          category_name: categoryName.trim(),
          description: description.trim() || undefined,
          allow_stage_skipping: allowStageSkipping,
          is_active: isActive,
          stages,
        };
        await categoryService.createCategory(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save workflow category.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-800 text-slate-100 backdrop-blur-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-2 text-blue-400 mb-1">
            <Layers className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Workflow Template Builder</span>
          </div>
          <DialogTitle className="text-xl font-bold text-white">
            {isEditing ? `Edit Workflow Category — ${editingCategory?.category_code}` : "Create Custom Workflow Category"}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            Configure custom workflow templates with ordered completion stages for your team tasks.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start space-x-2 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* Category Short Code & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-300">Category Short Code</Label>
              <Input
                disabled={isEditing || isLoading}
                placeholder="e.g. NFS or DFS"
                value={categoryCode}
                onChange={(e) => setCategoryCode(e.target.value.toUpperCase())}
                className="bg-slate-950/70 border-slate-800 text-slate-100 uppercase"
              />
              <p className="text-[10px] text-slate-500">Task Prefix e.g. NFS-2026-000001</p>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-medium text-slate-300">Category Name</Label>
              <Input
                disabled={isLoading}
                placeholder="e.g. Normal Final Settlement (NFS)"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="bg-slate-950/70 border-slate-800 text-slate-100"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-300">Description / Guidelines</Label>
            <Textarea
              disabled={isLoading}
              rows={2}
              placeholder="Describe what this workflow covers and standard operating procedures..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-950/70 border-slate-800 text-slate-100 text-xs resize-none"
            />
          </div>

          {/* Stage Skipping Options */}
          <div className="flex items-center space-x-2 pt-1 pb-2 border-b border-slate-800/80">
            <Checkbox
              id="allow_skipping"
              checked={allowStageSkipping}
              onCheckedChange={(checked) => setAllowStageSkipping(!!checked)}
            />
            <label htmlFor="allow_skipping" className="text-xs text-slate-300 cursor-pointer">
              Allow completing stages out of order (flexible non-sequential workflow)
            </label>
          </div>

          {/* Visual Workflow Stage Builder */}
          <WorkflowBuilder stages={stages} onChange={setStages} readOnly={isLoading} />

          <DialogFooter className="pt-4 border-t border-slate-800/80">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-500 text-white">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving Workflow...
                </>
              ) : isEditing ? (
                "Save Category & Workflow"
              ) : (
                "Create Workflow Category"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
