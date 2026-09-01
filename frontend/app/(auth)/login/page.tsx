"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth-service";
import { AIBrainCanvas } from "@/components/auth/AIBrainCanvas";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, User, AlertCircle, Loader2, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [userCode, setUserCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!userCode.trim()) {
      setErrorMessage("Please enter your User ID.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login({
        user_code: userCode.trim(),
        password,
      });

      // Check if password expired or user must change password
      if (response.password_expired || response.must_change_password) {
        router.push(`/change-password?reason=${response.password_expired ? "expired" : "first_login"}`);
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid User ID or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 md:p-8 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Background Subtle Gradient Lighting */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Grid Container */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center z-10 my-auto">
        {/* Left Side: Animated AI Brain */}
        <div className="w-full h-full min-h-[300px] lg:min-h-[550px] rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl shadow-2xl flex items-center justify-center overflow-hidden">
          <AIBrainCanvas />
        </div>

        {/* Right Side: Login Card */}
        <div className="w-full max-w-md mx-auto">
          <Card className="border-slate-800/90 bg-slate-900/80 backdrop-blur-2xl shadow-2xl shadow-blue-950/20">
            <CardHeader className="space-y-2 pb-6 border-b border-slate-800/60">
              <div className="flex items-center space-x-2 text-blue-400">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-xs font-semibold uppercase tracking-wider">Enterprise Security</span>
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-white">
                Sign In to Workspace
              </CardTitle>
              <CardDescription className="text-slate-400 text-sm">
                Enter your credentials to access the Todo & Workflow Management System.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              {errorMessage && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start space-x-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* User ID Field */}
                <div className="space-y-2">
                  <Label htmlFor="user_code" className="text-slate-200 text-sm font-medium">
                    User ID
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <Input
                      id="user_code"
                      type="text"
                      placeholder="e.g. ADMIN001 or USER001"
                      value={userCode}
                      onChange={(e) => setUserCode(e.target.value)}
                      className="pl-10 bg-slate-950/70 border-slate-800 focus:border-blue-500 text-slate-100 placeholder:text-slate-600 h-11"
                      disabled={isLoading}
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Password Field with Show/Hide Toggle */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-200 text-sm font-medium">
                      Password
                    </Label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-slate-950/70 border-slate-800 focus:border-blue-500 text-slate-100 placeholder:text-slate-600 h-11"
                      disabled={isLoading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 focus:outline-none transition-colors"
                      aria-label={showPassword ? "Hide Password" : "Show Password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-600/20 transition-all duration-200 mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    "Sign In to Dashboard"
                  )}
                </Button>
              </form>

              {/* Development Hint */}
              <div className="mt-8 pt-4 border-t border-slate-800/60 text-center text-xs text-slate-500">
                <p>Default Admin: <code className="text-blue-400">ADMIN001</code> | User: <code className="text-blue-400">USER001</code></p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
