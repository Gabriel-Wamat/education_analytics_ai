import { ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "success" | "highlight" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-dark text-white shadow-sm hover:bg-mid-blue focus-visible:ring-primary-dark",
  secondary:
    "border border-primary-dark/15 bg-white text-primary-dark shadow-sm hover:border-primary-dark/25 hover:bg-slate-50 focus-visible:ring-accent",
  success:
    "bg-success text-white shadow-sm hover:bg-[#2f855a] focus-visible:ring-success",
  highlight:
    "bg-highlight text-slate-900 shadow-sm hover:bg-[#e7ad1d] focus-visible:ring-highlight",
  ghost:
    "bg-transparent text-primary-dark hover:bg-slate-100 hover:text-mid-blue focus-visible:ring-slate-200",
  danger:
    "border border-red-200 bg-white text-red-700 shadow-sm hover:border-red-300 hover:bg-red-50 focus-visible:ring-red-200"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base"
};

export interface ButtonClassNameOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

export const getButtonClassName = ({
  variant = "primary",
  size = "md",
  fullWidth,
  className
}: ButtonClassNameOptions = {}) =>
  cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F0F4F8] disabled:cursor-not-allowed disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
    className
  );

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", fullWidth, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={getButtonClassName({ variant, size, fullWidth, className })}
      {...props}
    />
  )
);

Button.displayName = "Button";
