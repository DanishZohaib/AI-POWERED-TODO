"use client";

import React, { useState, useEffect, useCallback } from "react";
import { categoryService } from "@/services/category-service";
import { CategoryListItem, Category } from "@/types";
import { CategoryFormDialog } from "@/components/categories/CategoryFormDialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Layers,
  Plus,
  MoreVertical,
  Edit3,
  Copy,
  Power,
  RefreshCw,
  Loader2,
  CheckCircle2,
  ListOrdered,
  Flag,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await categoryService.listCategories(false);
      setCategories(data);
    } catch (err: any) {
      console.error("Failed to load categories:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleEdit = async (catItem: CategoryListItem) => {
    try {
      const fullCategory = await categoryService.getCategory(catItem.id);
      setEditingCategory(fullCategory);
      setIsFormOpen(true);
    } catch (err: any) {
      alert(err.message || "Failed to load category details.");
    }
  };

  const handleDuplicate = async (catItem: CategoryListItem) => {
    try {
      await categoryService.duplicateCategory(catItem.id);
      loadCategories();
    } catch (err: any) {
      alert(err.message || "Failed to duplicate category.");
    }
  };

  const handleToggleActive = async (catItem: CategoryListItem) => {
    try {
      await categoryService.toggleActive(catItem.id);
      loadCategories();
    } catch (err: any) {
      alert(err.message || "Failed to toggle active status.");
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 mb-1">
            <Layers className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Workflow Template Engine</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Category & Workflow Builder
          </h1>
          <p className="text-sm text-slate-400">
            Define custom workflow categories and multi-stage completion rules for corporate office task tracking.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadCategories()}
            disabled={isLoading}
            className="border-slate-800 hover:bg-slate-900 text-slate-300"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => {
              setEditingCategory(null);
              setIsFormOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Category
          </Button>
        </div>
      </div>

      {/* Main Grid of Categories */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
          <p className="text-sm">Loading workflow categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <Card className="border-slate-800 bg-slate-900/60 p-12 text-center">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3 stroke-[1.5]" />
          <h3 className="text-base font-semibold text-slate-300">No Workflow Categories Defined</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Create your first workflow category to start tracking tasks with custom completion stages.
          </p>
          <Button
            onClick={() => {
              setEditingCategory(null);
              setIsFormOpen(true);
            }}
            className="mt-4 bg-blue-600 hover:bg-blue-500 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Workflow Category
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Card
              key={cat.id}
              className={`border-slate-800/80 bg-slate-900/70 backdrop-blur-xl shadow-xl flex flex-col justify-between transition-all hover:border-slate-700 ${
                !cat.is_active ? "opacity-60" : ""
              }`}
            >
              <CardHeader className="pb-3 border-b border-slate-800/60">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono font-bold text-xs uppercase">
                      {cat.category_code}
                    </div>
                    {cat.is_active ? (
                      <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-700">
                        Inactive
                      </Badge>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-slate-800">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-800 text-slate-200">
                      <DropdownMenuLabel className="text-xs text-slate-500">Category Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEdit(cat)} className="cursor-pointer hover:bg-slate-800">
                        <Edit3 className="w-4 h-4 mr-2 text-blue-400" />
                        Edit Category & Stages
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => handleDuplicate(cat)} className="cursor-pointer hover:bg-slate-800">
                        <Copy className="w-4 h-4 mr-2 text-purple-400" />
                        Duplicate Workflow Template
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="bg-slate-800" />

                      <DropdownMenuItem
                        onClick={() => handleToggleActive(cat)}
                        className={`cursor-pointer hover:bg-slate-800 ${
                          cat.is_active ? "text-red-400" : "text-emerald-400"
                        }`}
                      >
                        <Power className="w-4 h-4 mr-2" />
                        {cat.is_active ? "Deactivate Category" : "Activate Category"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <CardTitle className="text-lg font-bold text-white pt-2">
                  {cat.category_name}
                </CardTitle>

                {cat.description && (
                  <CardDescription className="text-slate-400 text-xs line-clamp-2 mt-1">
                    {cat.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                {/* Stats Chips */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Stages</span>
                    <span className="font-bold text-slate-200">{cat.stages_count ?? cat.total_stages ?? 0}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <span className="text-blue-400 block text-[10px] uppercase font-semibold">Active Tasks</span>
                    <span className="font-bold text-blue-300">{cat.active_tasks_count}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-emerald-400 block text-[10px] uppercase font-semibold">Completed</span>
                    <span className="font-bold text-emerald-300">{cat.completed_tasks_count}</span>
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/60">
                  <span className="truncate">By {cat.creator_name}</span>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => handleEdit(cat)}
                    className="p-0 h-auto text-blue-400 text-xs hover:text-blue-300"
                  >
                    View Workflow →
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Category Form Dialog */}
      <CategoryFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => loadCategories()}
        editingCategory={editingCategory}
      />
    </div>
  );
}
