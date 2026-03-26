import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { chartTheme, chartTooltipStyle } from "@/lib/chart-theme";
import { LineChartData } from "@/types/api";

interface PerformanceLineChartProps {
  data: LineChartData[];
}

export const PerformanceLineChart = ({ data }: PerformanceLineChartProps) => (
  <Card>
    <CardHeader>
      <h3 className="text-xl font-bold text-slate-800">Curva de desempenho por questão</h3>
      <p className="text-base text-slate-600">
        Comparativo entre percentual médio da turma e taxa de acerto integral em cada questão.
      </p>
    </CardHeader>
    <CardContent>
      <div className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="4 4" stroke={chartTheme.grid} />
            <XAxis dataKey="label" stroke={chartTheme.axis} />
            <YAxis stroke={chartTheme.axis} domain={[0, 100]} />
            <Tooltip contentStyle={chartTooltipStyle} />
            <Legend />
            <Line
              type="monotone"
              dataKey="averagePercentage"
              name="Média da turma (%)"
              stroke={chartTheme.primary}
              strokeWidth={3}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="fullCorrectRate"
              name="Acerto integral (%)"
              stroke={chartTheme.accent}
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {!data.length ? (
        <p className="mt-3 text-sm text-slate-500">
          O gráfico será preenchido assim que houver dados corrigidos para comparar desempenho por questão.
        </p>
      ) : null}
    </CardContent>
  </Card>
);
