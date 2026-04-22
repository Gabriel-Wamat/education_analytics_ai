import { useEffect, useMemo, useState } from "react";
import { Mail, Send } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldHint, FieldLabel } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { useClassGroups } from "@/features/classes/hooks";
import { useSendExamBatchToClass } from "@/features/exam-templates/hooks";
import { normalizeApiError } from "@/services/http/error";
import { ExamBatchEmailDispatchResponse } from "@/types/api";

interface SendExamBatchModalProps {
  open: boolean;
  onClose: () => void;
  batchId: string;
  proofsAvailable: number;
}

export const SendExamBatchModal = ({
  open,
  onClose,
  batchId,
  proofsAvailable
}: SendExamBatchModalProps) => {
  const { data: classes = [], isLoading, isError, error } = useClassGroups();
  const sendMutation = useSendExamBatchToClass(batchId);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<ExamBatchEmailDispatchResponse | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setApiError(null);
    setResult(null);
  }, [open, batchId]);

  useEffect(() => {
    if (!classes.length) {
      setSelectedClassId("");
      return;
    }

    if (!classes.some((classGroup) => classGroup.id === selectedClassId)) {
      setSelectedClassId(classes[0]!.id);
    }
  }, [classes, selectedClassId]);

  const selectedClass = useMemo(
    () => classes.find((classGroup) => classGroup.id === selectedClassId) ?? null,
    [classes, selectedClassId]
  );

  const canSend =
    Boolean(selectedClass) &&
    !sendMutation.isPending &&
    (selectedClass?.studentIds.length ?? 0) > 0 &&
    (selectedClass?.studentIds.length ?? 0) <= proofsAvailable;

  const handleSend = async () => {
    if (!selectedClassId) {
      return;
    }

    setApiError(null);

    try {
      const response = await sendMutation.mutateAsync({ classId: selectedClassId });
      setResult(response);
    } catch (mutationError) {
      setApiError(normalizeApiError(mutationError).message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Enviar lote por e-mail"
      description="Dispare as provas individuais por e-mail para todos os alunos de uma turma, sem precisar baixar PDF por PDF."
      className="max-w-4xl"
    >
      <div className="space-y-6">
        <Card>
          <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-end">
            <Field>
              <FieldLabel htmlFor="dispatch-class">Turma de destino</FieldLabel>
              <Select
                id="dispatch-class"
                value={selectedClassId}
                onChange={(event) => setSelectedClassId(event.target.value)}
                disabled={isLoading || !classes.length}
              >
                {!classes.length ? <option value="">Nenhuma turma disponível</option> : null}
                {classes.map((classGroup) => (
                  <option key={classGroup.id} value={classGroup.id}>
                    {classGroup.topic} ({classGroup.year}.{classGroup.semester})
                  </option>
                ))}
              </Select>
              <FieldHint>
                Cada aluno recebe o link do próprio PDF individual. O gabarito não é enviado para a turma.
              </FieldHint>
            </Field>

            <div className="subtle-panel px-4 py-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Provas disponíveis
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-800">{proofsAvailable}</div>
            </div>

            <Button variant="primary" onClick={handleSend} disabled={!canSend}>
              <Send className="h-4 w-4" />
              {sendMutation.isPending ? "Enviando..." : "Enviar para turma"}
            </Button>
          </CardContent>
        </Card>

        {isError ? <Alert tone="danger">{normalizeApiError(error).message}</Alert> : null}
        {apiError ? <Alert tone="danger">{apiError}</Alert> : null}

        {selectedClass ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Turma
                </div>
                <div className="font-semibold text-slate-800">{selectedClass.topic}</div>
                <div className="text-sm text-slate-500">
                  {selectedClass.year}.{selectedClass.semester} semestre
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Alunos na turma
                </div>
                <div className="font-semibold text-slate-800">{selectedClass.studentIds.length}</div>
                <div className="text-sm text-slate-500">vinculados a este envio</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Situação
                </div>
                <StatusBadge
                  tone={
                    selectedClass.studentIds.length === 0
                      ? "danger"
                      : selectedClass.studentIds.length > proofsAvailable
                        ? "warning"
                        : "success"
                  }
                >
                  {selectedClass.studentIds.length === 0
                    ? "sem alunos"
                    : selectedClass.studentIds.length > proofsAvailable
                      ? "provas insuficientes"
                      : "pronto para enviar"}
                </StatusBadge>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {selectedClass && selectedClass.studentIds.length > proofsAvailable ? (
          <Alert tone="warning">
            Gere pelo menos {selectedClass.studentIds.length} provas neste lote para conseguir disparar o envio para toda a turma.
          </Alert>
        ) : null}

        {result ? (
          <Card>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Envio concluído</h3>
                  <p className="text-sm text-slate-600">
                    {result.classLabel} · {result.emailsSent} enviados · {result.emailsFailed} falhas
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge tone="info">{result.studentsTargeted} alunos</StatusBadge>
                  <StatusBadge tone="success">{result.emailsSent} enviados</StatusBadge>
                  {result.emailsFailed > 0 ? (
                    <StatusBadge tone="danger">{result.emailsFailed} falhas</StatusBadge>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3">
                {result.assignments.map((assignment) => (
                  <div
                    key={`${assignment.studentId}-${assignment.examCode}`}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="font-semibold text-slate-800">{assignment.studentName}</div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                        <Mail className="h-4 w-4" />
                        {assignment.studentEmail}
                      </div>
                      <div className="text-sm text-slate-500">Prova atribuída: {assignment.examCode}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={assignment.sent ? "success" : "danger"}>
                        {assignment.sent ? "enviado" : "falhou"}
                      </StatusBadge>
                      {assignment.error ? (
                        <span className="text-sm text-red-600">{assignment.error}</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </Modal>
  );
};
