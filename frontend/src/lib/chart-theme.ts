export const chartTheme = {
  primary: "var(--chart-primary)",
  accent: "var(--chart-accent)",
  success: "var(--chart-success)",
  highlight: "var(--chart-highlight)",
  neutral: "var(--chart-neutral)",
  neutralSoft: "var(--chart-neutral-soft)",
  grid: "var(--chart-grid)",
  axis: "var(--chart-axis)",
  tooltipBorder: "var(--chart-tooltip-border)",
  tooltipShadow: "var(--chart-tooltip-shadow)"
};

export const donutPalette = [
  chartTheme.accent,
  chartTheme.primary,
  chartTheme.highlight,
  chartTheme.neutral,
  chartTheme.neutralSoft
];

export const unitLinePalette = [
  chartTheme.primary,
  chartTheme.accent,
  chartTheme.success,
  chartTheme.highlight,
  "#7C3AED",
  "#F97316"
];

export const chartTooltipStyle = {
  backgroundColor: "var(--chart-tooltip-bg)",
  border: `1px solid ${chartTheme.tooltipBorder}`,
  borderRadius: "16px",
  boxShadow: chartTheme.tooltipShadow,
  color: "var(--app-text)"
};
