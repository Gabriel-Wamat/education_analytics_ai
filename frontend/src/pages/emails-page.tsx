import { Mail, RefreshCcw, Search, Send, UserRound, UsersRound } from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "@/components/ui/table";
import { useClassGroups } from "@/features/classes/hooks";
import { useEmailLogs, useSendManualEmail } from "@/features/emails/hooks";
import { useStudents } from "@/features/students/hooks";
import { normalizeApiError } from "@/services/http/error";
import { EmailLog, ManualEmailScope, SendManualEmailResponse } from "@/types/api";

const formatDateTime = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));

const previewBody = (value: string): string =>
  value.replace(/\s+/g, " ").trim().slice(0, 120);

export const EmailsPage = () => {
  const { data: emailLogs = [], isLoading, isError, error, refetch, isFetching } = useEmailLogs();
  const { data: students = [] } = useStudents();
  const { data: classGroups = [] } = useClassGroups();
  const sendManualEmail = useSendManualEmail();
  const [search, setSearch] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [scope, setScope] = useState<ManualEmailScope>("STUDENT");
  const [studentId, setStudentId] = useState("");
  const [classId, setClassId] = useState("");
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [sendResult, setSendResult] = useState<SendManualEmailResponse | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return emailLogs;

    return emailLogs.filter((emailLog) =>
      [
        emailLog.studentName,
        emailLog.to,
        emailLog.subject,
        emailLog.text,
        emailLog.digestDate
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [emailLogs, search]);

  const sentCount = emailLogs.filter((emailLog) => emailLog.status === "sent").length;
  const failedCount = emailLogs.filter((emailLog) => emailLog.status === "failed").length;
  const targetIsReady = scope === "STUDENT" ? Boolean(studentId) : Boolean(classId);
  const canSend =
    targetIsReady &&
    subject.trim().length > 0 &&
    text.trim().length > 0 &&
    !sendManualEmail.isPending;

  const handleSendManualEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSend) return;

    const result = await sendManualEmail.mutateAsync({
      scope,
      ...(scope === "STUDENT" ? { studentId } : { classId }),
      subject,
      text
    });
    setSendResult(result);
    setSubject("");
    setText("");
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="E-mails"
        description="Escreva mensagens para um aluno específico, dispare comunicados para uma turma inteira e acompanhe todo o histórico de envio."
        actions={
          <Button variant="secondary" size="md" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className="h-4 w-4" />
            Atualizar lista
          </Button>
        }
      />

      <form className="surface space-y-5 p-6" onSubmit={handleSendManualEmail}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Compor mensagem
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-800">
              Enviar e-mail para aluno ou turma
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              Use este painel para recados pedagógicos manuais. Quando o alvo for uma turma,
              o sistema envia uma mensagem individual para cada aluno matriculado e registra
              cada entrega no histórico.
            </p>
          </div>
          <StatusBadge tone={scope === "STUDENT" ? "info" : "neutral"}>
            {scope === "STUDENT" ? "Envio individual" : "Envio para turma"}
          </StatusBadge>
        </div>

        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Tipo de envio
            </label>
            <Select
              value={scope}
              onChange={(event) => {
                setScope(event.target.value as ManualEmailScope);
                setSendResult(null);
              }}
            >
              <option value="STUDENT">Aluno individual</option>
              <option value="CLASS">Turma inteira</option>
            </Select>
          </div>

          {scope === "STUDENT" ? (
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <UserRound className="h-4 w-4" />
                Aluno
              </label>
              <Select
                value={studentId}
                onChange={(event) => {
                  setStudentId(event.target.value);
                  setSendResult(null);
                }}
              >
                <option value="">Selecione um aluno</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} — {student.email}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <UsersRound className="h-4 w-4" />
                Turma
              </label>
              <Select
                value={classId}
                onChange={(event) => {
                  setClassId(event.target.value);
                  setSendResult(null);
                }}
              >
                <option value="">Selecione uma turma</option>
                {classGroups.map((classGroup) => (
                  <option key={classGroup.id} value={classGroup.id}>
                    {classGroup.topic} — {classGroup.studentIds.length} alunos
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Assunto
            </label>
            <Input
              placeholder="Ex.: Orientações para a próxima atividade"
              value={subject}
              onChange={(event) => {
                setSubject(event.target.value);
                setSendResult(null);
              }}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Mensagem
          </label>
          <Textarea
            placeholder="Escreva a mensagem que o aluno receberá por e-mail."
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setSendResult(null);
            }}
          />
        </div>

        {sendManualEmail.isError ? (
          <Alert tone="danger">{normalizeApiError(sendManualEmail.error).message}</Alert>
        ) : null}

        {sendResult ? (
          <Alert tone={sendResult.emailsFailed > 0 ? "warning" : "success"}>
            {sendResult.emailsSent} de {sendResult.totalRecipients} e-mails enviados para{" "}
            {sendResult.targetLabel}
            {sendResult.emailsFailed > 0 ? `; ${sendResult.emailsFailed} falharam.` : "."}
          </Alert>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            O envio usa o SMTP configurado no backend; sem SMTP, o sistema registra via console
            em ambiente de desenvolvimento.
          </p>
          <Button type="submit" variant="primary" disabled={!canSend}>
            <Send className="h-4 w-4" />
            {sendManualEmail.isPending ? "Enviando..." : "Enviar e-mail"}
          </Button>
        </div>
      </form>

      <div className="surface p-6">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-10"
              placeholder="Buscar por aluno, e-mail, assunto ou conteúdo"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Button variant="ghost" onClick={() => setSearch("")}>
            Limpar busca
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge tone="neutral">{filtered.length} visíveis</StatusBadge>
          <StatusBadge tone="success">{sentCount} enviados</StatusBadge>
          <StatusBadge tone={failedCount > 0 ? "danger" : "info"}>
            {failedCount} com falha
          </StatusBadge>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {isError ? <Alert tone="danger">{normalizeApiError(error).message}</Alert> : null}

      {!isLoading && !isError && filtered.length === 0 ? (
        <EmptyState
          icon={<Mail className="h-8 w-8" />}
          title="Nenhum e-mail encontrado"
          description="Assim que os resumos diários forem processados, eles aparecerão aqui para consulta do professor."
          action={
            <Button variant="secondary" size="md" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCcw className="h-4 w-4" />
              Atualizar lista
            </Button>
          }
        />
      ) : null}

      {!isLoading && !isError && filtered.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Aluno</TableHeaderCell>
              <TableHeaderCell>Assunto</TableHeaderCell>
              <TableHeaderCell>Resumo</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Data</TableHeaderCell>
              <TableHeaderCell className="text-right">Ações</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((emailLog) => (
              <TableRow key={emailLog.id}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-800">{emailLog.studentName}</div>
                    <div className="text-sm text-slate-500">{emailLog.to}</div>
                  </div>
                </TableCell>
                <TableCell className="max-w-[280px]">
                  <div className="line-clamp-2 font-medium text-slate-700" title={emailLog.subject}>
                    {emailLog.subject}
                  </div>
                </TableCell>
                <TableCell className="max-w-[320px]">
                  <div className="line-clamp-2 text-slate-600" title={emailLog.text}>
                    {previewBody(emailLog.text)}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge tone={emailLog.status === "sent" ? "success" : "danger"}>
                    {emailLog.status === "sent" ? "Enviado" : "Falhou"}
                  </StatusBadge>
                </TableCell>
                <TableCell className="text-slate-600">
                  {formatDateTime(emailLog.attemptedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="secondary" size="sm" onClick={() => setSelectedEmail(emailLog)}>
                    Ver e-mail
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}

      <Modal
        open={Boolean(selectedEmail)}
        onClose={() => setSelectedEmail(null)}
        title={selectedEmail?.subject ?? "Visualizar e-mail"}
        description={selectedEmail ? `${selectedEmail.studentName} • ${selectedEmail.to}` : undefined}
        className="max-w-4xl"
      >
        {selectedEmail ? (
          <div className="space-y-6">
            <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Status
                </p>
                <div className="mt-2">
                  <StatusBadge tone={selectedEmail.status === "sent" ? "success" : "danger"}>
                    {selectedEmail.status === "sent" ? "Enviado" : "Falhou"}
                  </StatusBadge>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Digest
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700">{selectedEmail.digestDate}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Alterações
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  {selectedEmail.entriesCount} itens no resumo
                </p>
              </div>
            </div>

            {selectedEmail.failureReason ? (
              <Alert tone="danger">{selectedEmail.failureReason}</Alert>
            ) : null}

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Corpo do e-mail
              </p>
              <pre className="mt-4 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-slate-700">
                {selectedEmail.text}
              </pre>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
