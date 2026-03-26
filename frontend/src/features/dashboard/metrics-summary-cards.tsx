import { BarChart3, Trophy, Users2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatPercentage, formatScore } from "@/lib/formatters";
import { DashboardSummary } from "@/types/api";

interface MetricsSummaryCardsProps {
  summary: DashboardSummary;
}

const items = (summary: DashboardSummary) => [
  {
    label: "Alunos corrigidos",
    value: summary.totalStudents,
    helper: `${summary.totalQuestions} questões por prova`,
    icon: Users2,
    iconClassName: "bg-slate-100 text-slate-700"
  },
  {
    label: "Média geral",
    value: formatScore(summary.averageScore),
    helper: `${formatPercentage(summary.averagePercentage)}% de desempenho médio`,
    icon: BarChart3,
    iconClassName: "bg-emerald-50 text-success"
  },
  {
    label: "Maior nota",
    value: formatScore(summary.highestScore),
    helper: `Menor nota: ${formatScore(summary.lowestScore)}`,
    icon: Trophy,
    iconClassName: "bg-amber-50 text-highlight"
  }
];

export const MetricsSummaryCards = ({ summary }: MetricsSummaryCardsProps) => (
  <div className="grid gap-4 lg:grid-cols-3">
    {items(summary).map((item) => {
      const Icon = item.icon;

      return (
        <Card key={item.label}>
          <CardContent className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {item.label}
              </div>
              <div className="text-3xl font-bold text-slate-800">{item.value}</div>
              <div className="text-sm text-slate-600">{item.helper}</div>
            </div>
            <div className={`rounded-xl p-4 shadow-sm ${item.iconClassName}`}>
              <Icon className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      );
    })}
  </div>
);
