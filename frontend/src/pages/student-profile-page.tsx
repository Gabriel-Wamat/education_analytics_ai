import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Mail,
  Target,
  TrendingUp,
  UserRound
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Link, useParams } from "react-router-dom";

import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Button, getButtonClassName } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "@/components/ui/table";
import { useStudentProfile } from "@/features/students/hooks";
import { chartTheme, chartTooltipStyle } from "@/lib/chart-theme";
import { normalizeApiError } from "@/services/http/error";
import { EvaluationLevel } from "@/types/api";

const formatCpfMask = (raw: string): string => {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 11) return raw;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium"
  }).format(new Date(value));

const formatDateTime = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));

const levelTone = (level: EvaluationLevel): "danger" | "warning" | "success" => {
  if (level === "MANA") return "danger";
  if (level === "MPA") return "warning";
  return "success";
};

const levelLabel: Record<EvaluationLevel, string> = {
  MANA: "Meta Ainda Não Atingida",
  MPA: "Meta Parcialmente Atingida",
  MA: "Meta Atingida"
};

const summaryCards = (
  summary: {
    totalClasses: number;
    totalGoals: number;
    totalEvaluations: number;
    manaCount: number;
    mpaCount: number;
    maCount: number;
    attainmentPercentage: number;
  }
) => [
  {
    title: "Turmas",
    value: summary.totalClasses,
    helper: `${summary.totalGoals} metas mapeadas`,
    icon: BookOpen
  },
  {
    title: "Atingimento",
    value: `${summary.attainmentPercentage}%`,
    helper: `${summary.totalEvaluations} avaliações registradas`,
    icon: TrendingUp
  },
  {
    title: "Metas atingidas",
    value: summary.maCount,
    helper: `${summary.mpaCount} parciais • ${summary.manaCount} pendentes`,
    icon: CheckCircle2
  }
];

export const StudentProfilePage = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const { data, isLoading, isError, error } = useStudentProfile(studentId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <Alert tone="danger">
          {isError ? normalizeApiError(error).message : "Aluno não encontrado."}
        </Alert>
        <Link to="/students" className={getButtonClassName({ variant: "secondary" })}>
          <ArrowLeft className="h-4 w-4" />
          Voltar para alunos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Gestão pedagógica"
        title={data.student.name}
        description="Perfil individual do aluno com cadastro, panorama das avaliações, turmas vinculadas e histórico de comunicação com o professor."
        actions={
          <Link to="/students" className={getButtonClassName({ variant: "secondary" })}>
            <ArrowLeft className="h-4 w-4" />
            Voltar para alunos
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <Card>
          <CardContent className="grid gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-800">
              <UserRound className="h-9 w-9" />
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Cadastro
                </p>
                <h2 className="text-3xl font-bold text-slate-800">{data.student.name}</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    CPF
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {formatCpfMask(data.student.cpf)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    E-mail
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-700">{data.student.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Última atualização
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {formatDateTime(data.student.updatedAt)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.classes.length > 0 ? (
                  data.classes.map((classGroup) => (
                    <StatusBadge key={classGroup.id} tone="info">
                      {classGroup.topic}
                    </StatusBadge>
                  ))
                ) : (
                  <StatusBadge tone="neutral">Sem turma vinculada</StatusBadge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
          {summaryCards(data.summary).map((item) => (
            <Card key={item.title}>
              <CardContent className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {item.title}
                  </p>
                  <p className="text-4xl font-bold text-slate-800">{item.value}</p>
                  <p className="text-sm text-slate-500">{item.helper}</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <item.icon className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card>
          <CardHeader>
            <h3 className="text-xl font-bold text-slate-800">Evolução de desempenho</h3>
            <p className="text-base text-slate-600">
              Curva acumulada do atingimento conforme as metas do aluno foram sendo registradas.
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.timeline}>
                  <CartesianGrid strokeDasharray="4 4" stroke={chartTheme.grid} />
                  <XAxis dataKey="label" stroke={chartTheme.axis} />
                  <YAxis stroke={chartTheme.axis} domain={[0, 100]} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="attainmentPercentage"
                    name="Atingimento (%)"
                    stroke={chartTheme.primary}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {!data.timeline.length ? (
              <p className="mt-3 text-sm text-slate-500">
                O gráfico será preenchido assim que houver avaliações registradas para este aluno.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-xl font-bold text-slate-800">Resumo por turma</h3>
            <p className="text-base text-slate-600">
              Contexto pedagógico onde o aluno está matriculado e volume de metas já avaliadas.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.classes.length > 0 ? (
              data.classes.map((classGroup) => (
                <div
                  key={classGroup.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="font-semibold text-slate-800">{classGroup.topic}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {classGroup.year} • {classGroup.semester}º semestre
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge tone="neutral">{classGroup.goalCount} metas</StatusBadge>
                    <StatusBadge tone="info">{classGroup.evaluationCount} avaliações</StatusBadge>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={<BookOpen className="h-8 w-8" />}
                title="Aluno sem turma vinculada"
                description="Assim que o aluno for associado a uma turma, o resumo pedagógico aparecerá aqui."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.8fr)]">
        <Card>
          <CardHeader>
            <h3 className="text-xl font-bold text-slate-800">Avaliações por meta</h3>
            <p className="text-base text-slate-600">
              Leitura detalhada de cada meta avaliada, com o nível atual e a turma em que a avaliação aconteceu.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {data.evaluations.length > 0 ? (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Turma</TableHeaderCell>
                    <TableHeaderCell>Meta</TableHeaderCell>
                    <TableHeaderCell>Nível</TableHeaderCell>
                    <TableHeaderCell>Atualizada em</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.evaluations.map((evaluation) => (
                    <TableRow key={evaluation.id}>
                      <TableCell className="font-medium text-slate-700">
                        {evaluation.classLabel}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-slate-400" />
                          <span>{evaluation.goalName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone={levelTone(evaluation.level)}>
                          {evaluation.level}
                        </StatusBadge>
                        <p className="mt-1 text-xs text-slate-500">{levelLabel[evaluation.level]}</p>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {formatDateTime(evaluation.updatedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={<Target className="h-8 w-8" />}
                  title="Nenhuma avaliação registrada"
                  description="O professor ainda não avaliou metas para este aluno."
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-xl font-bold text-slate-800">Histórico de e-mails</h3>
            <p className="text-base text-slate-600">
              Últimos resumos pedagógicos enviados para o aluno a partir das alterações registradas.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.emailLogs.length > 0 ? (
              data.emailLogs.map((emailLog) => (
                <div
                  key={emailLog.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-800">{emailLog.subject}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDate(emailLog.digestDate)} • {formatDateTime(emailLog.attemptedAt)}
                      </p>
                    </div>
                    <StatusBadge tone={emailLog.status === "sent" ? "success" : "danger"}>
                      {emailLog.status === "sent" ? "Enviado" : "Falhou"}
                    </StatusBadge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge tone="neutral">{emailLog.entriesCount} alterações</StatusBadge>
                    <StatusBadge tone="info">
                      <Mail className="h-3.5 w-3.5" />
                      Digest {emailLog.digestDate}
                    </StatusBadge>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={<Mail className="h-8 w-8" />}
                title="Nenhum e-mail enviado"
                description="O histórico será preenchido quando o resumo diário das avaliações for processado."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
