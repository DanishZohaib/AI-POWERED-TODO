"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/services/auth-service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, Check, X, AlertCircle, Loader2, KeyRound } from "lucide-react";

function ChangePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Live password policy rules validation
  const rules = useMemo(() => {
    return [
      { id: "length", text: "At least 8 characters long", valid: newPassword.length >= 8 },
      { id: "uppercase", text: "At least one uppercase letter (A-Z)", valid: /[A-Z]/.test(newPassword) },
      { id: "lowercase", text: "At least one lowercase letter (a-z)", valid: /[a-z]/.test(newPassword) },
      { id: "number", text: "At least one number (0-9)", valid: /[0-9]/.test(newPassword) },
      { id: "match", text: "New password and confirm match", valid: newPassword.length > 0 && newPassword === confirmPassword },
    ];
  }, [newPassword, confirmPassword]);

  const isFormValid = rules.every((r) => r.valid) && currentPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!currentPassword) {
      setErrorMessage("Please enter your current password.");
      return;
    }

    if (!isFormValid) {
      setErrorMessage("Please ensure your new password satisfies all password security requirements.");
      return;
    }

    setIsLoading(true);

    try {
      await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setSuccessMessage("Password changed successfully! Redirecting to dashboard...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to change password. Please check your current password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-slate-800/90 bg-slate-900/80 backdrop-blur-2xl shadow-2xl">
      <CardHeader className="space-y-2 pb-6 border-b border-slate-800/60">
        <div className="flex items-center space-x-2 text-blue-400">
          <KeyRound className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">Account Security</span>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-white">
          Change Password
        </CardTitle>
        <CardDescription className="text-slate-400 text-sm">
          {reason === "expired"
            ? "Your password has expired. Please create a new password to continue."
            : reason === "first_login"
            ? "Please change your temporary password to secure your account."
            : "Update your password to keep your account secure."}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start space-x-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start space-x-3 text-emerald-400 text-sm">
            <Check className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-slate-200 text-sm font-medium">
              Current Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <Input
                id="currentPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pl-10 pr-10 bg-slate-950/70 border-slate-800 focus:border-blue-500 text-slate-100 h-11"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-slate-200 text-sm font-medium">
              New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-10 pr-10 bg-slate-950/70 border-slate-800 focus:border-blue-500 text-slate-100 h-11"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-200 text-sm font-medium">
              Confirm New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 pr-10 bg-slate-950/70 border-slate-800 focus:border-blue-500 text-slate-100 h-11"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Live Policy Checklist */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/60 space-y-2.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Password Requirements
            </span>
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center space-x-2 text-xs transition-colors">
                {rule.valid ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-slate-600 shrink-0" />
                )}
                <span className={rule.valid ? "text-slate-200" : "text-slate-500"}>
                  {rule.text}
                </span>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !isFormValid}
            className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-600/20 transition-all duration-200 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating Password...
              </>
            ) : (
              "Update Password & Continue"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ChangePasswordPage() {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 md:p-8 relative selection:bg-blue-600 selection:text-white">
      {/* Background Lighting */}
      <div className="absolute top-1/4 left-1/3 w-[450px] h-[450px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-lg z-10 my-auto">
        <Suspense fallback={<div className="p-8 text-center text-slate-400 text-sm">Loading security form...</div>}>
          <ChangePasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
