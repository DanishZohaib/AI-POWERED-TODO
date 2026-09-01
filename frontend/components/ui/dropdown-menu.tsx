"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextType | undefined>(undefined);

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
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

  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen }}>
      <div ref={containerRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({ asChild, children, ...props }: any) {
  const ctx = React.useContext(DropdownMenuContext);
  if (!ctx) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    ctx.setIsOpen(!ctx.isOpen);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
      ...props,
    });
  }

  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

export function DropdownMenuContent({ align = "end", className, children }: { align?: "start" | "end"; className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(DropdownMenuContext);
  if (!ctx || !ctx.isOpen) return null;

  const alignmentClass = align === "end" ? "right-0" : "left-0";

  return (
    <div
      className={cn(
        "absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-1 text-slate-100 shadow-2xl backdrop-blur-xl animate-in fade-in-80 zoom-in-95",
        alignmentClass,
        className
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({ onClick, className, children }: { onClick?: () => void; className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(DropdownMenuContext);

  const handleClick = () => {
    if (onClick) onClick();
    if (ctx) ctx.setIsOpen(false);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-lg px-2.5 py-1.5 text-xs outline-none transition-colors hover:bg-slate-800 hover:text-slate-100",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuLabel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("px-2.5 py-1.5 text-xs font-semibold text-slate-400", className)}>{children}</div>;
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn("-mx-1 my-1 h-px bg-slate-800", className)} />;
}
