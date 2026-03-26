import {
  BarChartData,
  DashboardMetricsResponse,
  DonutChartQuestionGroup,
  LineChartData
} from "@/types/api";

export type UnitPerformanceLineChartPoint = {
  label: string;
} & Record<string, string | number | null>;

export interface UnitPerformanceLineChartSeries {
  data: UnitPerformanceLineChartPoint[];
  units: Array<{
    key: string;
    unit: number;
    label: string;
  }>;
}

export const getLineChartSeries = (metrics: DashboardMetricsResponse): LineChartData[] =>
  [...metrics.lineChartData].sort((left, right) => left.order - right.order);

export const getBarChartSeries = (metrics: DashboardMetricsResponse): BarChartData[] =>
  [...metrics.barChartData].sort((left, right) => left.order - right.order);

export const getDonutChartGroups = (
  metrics: DashboardMetricsResponse
): DonutChartQuestionGroup[] =>
  [...metrics.donutChartsByQuestion].sort((left, right) => left.order - right.order);

export const getUnitPerformanceLineChartSeries = (
  metrics: DashboardMetricsResponse
): UnitPerformanceLineChartSeries => {
  const groupedByUnit = new Map<number, LineChartData[]>();

  for (const line of getLineChartSeries(metrics)) {
    const current = groupedByUnit.get(line.unit) ?? [];
    current.push(line);
    groupedByUnit.set(line.unit, current);
  }

  const units = Array.from(groupedByUnit.keys())
    .sort((left, right) => left - right)
    .map((unit) => ({
      key: `unit_${unit}`,
      unit,
      label: `Unidade ${unit}`
    }));

  const maxItemsPerUnit = Math.max(
    0,
    ...Array.from(groupedByUnit.values()).map((items) => items.length)
  );

  const data: UnitPerformanceLineChartPoint[] = Array.from(
    { length: maxItemsPerUnit },
    (_, index) => {
      const point: UnitPerformanceLineChartPoint = {
        label: `Item ${index + 1}`
      };

      for (const unit of units) {
        point[unit.key] = groupedByUnit.get(unit.unit)?.[index]?.averagePercentage ?? null;
      }

      return point;
    }
  );

  return {
    data,
    units
  };
};
