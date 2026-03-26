import { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <Card>
    <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <div className="rounded-full bg-slate-100 p-4 text-slate-700 shadow-sm">{icon}</div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="max-w-lg text-sm text-slate-600">{description}</p>
      </div>
      {action}
    </CardContent>
  </Card>
);
