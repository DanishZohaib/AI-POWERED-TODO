"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authService } from "@/services/auth-service";
import { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  CheckSquare,
  Activity,
  Layers,
  Users,
  Key,
  LogOut,
  Menu,
  X,
  Building2,
  Sun,
  Moon,
  User as UserIcon,
  ChevronDown,
} from "lucide-react";

/** Tiny hook: persists dark/light preference in localStorage, toggles <html class="dark"> */
function useTheme() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const dark = saved ? saved === "dark" : true; // default dark
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return { isDark, toggle };
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDark, toggle: toggleTheme } = useTheme();

  useEffect(() => {
    authService.getCurrentUser().then(setCurrentUser).catch(console.error);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      router.push("/login");
    }
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Activity },
    { href: "/tasks", label: "Tasks Directory", icon: CheckSquare },
    { href: "/categories", label: "Categories & Workflows", icon: Layers, adminOnly: true },
    { href: "/users", label: "User Administration", icon: Users, adminOnly: true },
  ];

  const filteredLinks = navLinks.filter(
    (link) => !link.adminOnly || currentUser?.role === "POWER_ADMIN"
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Team Workspace Badge */}
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform shadow-lg shadow-blue-500/10">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight block">
                Workflow<span className="text-blue-400">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono block -mt-1">Corporate Suite</span>
            </div>
          </Link>

          {/* Team Workspace Badge */}
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-medium">{currentUser?.team_name || "Shared Team Workspace"}</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          {filteredLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Dropdown & Actions */}
        <div className="hidden md:flex items-center space-x-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:text-yellow-400 hover:border-yellow-500/50 hover:bg-yellow-500/10 transition-all duration-200"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {currentUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 px-3 hover:bg-slate-900 border border-slate-800/80 rounded-xl space-x-2 text-slate-200">
                  <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-xs text-blue-400">
                    {currentUser.full_name.charAt(0)}
                  </div>
                  <div className="text-left text-xs">
                    <span className="font-semibold block text-slate-100">{currentUser.full_name}</span>
                    <span className="text-[10px] text-slate-400 font-mono block -mt-0.5">{currentUser.user_code}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800 text-slate-200">
                <DropdownMenuLabel className="space-y-1 py-2">
                  <div className="font-semibold text-slate-100">{currentUser.full_name}</div>
                  <div className="text-xs text-slate-400">{currentUser.user_code} • {currentUser.department || "General"}</div>
                  <div className="pt-1">
                    <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] uppercase">
                      {currentUser.role}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-800" />

                <DropdownMenuItem onClick={() => router.push("/change-password")} className="cursor-pointer hover:bg-slate-800 text-xs">
                  <Key className="w-4 h-4 mr-2 text-blue-400" />
                  Change Password
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-slate-800" />

                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 hover:bg-slate-800 text-xs">
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out Session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="md:hidden flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-slate-300 hover:bg-slate-900"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 p-4 space-y-3 animate-in slide-in-from-top-2">
          {currentUser && (
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center space-x-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-sm text-blue-400">
                {currentUser.full_name.charAt(0)}
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-100 block">{currentUser.full_name}</span>
                <span className="text-slate-400">{currentUser.user_code} ({currentUser.role})</span>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {filteredLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center space-x-3 ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-1">
            {/* Theme Toggle (Mobile) */}
            <button
              onClick={toggleTheme}
              className="w-full px-4 py-2.5 rounded-lg text-sm font-medium flex items-center space-x-3 text-slate-300 hover:bg-slate-900"
            >
              {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-blue-400" />}
              <span>{isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
            </button>

            <Link
              href="/change-password"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-lg text-sm font-medium flex items-center space-x-3 text-slate-300 hover:bg-slate-900"
            >
              <Key className="w-5 h-5 text-blue-400" />
              <span>Change Password</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full px-4 py-2.5 rounded-lg text-sm font-medium flex items-center space-x-3 text-red-400 hover:bg-slate-900"
            >
              <LogOut className="w-5 h-5" />
              <span>Log Out Session</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
