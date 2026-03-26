import { forwardRef, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-[132px] w-full rounded-xl border px-3.5 py-3.5 text-sm shadow-sm outline-none transition",
      "border-[color:var(--control-border)] bg-[color:var(--control-bg)] text-[color:var(--control-text)] placeholder:text-[color:var(--control-placeholder)]",
      "hover:border-[color:var(--control-border-strong)] focus:border-accent focus:ring-2 focus:ring-[color:var(--control-ring)]",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
