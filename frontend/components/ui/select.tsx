"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";

interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  disabled?: boolean;
  selectedLabel: string;
  setSelectedLabel: (label: string) => void;
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined);

export function Select({
  value,
  onValueChange,
  disabled,
  children,
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedLabel, setSelectedLabel] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset label when value is cleared externally
  React.useEffect(() => {
    if (!value) setSelectedLabel("");
  }, [value]);

  return (
    <SelectContext.Provider
      value={{
        value: value || "",
        onValueChange: onValueChange || (() => {}),
        isOpen,
        setIsOpen,
        disabled,
        selectedLabel,
        setSelectedLabel,
      }}
    >
      <div ref={containerRef} className="relative w-full">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ className, children }: { className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(SelectContext);
  if (!ctx) return null;

  return (
    <button
      type="button"
      disabled={ctx.disabled}
      onClick={() => ctx.setIsOpen(!ctx.isOpen)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:border-slate-500 hover:bg-slate-800",
        ctx.isOpen && "border-blue-500 ring-2 ring-blue-500/20",
        className
      )}
    >
      {children}
      <ChevronDown className={cn("h-4 w-4 opacity-50 shrink-0 ml-2 transition-transform", ctx.isOpen && "rotate-180 opacity-100")} />
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const ctx = React.useContext(SelectContext);
  const hasValue = ctx?.value && ctx.value !== "";
  const displayText = hasValue ? (ctx?.selectedLabel || ctx?.value) : null;

  return (
    <span className={cn("truncate flex-1 text-left", !displayText && "text-slate-500")}>
      {displayText ?? placeholder ?? "Select..."}
    </span>
  );
}

export function SelectContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(SelectContext);
  if (!ctx || !ctx.isOpen) return null;

  return (
    <div
      className={cn(
        "absolute z-[200] mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-700 bg-slate-900 p-1 text-slate-100 shadow-2xl shadow-black/50 backdrop-blur-xl",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SelectItem({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(SelectContext);

  // Extract plain text label from children for display in trigger
  const getTextLabel = React.useCallback((node: React.ReactNode): string => {
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (React.isValidElement<{ children?: React.ReactNode }>(node) && node.props.children) {
      return getTextLabel(node.props.children);
    }
    if (Array.isArray(node)) return node.map(getTextLabel).join(" ").trim();
    return "";
  }, []);

  const label = getTextLabel(children);
  const isSelected = ctx?.value === value;

  // When this item mounts and it's the currently selected value, set its label
  React.useEffect(() => {
    if (isSelected && label && ctx?.setSelectedLabel) {
      ctx.setSelectedLabel(label);
    }
  }, [isSelected, label, ctx]);

  if (!ctx) return null;

  return (
    <div
      onClick={() => {
        ctx.onValueChange(value);
        ctx.setSelectedLabel(label);
        ctx.setIsOpen(false);
      }}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-md py-2 px-3 text-sm outline-none transition-colors hover:bg-blue-600/20 hover:text-blue-200",
        isSelected && "bg-blue-600/25 text-blue-300 font-semibold",
        className
      )}
    >
      <span className="flex-1">{children}</span>
      {isSelected && <Check className="w-4 h-4 ml-2 text-blue-400 shrink-0" />}
    </div>
  );
}
