import { InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  name: string;
  options: RadioOption[];
  value?: string;
  onChange: (value: string) => void;
}

export const RadioGroup = ({ className, name, options, value, onChange }: RadioGroupProps) => (
  <div className={cn("grid gap-3", className)}>
    {options.map((option) => {
      const checked = option.value === value;

      return (
        <label
          key={option.value}
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3.5 transition shadow-sm",
            checked
              ? "border-accent/45 bg-sky-50/90"
              : "border-slate-200 bg-white hover:border-accent/30 hover:bg-slate-50/90"
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={checked}
            onChange={() => onChange(option.value)}
            className="mt-1 h-4 w-4 border border-slate-300 bg-white text-accent focus:ring-accent"
          />
          <span className="space-y-1">
            <span className="block text-sm font-semibold text-slate-700">{option.label}</span>
            {option.description ? (
              <span className="block text-xs text-slate-500">{option.description}</span>
            ) : null}
          </span>
        </label>
      );
    })}
  </div>
);
