"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { taskService, CreateTaskPayload, UpdateTaskPayload } from "@/services/task-service";
import { categoryService } from "@/services/category-service";
import { userService } from "@/services/user-service";
import { Task, CategoryListItem, UserListItem, TaskPriority, TaskStatus } from "@/types";
import { TASK_PRIORITY_CONFIG, TASK_STATUS_CONFIG } from "@/lib/constants";
import { Loader2, Plus, Edit3, AlertCircle } from "lucide-react";

interface TaskFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingTask?: Task | null;
}

export function TaskFormDialog({ isOpen, onClose, onSuccess, editingTask }: TaskFormDialogProps) {
  const isEditing = !!editingTask;

  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [status, setStatus] = useState<TaskStatus>("NEW");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch categories & team users for dropdowns
      categoryService.listCategories(true).then(setCategories).catch(console.error);
      userService.listUsers({ page_size: 100, is_active: true }).then((res) => setUsers(res.items)).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || "");
      setCategoryId(editingTask.category_id);
      setAssignedTo(editingTask.assigned_to);
      setPriority(editingTask.priority);
      setStatus(editingTask.status);
      setDueDate(editingTask.due_date ? editingTask.due_date.substring(0, 10) : "");
      setNotes(editingTask.notes || "");
    } else {
      setTitle("");
      setDescription("");
      setCategoryId("");
      setAssignedTo("");
      setPriority("MEDIUM");
      setStatus("NEW");
      setDueDate("");
      setNotes("");
    }
    setErrorMessage(null);
  }, [editingTask, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage("Task title is required.");
      return;
    }
    if (!isEditing && !categoryId) {
      setErrorMessage("Please select a workflow category.");
      return;
    }

    setIsLoading(true);

    try {
      if (isEditing && editingTask) {
        const updatePayload: UpdateTaskPayload = {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          status,
          due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
          notes: notes.trim() || undefined,
        };
        await taskService.updateTask(editingTask.id, updatePayload);
      } else {
        const createPayload: CreateTaskPayload = {
          title: title.trim(),
          description: description.trim() || undefined,
          category_id: categoryId,
          assigned_to: assignedTo || undefined,
          priority,
          due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
          notes: notes.trim() || undefined,
        };
        await taskService.createTask(createPayload);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "Failed to save task.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl bg-slate-900 border-slate-800 text-slate-100 backdrop-blur-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-2 text-blue-400 mb-1">
            {isEditing ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            <span className="text-xs font-semibold uppercase tracking-wider">Corporate Task Tracking</span>
          </div>
          <DialogTitle className="text-xl font-bold text-white">
            {isEditing ? `Edit Task — ${editingTask?.task_number}` : "Create New Workflow Task"}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            {isEditing
              ? "Update task details, priority, or status."
              : "Create a new task under a workflow category. Category stages will be copied automatically."}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start space-x-2 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Category Selector (Creation only) */}
          {!isEditing && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-300">Workflow Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={isLoading}>
                <SelectTrigger className="bg-slate-950/70 border-slate-800 text-slate-100">
                  <SelectValue placeholder="Select a Category..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="font-mono font-bold text-blue-400 mr-2">[{c.category_code}]</span>
                      {c.category_name} ({c.stages_count} Stages)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-300">Task Title</Label>
            <Input
              disabled={isLoading}
              placeholder="e.g. Employee Final Settlement — Muhammad Ali"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-slate-950/70 border-slate-800 text-slate-100"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-300">Description / Scope of Work</Label>
            <Textarea
              disabled={isLoading}
              rows={3}
              placeholder="Detailed instructions or scope of work for this task..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-950/70 border-slate-800 text-slate-100 text-xs resize-none"
            />
          </div>

          {/* Priority & Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-300">Priority Level</Label>
              <Select value={priority} onValueChange={(val) => setPriority(val as TaskPriority)} disabled={isLoading}>
                <SelectTrigger className="bg-slate-950/70 border-slate-800 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                  {Object.entries(TASK_PRIORITY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!isEditing ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-300">Assign To (Optional)</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo} disabled={isLoading}>
                  <SelectTrigger className="bg-slate-950/70 border-slate-800 text-slate-100">
                    <SelectValue placeholder="Assign to Team Member..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name} ({u.user_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-300">Task Status</Label>
                <Select value={status} onValueChange={(val) => setStatus(val as TaskStatus)} disabled={isLoading}>
                  <SelectTrigger className="bg-slate-950/70 border-slate-800 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                    {Object.entries(TASK_STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Due Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-300">Target Due Date</Label>
              <Input
                type="date"
                disabled={isLoading}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-slate-950/70 border-slate-800 text-slate-100"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-300">Additional Notes</Label>
              <Input
                disabled={isLoading}
                placeholder="Optional notes or references"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-slate-950/70 border-slate-800 text-slate-100"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-800/80">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-500 text-white">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving Task...
                </>
              ) : isEditing ? (
                "Save Task Changes"
              ) : (
                "Create Task"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
