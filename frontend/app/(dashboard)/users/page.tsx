"use client";

import React, { useState, useEffect, useCallback } from "react";
import { userService } from "@/services/user-service";
import { UserListItem, PaginatedResponse } from "@/types";
import { UserFormDialog } from "@/components/users/UserFormDialog";
import { ResetPasswordDialog } from "@/components/users/ResetPasswordDialog";
import { ExtendExpiryDialog } from "@/components/users/ExtendExpiryDialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  Users,
  UserPlus,
  Search,
  MoreVertical,
  Edit3,
  KeyRound,
  CalendarPlus,
  UserX,
  UserCheck,
  Shield,
  User as UserIcon,
  Loader2,
  RefreshCw,
  Clock,
  AlertTriangle,
} from "lucide-react";

export default function UsersPage() {
  const [data, setData] = useState<PaginatedResponse<UserListItem> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  // Dialog State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);

  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<UserListItem | null>(null);

  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const [extendTargetUser, setExtendTargetUser] = useState<UserListItem | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await userService.listUsers({
        search: search.trim() || undefined,
        role: roleFilter !== "ALL" ? roleFilter : undefined,
        is_active: statusFilter === "ACTIVE" ? true : statusFilter === "INACTIVE" ? false : undefined,
        page,
        page_size: 15,
      });
      setData(response);
    } catch (err: any) {
      console.error("Failed to load users:", err);
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter, statusFilter, page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleToggleActive = async (user: UserListItem) => {
    try {
      await userService.toggleActive(user.id);
      loadUsers();
    } catch (err: any) {
      alert(err.message || "Failed to update user status.");
    }
  };

  const renderExpiryBadge = (daysRemaining: number, expiresAt: string) => {
    if (daysRemaining <= 0) {
      return (
        <Badge variant="destructive" className="flex items-center space-x-1 font-mono text-[11px]">
          <AlertTriangle className="w-3 h-3 mr-1" />
          <span>Expired ({formatDate(expiresAt)})</span>
        </Badge>
      );
    }
    if (daysRemaining <= 3) {
      return (
        <Badge variant="destructive" className="flex items-center space-x-1 font-mono text-[11px]">
          <Clock className="w-3 h-3 mr-1" />
          <span>{daysRemaining}d left ({formatDate(expiresAt)})</span>
        </Badge>
      );
    }
    if (daysRemaining <= 7) {
      return (
        <Badge variant="warning" className="flex items-center space-x-1 font-mono text-[11px]">
          <Clock className="w-3 h-3 mr-1" />
          <span>{daysRemaining}d left</span>
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="flex items-center space-x-1 font-mono text-[11px] text-slate-400">
        <span>{daysRemaining}d left</span>
      </Badge>
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 mb-1">
            <Shield className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Power Admin Control Panel</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            User Administration
          </h1>
          <p className="text-sm text-slate-400">
            Manage corporate employees, assign power admin roles, and control password expiry lifecycles.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadUsers()}
            disabled={isLoading}
            className="border-slate-800 hover:bg-slate-900 text-slate-300"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => {
              setEditingUser(null);
              setIsFormOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-600/20"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Create User
          </Button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search User ID, Name, or Department..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 bg-slate-900/80 border-slate-800 text-slate-100 placeholder:text-slate-500"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center space-x-1 bg-slate-900/80 border border-slate-800 rounded-lg p-1">
          {["ALL", "POWER_ADMIN", "STANDARD_USER"].map((role) => (
            <button
              key={role}
              onClick={() => {
                setRoleFilter(role);
                setPage(1);
              }}
              className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all ${
                roleFilter === role
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              {role === "ALL" ? "All Roles" : role === "POWER_ADMIN" ? "Admins" : "Standard"}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-1 bg-slate-900/80 border border-slate-800 rounded-lg p-1">
          {["ALL", "ACTIVE", "INACTIVE"].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all ${
                statusFilter === status
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              {status === "ALL" ? "All Status" : status === "ACTIVE" ? "Active" : "Inactive"}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
              <p className="text-sm">Loading user directory...</p>
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
              <Users className="w-12 h-12 text-slate-600 mb-3 stroke-[1.5]" />
              <h3 className="text-base font-semibold text-slate-300">No users found</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                No active employee user records match your selected filter criteria.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setRoleFilter("ALL");
                  setStatusFilter("ALL");
                }}
                className="mt-4 border-slate-800 text-slate-300 hover:bg-slate-800"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 bg-slate-950/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-3.5 px-4">User ID & Name</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Department & Title</th>
                      <th className="py-3.5 px-4">Account Status</th>
                      <th className="py-3.5 px-4">Password Validity</th>
                      <th className="py-3.5 px-4">Last Login</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {data.items.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/30 transition-colors group">
                        {/* ID & Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs shrink-0">
                              {u.user_code.substring(0, 4)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-100 flex items-center space-x-2">
                                <span>{u.full_name}</span>
                                <span className="font-mono text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                                  {u.user_code}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-4">
                          {u.role === "POWER_ADMIN" ? (
                            <Badge variant="default" className="flex items-center w-fit space-x-1 bg-purple-500/20 text-purple-300 border-purple-500/30">
                              <Shield className="w-3 h-3 mr-1" />
                              Power Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="flex items-center w-fit space-x-1">
                              <UserIcon className="w-3 h-3 mr-1" />
                              Standard User
                            </Badge>
                          )}
                        </td>

                        {/* Department & Title */}
                        <td className="py-3.5 px-4 text-slate-300">
                          <div className="font-medium text-xs text-slate-200">{u.department || "N/A"}</div>
                          <div className="text-[11px] text-slate-400">{u.designation || "N/A"}</div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {u.is_active ? (
                            <span className="inline-flex items-center text-xs font-medium text-emerald-400">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs font-medium text-slate-500">
                              <span className="w-2 h-2 rounded-full bg-slate-600 mr-2" />
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Password Expiry */}
                        <td className="py-3.5 px-4">
                          {renderExpiryBadge(u.days_until_expiry, u.password_expires_at)}
                        </td>

                        {/* Last Login */}
                        <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                          {formatDateTime(u.last_login_at)}
                        </td>

                        {/* Actions Dropdown */}
                        <td className="py-3.5 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800 text-slate-400">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-800 text-slate-200">
                              <DropdownMenuLabel className="text-xs text-slate-500">User Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingUser(u);
                                  setIsFormOpen(true);
                                }}
                                className="cursor-pointer hover:bg-slate-800"
                              >
                                <Edit3 className="w-4 h-4 mr-2 text-blue-400" />
                                Edit User Details
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => {
                                  setResetTargetUser(u);
                                  setIsResetOpen(true);
                                }}
                                className="cursor-pointer hover:bg-slate-800"
                              >
                                <KeyRound className="w-4 h-4 mr-2 text-amber-400" />
                                Reset Password
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => {
                                  setExtendTargetUser(u);
                                  setIsExtendOpen(true);
                                }}
                                className="cursor-pointer hover:bg-slate-800"
                              >
                                <CalendarPlus className="w-4 h-4 mr-2 text-emerald-400" />
                                Extend Validity Period
                              </DropdownMenuItem>

                              <DropdownMenuSeparator className="bg-slate-800" />

                              <DropdownMenuItem
                                onClick={() => handleToggleActive(u)}
                                className={`cursor-pointer hover:bg-slate-800 ${
                                  u.is_active ? "text-red-400" : "text-emerald-400"
                                }`}
                              >
                                {u.is_active ? (
                                  <>
                                    <UserX className="w-4 h-4 mr-2" />
                                    Deactivate User
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-4 h-4 mr-2" />
                                    Activate User
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Layout (Table-to-card transformation) */}
              <div className="md:hidden divide-y divide-slate-800/80">
                {data.items.map((u) => (
                  <div key={u.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-100 text-sm">{u.full_name}</span>
                        <span className="font-mono text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                          {u.user_code}
                        </span>
                      </div>
                      {u.role === "POWER_ADMIN" ? (
                        <Badge variant="default" className="text-[10px] bg-purple-500/20 text-purple-300">
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          User
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                      <div>
                        <span className="text-slate-500 block">Department:</span>
                        <span className="text-slate-300">{u.department || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Account Status:</span>
                        <span className={u.is_active ? "text-emerald-400" : "text-slate-500"}>
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                      <div>{renderExpiryBadge(u.days_until_expiry, u.password_expires_at)}</div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingUser(u);
                            setIsFormOpen(true);
                          }}
                          className="h-8 text-xs border-slate-800 hover:bg-slate-800"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setResetTargetUser(u);
                            setIsResetOpen(true);
                          }}
                          className="h-8 text-xs border-slate-800 text-amber-400 hover:bg-slate-800"
                        >
                          Reset Pwd
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Bar */}
              {data.total_pages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-slate-800/80 text-xs text-slate-400">
                  <span>
                    Page {data.page} of {data.total_pages} ({data.total} total users)
                  </span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="h-8 border-slate-800 text-slate-300"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.page >= data.total_pages}
                      onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                      className="h-8 border-slate-800 text-slate-300"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* User Form Dialog */}
      <UserFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => loadUsers()}
        editingUser={editingUser}
      />

      {/* Reset Password Dialog */}
      <ResetPasswordDialog
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onSuccess={() => loadUsers()}
        user={resetTargetUser}
      />

      {/* Extend Expiry Dialog */}
      <ExtendExpiryDialog
        isOpen={isExtendOpen}
        onClose={() => setIsExtendOpen(false)}
        onSuccess={() => loadUsers()}
        user={extendTargetUser}
      />
    </div>
  );
}
