import { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
}

export const PageHeader = ({
  eyebrow,
  title,
  description,
  actions,
  className
}: PageHeaderProps) => (
  <div className={cn("flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between", className)}>
    <div className="space-y-2">
      {eyebrow ? (
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          {eyebrow}
        </div>
      ) : null}
      <h1 className="text-[2rem] font-bold tracking-tight text-slate-800 lg:text-[2.15rem]">
        {title}
      </h1>
      <p className="max-w-3xl text-base leading-7 text-slate-600">{description}</p>
    </div>
    {actions ? <div className="flex flex-wrap gap-3 lg:justify-end">{actions}</div> : null}
  </div>
);
