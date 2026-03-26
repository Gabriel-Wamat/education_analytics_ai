import { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export const Skeleton = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("animate-pulse rounded-2xl bg-slate-200/70", className)}
    {...props}
  />
);
