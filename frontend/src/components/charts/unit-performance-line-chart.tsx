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
import { chartTheme, chartTooltipStyle, unitLinePalette } from "@/lib/chart-theme";
import { UnitPerformanceLineChartSeries } from "@/lib/chart-adapters";

interface UnitPerformanceLineChartProps {
  series: UnitPerformanceLineChartSeries;
}

export const UnitPerformanceLineChart = ({
  series
}: UnitPerformanceLineChartProps) => (
  <Card>
    <CardHeader>
      <h3 className="text-xl font-bold text-slate-800">Desempenho por unidade</h3>
      <p className="text-base text-slate-600">
        Cada linha representa uma unidade. Os pontos comparam o desempenho percentual das questões na ordem em que aparecem dentro de cada unidade.
      </p>
    </CardHeader>
    <CardContent>
      <div className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series.data}>
            <CartesianGrid strokeDasharray="4 4" stroke={chartTheme.grid} />
            <XAxis dataKey="label" stroke={chartTheme.axis} />
            <YAxis stroke={chartTheme.axis} domain={[0, 100]} />
            <Tooltip contentStyle={chartTooltipStyle} />
            <Legend />
            {series.units.map((unit, index) => (
              <Line
                key={unit.key}
                type="monotone"
                dataKey={unit.key}
                name={unit.label}
                stroke={unitLinePalette[index % unitLinePalette.length]}
                strokeWidth={3}
                dot={{ r: 4 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {!series.data.length ? (
        <p className="mt-3 text-sm text-slate-500">
          Quando houver dados corrigidos, cada unidade aparecerá com uma linha própria neste gráfico.
        </p>
      ) : null}
    </CardContent>
  </Card>
);
