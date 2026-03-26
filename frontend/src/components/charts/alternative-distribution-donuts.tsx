import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { chartTheme, chartTooltipStyle, donutPalette } from "@/lib/chart-theme";
import { DonutChartQuestionGroup } from "@/types/api";

interface AlternativeDistributionDonutsProps {
  groups: DonutChartQuestionGroup[];
}

export const AlternativeDistributionDonuts = ({
  groups
}: AlternativeDistributionDonutsProps) => (
  <div className="space-y-4">
    <div>
      <h3 className="text-xl font-bold text-slate-800">Distribuição de alternativas marcadas</h3>
      <p className="text-base text-slate-600">
        Cada donut destaca quais distratores atraíram mais marcações em cada questão.
      </p>
    </div>

    {!groups.length ? (
        <Card>
          <CardContent className="flex h-[220px] items-center justify-center text-center">
            <div className="max-w-md space-y-2">
              <div className="text-base font-semibold text-slate-800">
                Distribuição ainda não disponível
              </div>
              <p className="text-sm text-slate-500">
                Assim que houver respostas corrigidas, os donuts desta seção serão preenchidos com a distribuição das alternativas marcadas.
              </p>
          </div>
        </CardContent>
      </Card>
    ) : null}

    <div className="grid gap-4 xl:grid-cols-2">
      {groups.map((group) => (
        <Card key={group.questionId}>
          <CardHeader>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {group.label}
            </div>
            <h4 className="text-base font-bold">{group.statement}</h4>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-center">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={group.data}
                    dataKey="value"
                    nameKey="description"
                    innerRadius={58}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {group.data.map((slice, index) => (
                      <Cell
                        key={slice.optionId}
                        fill={
                          slice.isCorrect
                            ? chartTheme.success
                            : donutPalette[index % donutPalette.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {group.data.map((slice, index) => (
                <div
                  key={slice.optionId}
                  className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-1 h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: slice.isCorrect
                          ? chartTheme.success
                          : donutPalette[index % donutPalette.length]
                      }}
                    />
                    <div>
                      <div className="font-semibold text-slate-800">{slice.description}</div>
                      <div className="text-xs text-slate-500">
                        {slice.label} • {slice.isCorrect ? "Correta" : "Distrator"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-800">{slice.value}</div>
                    <div className="text-xs text-slate-500">
                      {slice.selectionRate.toFixed(1)}% da turma
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);
