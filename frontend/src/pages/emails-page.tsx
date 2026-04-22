import { Mail, RefreshCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
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
import { useEmailLogs } from "@/features/emails/hooks";
import { normalizeApiError } from "@/services/http/error";
import { EmailLog } from "@/types/api";

const formatDateTime = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));

const previewBody = (value: string): string =>
  value.replace(/\s+/g, " ").trim().slice(0, 120);

export const EmailsPage = () => {
  const { data: emailLogs = [], isLoading, isError, error, refetch, isFetching } = useEmailLogs();
  const [search, setSearch] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);

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

  return (
    <div className="space-y-8">
      <PageHeader
        title="E-mails enviados"
        description="Visualize o histórico dos resumos pedagógicos enviados para cada aluno e acompanhe falhas de entrega quando houver."
        actions={
          <Button variant="secondary" size="md" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className="h-4 w-4" />
            Atualizar lista
          </Button>
        }
      />

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
