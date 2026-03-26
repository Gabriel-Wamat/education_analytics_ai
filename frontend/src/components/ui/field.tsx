import { HTMLAttributes, LabelHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export const Field = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("space-y-2", className)} {...props} />
);

export const FieldLabel = ({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    className={cn("block font-label text-sm font-semibold text-slate-700", className)}
    {...props}
  />
);

export const FieldHint = ({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-xs text-slate-500", className)} {...props} />
);

export const FieldError = ({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm font-medium text-red-600", className)} {...props} />
);
