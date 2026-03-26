import { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

const toneClasses: Record<BadgeTone, string> = {
  neutral:
    "border border-slate-200 bg-slate-50 text-slate-700",
  info:
    "border border-sky-200 bg-sky-50 text-slate-700",
  success:
    "border border-emerald-200 bg-emerald-50 text-emerald-700",
  warning:
    "border border-amber-200 bg-amber-50 text-amber-700",
  danger:
    "border border-red-200 bg-red-50 text-red-700"
};

interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export const StatusBadge = ({
  className,
  tone = "neutral",
  ...props
}: StatusBadgeProps) => (
  <span
    className={cn(
      "inline-flex max-w-full items-center rounded-full px-3 py-1 text-xs font-medium leading-5 shadow-sm",
      toneClasses[tone],
      className
    )}
    {...props}
  />
);
