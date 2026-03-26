import ReactMarkdown from "react-markdown";
import { RefreshCcw, Sparkles } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface InsightsPanelProps {
  isLoading: boolean;
  isError: boolean;
  warning?: string;
  insights: string | null;
  onRetry: () => void;
}

export const InsightsPanel = ({
  isLoading,
  isError,
  warning,
  insights,
  onRetry
}: InsightsPanelProps) => (
  <Card>
    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-highlight">
          <Sparkles className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-[0.16em]">
            Assistente Pedagógico
          </span>
        </div>
        <h3 className="text-xl font-bold text-slate-800">Insights automáticos da turma</h3>
        <p className="text-base text-slate-600">
          A análise textual é carregada separadamente para não bloquear o dashboard.
        </p>
      </div>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        <RefreshCcw className="h-4 w-4" />
        Tentar novamente
      </Button>
    </CardHeader>
    <CardContent className="space-y-4">
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {!isLoading && warning ? <Alert tone="warning">{warning}</Alert> : null}

      {!isLoading && isError ? (
        <Alert tone="danger">
          Não foi possível carregar os insights agora. Você ainda pode analisar o dashboard numérico normalmente.
        </Alert>
      ) : null}

      {!isLoading && insights ? (
        <div className="prose prose-slate max-w-none prose-headings:font-heading prose-headings:text-slate-800 prose-p:text-slate-600">
          <ReactMarkdown>{insights}</ReactMarkdown>
        </div>
      ) : null}
    </CardContent>
  </Card>
);
