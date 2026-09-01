"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { userService } from "@/services/user-service";
import { UserListItem } from "@/types";
import { Loader2, CalendarPlus, AlertCircle } from "lucide-react";

interface ExtendExpiryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: UserListItem | null;
}

export function ExtendExpiryDialog({ isOpen, onClose, onSuccess, user }: ExtendExpiryDialogProps) {
  const [additionalDays, setAdditionalDays] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      await userService.extendPasswordExpiry(user.id, additionalDays);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to extend password validity.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-100 backdrop-blur-2xl">
        <DialogHeader>
          <div className="flex items-center space-x-2 text-emerald-400 mb-1">
            <CalendarPlus className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Password Lifecycle</span>
          </div>
          <DialogTitle className="text-xl font-bold text-white">
            Extend Password Validity — {user.user_code}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            Extend the password expiration date for <strong className="text-slate-200">{user.full_name}</strong>.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start space-x-2 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-300">Extend Validity By</Label>
            <Select
              value={String(additionalDays)}
              onValueChange={(val) => setAdditionalDays(Number(val))}
              disabled={isLoading}
            >
              <SelectTrigger className="bg-slate-950/70 border-slate-800 text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                <SelectItem value="15">+15 Days</SelectItem>
                <SelectItem value="30">+30 Days (Standard)</SelectItem>
                <SelectItem value="45">+45 Days</SelectItem>
                <SelectItem value="60">+60 Days</SelectItem>
                <SelectItem value="90">+90 Days (Quarterly)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-800/80">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Extending...
                </>
              ) : (
                "Extend Expiry Date"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
