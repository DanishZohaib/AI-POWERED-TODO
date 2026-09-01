"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ checked = false, onCheckedChange, disabled, id, className }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        id={id}
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange && onCheckedChange(!checked)}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-slate-700 bg-slate-950 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center transition-all",
          checked && "bg-blue-600 border-blue-600 text-white",
          className
        )}
      >
        {checked && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
      </button>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
