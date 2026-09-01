"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { taskService } from "@/services/task-service";
import { userService } from "@/services/user-service";
import { TaskListItem, UserListItem } from "@/types";
import { Loader2, UserCheck, AlertCircle } from "lucide-react";

interface TaskDelegateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task: TaskListItem | null;
}

export function TaskDelegateDialog({ isOpen, onClose, onSuccess, task }: TaskDelegateDialogProps) {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [delegatedTo, setDelegatedTo] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      userService.listUsers({ page_size: 100, is_active: true }).then((res) => setUsers(res.items)).catch(console.error);
      setDelegatedTo("");
      setReason("");
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!delegatedTo) {
      setErrorMessage("Please select a target team member to delegate this task to.");
      return;
    }

    setIsLoading(true);

    try {
      await taskService.delegateTask(task.id, {
        delegated_to: delegatedTo,
        reason: reason.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delegate task.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-100 backdrop-blur-2xl">
        <DialogHeader>
          <div className="flex items-center space-x-2 text-purple-400 mb-1">
            <UserCheck className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Task Reassignment</span>
          </div>
          <DialogTitle className="text-xl font-bold text-white">
            Delegate Task — {task.task_number}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            Reassign <strong className="text-slate-200">{task.title}</strong> to another team member. The delegation history will be permanently preserved.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start space-x-2 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Target Assignee Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-300">New Assignee</Label>
            <Select value={delegatedTo} onValueChange={setDelegatedTo} disabled={isLoading}>
              <SelectTrigger className="bg-slate-950/70 border-slate-800 text-slate-100">
                <SelectValue placeholder="Select Team Member..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.full_name} ({u.user_code}) — {u.department || "General"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Delegation Reason */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-300">Delegation Reason / Handover Notes</Label>
            <Textarea
              disabled={isLoading}
              rows={3}
              placeholder="State reason for task delegation or handover instructions..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="bg-slate-950/70 border-slate-800 text-slate-100 text-xs resize-none"
            />
          </div>

          <DialogFooter className="pt-4 border-t border-slate-800/80">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-500 text-white">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Delegating Task...
                </>
              ) : (
                "Confirm Delegation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
