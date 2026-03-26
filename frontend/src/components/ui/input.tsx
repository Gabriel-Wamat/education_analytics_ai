import { forwardRef, InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-xl border px-3.5 text-sm shadow-sm outline-none transition",
        "border-[color:var(--control-border)] bg-[color:var(--control-bg)] text-[color:var(--control-text)] placeholder:text-[color:var(--control-placeholder)]",
        "hover:border-[color:var(--control-border-strong)] focus:border-accent focus:ring-2 focus:ring-[color:var(--control-ring)]",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
