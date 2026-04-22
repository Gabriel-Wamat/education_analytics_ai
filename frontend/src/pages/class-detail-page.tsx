import { ArrowLeft, Mail, Pencil, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import { Alert } from "@/components/ui/alert";
import { Button, getButtonClassName } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
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
import { PageHeader } from "@/components/layout/page-header";
import { ClassFormModal } from "@/features/classes/class-form-modal";
import {
  useClassEvaluations,
  useClassGroup,
  useSetEvaluation
} from "@/features/classes/hooks";
import { useGoals } from "@/features/goals/hooks";
import { useStudents } from "@/features/students/hooks";
import { emailApi } from "@/services/api/email.api";
import { normalizeApiError } from "@/services/http/error";
import { Evaluation, EvaluationLevel } from "@/types/api";

const EVALUATION_OPTIONS: Array<{ value: EvaluationLevel; label: string; short: string }> = [
  { value: "MANA", label: "Meta Ainda Não Atingida", short: "MANA" },
  { value: "MPA", label: "Meta Parcialmente Atingida", short: "MPA" },
  { value: "MA", label: "Meta Atingida", short: "MA" }
];

const levelTone = (level: EvaluationLevel | null): "neutral" | "warning" | "success" | "danger" => {
  if (level === "MA") return "success";
  if (level === "MPA") return "warning";
  if (level === "MANA") return "danger";
  return "neutral";
};

const buildEvaluationIndex = (evaluations: Evaluation[]) => {
  const index = new Map<string, Evaluation>();
  evaluations.forEach((evaluation) => {
    index.set(`${evaluation.studentId}::${evaluation.goalId}`, evaluation);
  });
  return index;
};

export const ClassDetailPage = () => {
  const { classId } = useParams<{ classId: string }>();
  const { data: classGroup, isLoading: loadingClass, isError: classErrored, error: classError } =
    useClassGroup(classId);
  const { data: evaluationsResponse, isLoading: loadingEvaluations } =
    useClassEvaluations(classId);
  const { data: students = [] } = useStudents();
  const { data: goals = [] } = useGoals();
  const setEvaluationMutation = useSetEvaluation(classId);
  const [cellFeedback, setCellFeedback] = useState<Record<string, string>>({});
  const [cellErrors, setCellErrors] = useState<Record<string, string>>({});
  const [editOpen, setEditOpen] = useState(false);

  const triggerDigestMutation = useMutation({
    mutationFn: () => emailApi.processDigest()
  });

  const evaluationIndex = useMemo(
    () => buildEvaluationIndex(evaluationsResponse?.evaluations ?? []),
    [evaluationsResponse]
  );

  const classStudents = useMemo(() => {
    if (!classGroup) return [];
    const byId = new Map(students.map((student) => [student.id, student]));
    return classGroup.studentIds
      .map((id) => byId.get(id))
      .filter((value): value is (typeof students)[number] => Boolean(value));
  }, [classGroup, students]);

  const classGoals = useMemo(() => {
    if (!classGroup) return [];
    const byId = new Map(goals.map((goal) => [goal.id, goal]));
    return classGroup.goalIds
      .map((id) => byId.get(id))
      .filter((value): value is (typeof goals)[number] => Boolean(value));
  }, [classGroup, goals]);

  const handleLevelChange = async (studentId: string, goalId: string, level: EvaluationLevel) => {
    if (!classId) return;
    const cellKey = `${studentId}::${goalId}`;
    setCellErrors((previous) => {
      const next = { ...previous };
      delete next[cellKey];
      return next;
    });
    setCellFeedback((previous) => ({ ...previous, [cellKey]: "Salvando…" }));
    try {
      await setEvaluationMutation.mutateAsync({ studentId, goalId, level });
      setCellFeedback((previous) => ({ ...previous, [cellKey]: "Salvo" }));
      setTimeout(() => {
        setCellFeedback((previous) => {
          const next = { ...previous };
          if (next[cellKey] === "Salvo") {
            delete next[cellKey];
          }
          return next;
        });
      }, 1500);
    } catch (error) {
      setCellFeedback((previous) => {
        const next = { ...previous };
        delete next[cellKey];
        return next;
      });
      setCellErrors((previous) => ({
        ...previous,
        [cellKey]: normalizeApiError(error).message
      }));
    }
  };

  const levelCount = useMemo(() => {
    const counters: Record<EvaluationLevel, number> = { MANA: 0, MPA: 0, MA: 0 };
    evaluationsResponse?.evaluations.forEach((evaluation) => {
      counters[evaluation.level] += 1;
    });
    return counters;
  }, [evaluationsResponse]);

  if (loadingClass) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (classErrored || !classGroup) {
    return (
      <div className="space-y-4">
        <Alert tone="danger">
          {classErrored ? normalizeApiError(classError).message : "Turma não encontrada."}
        </Alert>
        <Link to="/classes" className={getButtonClassName({ variant: "secondary" })}>
          <ArrowLeft className="h-4 w-4" />
          Voltar para turmas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`${classGroup.year} · ${classGroup.semester}º semestre`}
        title={classGroup.topic}
        description="Acompanhe o progresso de cada aluno nas metas da turma. Alterações geram um resumo enviado por e-mail ao final do dia."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link to="/classes" className={getButtonClassName({ variant: "ghost" })}>
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Editar turma
            </Button>
            <Button
              variant="primary"
              onClick={() => triggerDigestMutation.mutate()}
              disabled={triggerDigestMutation.isPending}
            >
              <Mail className="h-4 w-4" />
              {triggerDigestMutation.isPending ? "Enviando…" : "Enviar resumo agora"}
            </Button>
          </div>
        }
      />

      <div className="surface p-6">
        <div className="flex flex-wrap gap-3">
          <StatusBadge tone="neutral">{classStudents.length} alunos</StatusBadge>
          <StatusBadge tone="neutral">{classGoals.length} metas</StatusBadge>
          <StatusBadge tone="success">MA: {levelCount.MA}</StatusBadge>
          <StatusBadge tone="warning">MPA: {levelCount.MPA}</StatusBadge>
          <StatusBadge tone="danger">MANA: {levelCount.MANA}</StatusBadge>
        </div>
        {triggerDigestMutation.isSuccess ? (
          <Alert tone="success" className="mt-4">
            Resumo processado: {triggerDigestMutation.data.emailsSent} e-mails enviados,{" "}
            {triggerDigestMutation.data.entriesProcessed} alterações incluídas.
          </Alert>
        ) : null}
        {triggerDigestMutation.isError ? (
          <Alert tone="danger" className="mt-4">
            {normalizeApiError(triggerDigestMutation.error).message}
          </Alert>
        ) : null}
      </div>

      {loadingEvaluations ? (
        <Skeleton className="h-72 w-full" />
      ) : classStudents.length === 0 || classGoals.length === 0 ? (
        <EmptyState
          icon={<Pencil className="h-8 w-8" />}
          title="Turma sem alunos ou metas"
          description="Associe alunos e metas à turma para começar a registrar avaliações."
          action={
            <Button variant="primary" onClick={() => setEditOpen(true)}>
              Editar turma
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell className="sticky left-0 z-10 bg-slate-50/95">
                Aluno
              </TableHeaderCell>
              {classGoals.map((goal) => (
                <TableHeaderCell key={goal.id}>{goal.name}</TableHeaderCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {classStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="sticky left-0 z-10 bg-white/95 font-semibold text-slate-800">
                  <div className="space-y-0.5">
                    <span className="block">{student.name}</span>
                    <span className="block text-xs font-normal text-slate-500">{student.email}</span>
                  </div>
                </TableCell>
                {classGoals.map((goal) => {
                  const cellKey = `${student.id}::${goal.id}`;
                  const existing = evaluationIndex.get(cellKey);
                  const tone = levelTone(existing?.level ?? null);
                  return (
                    <TableCell key={goal.id}>
                      <div className="space-y-2">
                        <Select
                          value={existing?.level ?? ""}
                          onChange={(event) => {
                            const value = event.target.value as EvaluationLevel | "";
                            if (!value) return;
                            void handleLevelChange(student.id, goal.id, value);
                          }}
                        >
                          <option value="" disabled>
                            Selecione
                          </option>
                          {EVALUATION_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.short} — {option.label}
                            </option>
                          ))}
                        </Select>
                        {existing ? <StatusBadge tone={tone}>{existing.level}</StatusBadge> : null}
                        {cellFeedback[cellKey] ? (
                          <p className="flex items-center gap-1 text-xs text-emerald-600">
                            <Save className="h-3 w-3" />
                            {cellFeedback[cellKey]}
                          </p>
                        ) : null}
                        {cellErrors[cellKey] ? (
                          <p className="text-xs text-red-600">{cellErrors[cellKey]}</p>
                        ) : null}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ClassFormModal
        open={editOpen}
        initialClass={classGroup}
        students={students}
        goals={goals}
        onClose={() => setEditOpen(false)}
      />
    </div>
  );
};
