import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { chartTheme, chartTooltipStyle } from "@/lib/chart-theme";
import { BarChartData } from "@/types/api";

interface QuestionAccuracyBarChartProps {
  data: BarChartData[];
}

export const QuestionAccuracyBarChart = ({ data }: QuestionAccuracyBarChartProps) => (
  <Card>
    <CardHeader>
      <h3 className="text-xl font-bold text-slate-800">Taxa de acerto por questão</h3>
      <p className="text-base text-slate-600">
        Compare o acerto integral com a média percentual para identificar itens com acerto parcial elevado.
      </p>
    </CardHeader>
    <CardContent>
      <div className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="4 4" stroke={chartTheme.grid} />
            <XAxis dataKey="label" stroke={chartTheme.axis} />
            <YAxis stroke={chartTheme.axis} domain={[0, 100]} />
            <Tooltip contentStyle={chartTooltipStyle} />
            <Legend />
            <Bar
              dataKey="accuracyRate"
              name="Acerto integral (%)"
              fill={chartTheme.success}
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="averageScoreRate"
              name="Média percentual (%)"
              fill={chartTheme.neutral}
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {!data.length ? (
        <p className="mt-3 text-sm text-slate-500">
          As barras aparecem automaticamente quando o relatório tiver acertos e médias por questão.
        </p>
      ) : null}
    </CardContent>
  </Card>
);
