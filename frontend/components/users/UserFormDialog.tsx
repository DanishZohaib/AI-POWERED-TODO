"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CreateUserPayload, UpdateUserPayload, userService } from "@/services/user-service";
import { UserListItem } from "@/types";
import { Loader2, UserPlus, UserCheck, AlertCircle } from "lucide-react";

interface UserFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingUser?: UserListItem | null;
}

export function UserFormDialog({ isOpen, onClose, onSuccess, editingUser }: UserFormDialogProps) {
  const isEditing = !!editingUser;

  const [userCode, setUserCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [role, setRole] = useState<"POWER_ADMIN" | "STANDARD_USER">("STANDARD_USER");
  const [tempPassword, setTempPassword] = useState("");
  const [expiryDays, setExpiryDays] = useState<number>(30);
  const [isActive, setIsActive] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (editingUser) {
      setUserCode(editingUser.user_code);
      setFullName(editingUser.full_name);
      setDepartment(editingUser.department || "");
      setDesignation(editingUser.designation || "");
      setRole(editingUser.role);
      setIsActive(editingUser.is_active);
      setExpiryDays(30);
    } else {
      setUserCode("");
      setFullName("");
      setDepartment("");
      setDesignation("");
      setRole("STANDARD_USER");
      setTempPassword("");
      setExpiryDays(30);
      setIsActive(true);
    }
    setErrorMessage(null);
  }, [editingUser, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isEditing && !userCode.trim()) {
      setErrorMessage("User ID is required.");
      return;
    }
    if (!fullName.trim()) {
      setErrorMessage("Full Name is required.");
      return;
    }
    if (!isEditing && !tempPassword) {
      setErrorMessage("Temporary password is required for new users.");
      return;
    }

    setIsLoading(true);

    try {
      if (isEditing && editingUser) {
        const updatePayload: UpdateUserPayload = {
          full_name: fullName.trim(),
          department: department.trim() || undefined,
          designation: designation.trim() || undefined,
          role,
          password_expiry_days: expiryDays,
        };
        await userService.updateUser(editingUser.id, updatePayload);
      } else {
        const createPayload: CreateUserPayload = {
          user_code: userCode.trim().toUpperCase(),
          full_name: fullName.trim(),
          department: department.trim() || undefined,
          designation: designation.trim() || undefined,
          role,
          temporary_password: tempPassword,
          password_expiry_days: expiryDays,
          is_active: isActive,
        };
        await userService.createUser(createPayload);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "Failed to save user details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-800 text-slate-100 backdrop-blur-2xl">
        <DialogHeader>
          <div className="flex items-center space-x-2 text-blue-400 mb-1">
            {isEditing ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            <span className="text-xs font-semibold uppercase tracking-wider">User Administration</span>
          </div>
          <DialogTitle className="text-xl font-bold text-white">
            {isEditing ? `Edit User — ${editingUser?.user_code}` : "Create New User"}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            {isEditing
              ? "Update user credentials, role permissions, or password validity period."
              : "Create a new employee user account and assign role permissions."}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start space-x-2 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* User ID & Role */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-300">User ID / Code</Label>
              <Input
                disabled={isEditing || isLoading}
                placeholder="e.g. USER006"
                value={userCode}
                onChange={(e) => setUserCode(e.target.value.toUpperCase())}
                className="bg-slate-950/70 border-slate-800 text-slate-100 uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-300">System Role</Label>
              <Select value={role} onValueChange={(val) => setRole(val as "POWER_ADMIN" | "STANDARD_USER")} disabled={isLoading}>
                <SelectTrigger className="bg-slate-950/70 border-slate-800 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                  <SelectItem value="STANDARD_USER">Standard User</SelectItem>
                  <SelectItem value="POWER_ADMIN">Power Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-300">Full Name</Label>
            <Input
              disabled={isLoading}
              placeholder="e.g. Muhammad Hassan"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-slate-950/70 border-slate-800 text-slate-100"
            />
          </div>

          {/* Department & Designation */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-300">Department</Label>
              <Input
                disabled={isLoading}
                placeholder="e.g. Finance"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="bg-slate-950/70 border-slate-800 text-slate-100"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-300">Designation</Label>
              <Input
                disabled={isLoading}
                placeholder="e.g. Accountant"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="bg-slate-950/70 border-slate-800 text-slate-100"
              />
            </div>
          </div>

          {/* Temporary Password (for creation) */}
          {!isEditing && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-300">Temporary Password</Label>
              <Input
                type="text"
                disabled={isLoading}
                placeholder="Initial temporary password e.g. User@12345"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                className="bg-slate-950/70 border-slate-800 text-slate-100"
              />
              <p className="text-[11px] text-slate-500">
                User will be required to change this password on first login.
              </p>
            </div>
          )}

          {/* Password Expiry Period */}
          <div className="grid grid-cols-2 gap-4 items-center pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-300">Password Validity Period</Label>
              <Select
                value={String(expiryDays)}
                onValueChange={(val) => setExpiryDays(Number(val))}
                disabled={isLoading}
              >
                <SelectTrigger className="bg-slate-950/70 border-slate-800 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                  <SelectItem value="15">15 Days</SelectItem>
                  <SelectItem value="30">30 Days (Default)</SelectItem>
                  <SelectItem value="45">45 Days</SelectItem>
                  <SelectItem value="60">60 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!isEditing && (
              <div className="flex items-center space-x-2 pt-5">
                <Checkbox
                  id="active_status"
                  checked={isActive}
                  onCheckedChange={(checked) => setIsActive(!!checked)}
                />
                <label htmlFor="active_status" className="text-xs font-medium text-slate-300 cursor-pointer">
                  Account Active Immediately
                </label>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-slate-800/80">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-500 text-white">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create User Account"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
