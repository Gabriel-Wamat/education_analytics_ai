import { InputHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/cn";

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, ...props }, ref) => (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl p-2 transition hover:bg-slate-50/80">
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          "mt-1 h-4 w-4 rounded border border-slate-300 bg-white text-accent focus:ring-accent",
          className
        )}
        {...props}
      />
      {(label || description) && (
        <span className="space-y-0.5">
          {label ? <span className="block text-sm font-semibold text-slate-700">{label}</span> : null}
          {description ? <span className="block text-xs text-slate-500">{description}</span> : null}
        </span>
      )}
    </label>
  )
);

Checkbox.displayName = "Checkbox";
