import { HTMLAttributes } from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/cn";

type AlertTone = "info" | "success" | "warning" | "danger";

const toneClasses: Record<AlertTone, string> = {
  info: "border-sky-200 bg-sky-50 text-slate-700",
  success:
    "border-emerald-200 bg-emerald-50 text-slate-700",
  warning:
    "border-amber-200 bg-amber-50 text-slate-700",
  danger:
    "border-red-200 bg-red-50 text-slate-700"
};

const toneIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertTriangle
};

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  tone?: AlertTone;
}

export const Alert = ({ className, tone = "info", children, ...props }: AlertProps) => {
  const Icon = toneIcons[tone];

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm shadow-sm",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
};
