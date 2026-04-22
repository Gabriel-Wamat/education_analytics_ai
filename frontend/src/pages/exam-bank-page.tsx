import { FileDown, Files, Layers3, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
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
import { GenerateArtifactsModal } from "@/features/generation/generate-artifacts-modal";
import { SendExamBatchModal } from "@/features/exam-batches/send-exam-batch-modal";
import {
  useExamBatchById,
  useExamTemplateBatches,
  useExamTemplates
} from "@/features/exam-templates/hooks";
import { normalizeApiError } from "@/services/http/error";
import { ExamBatchSummary, ExamTemplate } from "@/types/api";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));

const formatBytes = (sizeInBytes: number) => {
  if (sizeInBytes < 1024) return `${sizeInBytes} B`;
  if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
};

const triggerArtifactDownload = (downloadUrl: string) => {
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.rel = "noreferrer";
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const ExamBankPage = () => {
  const { data: templates = [], isLoading, isError, error } = useExamTemplates();
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);

  const filteredTemplates = useMemo(() => {
    const term = search.trim().toLowerCase();

    return templates.filter((template) => {
      const matchesSearch =
        term.length === 0 ||
        [template.title, template.id, template.headerMetadata?.discipline ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(term);
      const matchesType =
        selectedType === "ALL" ||
        template.alternativeIdentificationType === selectedType;

      return matchesSearch && matchesType;
    });
  }, [templates, search, selectedType]);

  useEffect(() => {
    if (!filteredTemplates.length) {
      setSelectedTemplateId("");
      return;
    }

    if (!filteredTemplates.some((template) => template.id === selectedTemplateId)) {
      setSelectedTemplateId(filteredTemplates[0]!.id);
    }
  }, [filteredTemplates, selectedTemplateId]);

  const selectedTemplate =
    filteredTemplates.find((template) => template.id === selectedTemplateId) ?? null;

  const batchesQuery = useExamTemplateBatches(selectedTemplateId, Boolean(selectedTemplateId));
  const batches = batchesQuery.data ?? [];

  useEffect(() => {
    if (!batches.length) {
      setSelectedBatchId("");
      return;
    }

    if (!batches.some((batch) => batch.id === selectedBatchId)) {
      setSelectedBatchId(batches[0]!.id);
    }
  }, [batches, selectedBatchId]);

  const selectedBatch =
    batches.find((batch) => batch.id === selectedBatchId) ?? null;
  const batchDetailQuery = useExamBatchById(selectedBatchId, Boolean(selectedBatchId));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Banco de Provas"
        description="Consulte os templates cadastrados, os lotes gerados, os PDFs individuais e o gabarito correspondente de cada prova."
        actions={
          selectedTemplate ? (
            <Button variant="success" onClick={() => setGenerateModalOpen(true)}>
              <Sparkles className="h-4 w-4" />
              Gerar novo lote
            </Button>
          ) : null
        }
      />

      {isError ? <Alert tone="danger">{normalizeApiError(error).message}</Alert> : null}

      <div className="surface p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-end">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-10"
              placeholder="Buscar por título, disciplina ou ID"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <Select value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
            <option value="ALL">Todos os tipos</option>
            <option value="LETTERS">Letras</option>
            <option value="POWERS_OF_2">Potências de 2</option>
          </Select>

          <Button variant="ghost" onClick={() => {
            setSearch("");
            setSelectedType("ALL");
          }}>
            Limpar filtros
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge tone="neutral">{filteredTemplates.length} templates</StatusBadge>
          <StatusBadge tone="info">
            {filteredTemplates.reduce((total, template) => total + template.questionsSnapshot.length, 0)} questões no catálogo
          </StatusBadge>
          <StatusBadge tone="warning">
            {batches.length} lotes do template selecionado
          </StatusBadge>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : null}

      {!isLoading && !filteredTemplates.length ? (
        <EmptyState
          icon={<Files className="h-8 w-8" />}
          title="Nenhum template encontrado"
          description="Crie uma prova para começar a gerar PDFs, gabaritos e lotes consultáveis."
        />
      ) : null}

      {!isLoading && filteredTemplates.length > 0 ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-slate-800">Templates cadastrados</h2>
                <p className="text-sm text-slate-600">
                  Selecione um template para consultar lotes gerados e baixar os artefatos.
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Prova</TableHeaderCell>
                      <TableHeaderCell>Tipo</TableHeaderCell>
                      <TableHeaderCell>Questões</TableHeaderCell>
                      <TableHeaderCell className="text-right">Ação</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-800">{template.title}</div>
                            <div className="text-xs text-slate-500">{template.id}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge tone="info">
                            {template.alternativeIdentificationType}
                          </StatusBadge>
                        </TableCell>
                        <TableCell>{template.questionsSnapshot.length}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant={template.id === selectedTemplateId ? "primary" : "secondary"}
                            size="sm"
                            onClick={() => setSelectedTemplateId(template.id)}
                          >
                            {template.id === selectedTemplateId ? "Selecionado" : "Ver lotes"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {selectedTemplate ? (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold text-slate-800">Resumo do template</h2>
                  <p className="text-sm text-slate-600">
                    Cabeçalho acadêmico e snapshot da prova que alimenta os lotes gerados.
                  </p>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="subtle-panel p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Disciplina
                    </div>
                    <div className="mt-2 font-semibold text-slate-800">
                      {selectedTemplate.headerMetadata?.discipline ?? "Não informada"}
                    </div>
                  </div>
                  <div className="subtle-panel p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Professor
                    </div>
                    <div className="mt-2 font-semibold text-slate-800">
                      {selectedTemplate.headerMetadata?.teacher ?? "Não informado"}
                    </div>
                  </div>
                  <div className="subtle-panel p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Data da prova
                    </div>
                    <div className="mt-2 font-semibold text-slate-800">
                      {selectedTemplate.headerMetadata?.examDate ?? "Não informada"}
                    </div>
                  </div>
                  <div className="subtle-panel p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Identificação
                    </div>
                    <div className="mt-2 font-semibold text-slate-800">
                      {selectedTemplate.alternativeIdentificationType}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-slate-800">Lotes gerados</h2>
                <p className="text-sm text-slate-600">
                  Cada lote preserva as provas individuais e o gabarito correspondente.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {batchesQuery.isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : null}

                {batchesQuery.isError ? (
                  <Alert tone="danger">{normalizeApiError(batchesQuery.error).message}</Alert>
                ) : null}

                {!batchesQuery.isLoading && !batches.length ? (
                  <EmptyState
                    icon={<Layers3 className="h-8 w-8" />}
                    title="Nenhum lote gerado ainda"
                    description="Gere um lote a partir deste template para visualizar PDFs individuais e o gabarito."
                  />
                ) : null}

                {batches.map((batch) => (
                  <button
                    key={batch.id}
                    type="button"
                    onClick={() => setSelectedBatchId(batch.id)}
                    className={`w-full rounded-xl border px-4 py-4 text-left transition ${
                      batch.id === selectedBatchId
                        ? "border-primary-dark bg-slate-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{batch.id}</div>
                        <div className="mt-1 text-sm text-slate-500">
                          {formatDate(batch.createdAt)}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge tone="info">{batch.quantity} provas</StatusBadge>
                        <StatusBadge tone="warning">{batch.artifacts.length} artefatos</StatusBadge>
                      </div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {selectedBatch ? (
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">Artefatos e gabaritos</h2>
                      <p className="text-sm text-slate-600">
                        Download direto dos PDFs e do CSV do lote, além da leitura do gabarito por prova.
                      </p>
                    </div>
                    <Button variant="primary" size="sm" onClick={() => setDispatchModalOpen(true)}>
                      <Sparkles className="h-4 w-4" />
                      Enviar para turma
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {batchDetailQuery.isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-28 w-full" />
                      <Skeleton className="h-44 w-full" />
                    </div>
                  ) : null}

                  {batchDetailQuery.isError ? (
                    <Alert tone="danger">{normalizeApiError(batchDetailQuery.error).message}</Alert>
                  ) : null}

                  {batchDetailQuery.data ? (
                    <>
                      <div className="space-y-3">
                        {batchDetailQuery.data.artifacts.map((artifact) => (
                          <div
                            key={artifact.id}
                            className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between"
                          >
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="font-semibold text-slate-800">{artifact.fileName}</div>
                                <StatusBadge tone={artifact.kind === "CSV" ? "warning" : "info"}>
                                  {artifact.kind}
                                </StatusBadge>
                              </div>
                              <div className="text-sm text-slate-500">
                                {artifact.mimeType} · {formatBytes(artifact.sizeInBytes)}
                              </div>
                            </div>
                            <Button
                              variant="highlight"
                              size="sm"
                              onClick={() => triggerArtifactDownload(artifact.downloadUrl)}
                            >
                              <FileDown className="h-4 w-4" />
                              Baixar
                            </Button>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">Provas e gabaritos</h3>
                          <p className="text-sm text-slate-600">
                            Cada prova individual preserva sua ordem de questões e a resposta correta correspondente.
                          </p>
                        </div>

                        {batchDetailQuery.data.instances.map((instance) => (
                          <details
                            key={instance.id}
                            className="group rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
                          >
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                              <div>
                                <div className="font-semibold text-slate-800">{instance.examCode}</div>
                                <div className="mt-1 text-sm text-slate-500">
                                  {instance.questionCount} questões · {formatDate(instance.createdAt)}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {instance.answerKey.map((answer, index) => (
                                  <StatusBadge key={`${instance.id}-${index + 1}`} tone="neutral">
                                    q{index + 1}: {answer || "em branco"}
                                  </StatusBadge>
                                ))}
                              </div>
                            </summary>

                            <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                              {instance.questions.map((question) => (
                                <div
                                  key={`${instance.id}-q${question.position}`}
                                  className="rounded-xl bg-slate-50 px-4 py-4"
                                >
                                  <div className="font-semibold text-slate-800">
                                    Q{question.position}. {question.statement}
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <StatusBadge tone="warning">
                                      Gabarito: {question.answer || "em branco"}
                                    </StatusBadge>
                                  </div>
                                  <div className="mt-3 grid gap-2">
                                    {question.options.map((option) => (
                                      <div
                                        key={`${instance.id}-${question.position}-${option.position}`}
                                        className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                                      >
                                        <span className="font-semibold text-slate-700">
                                          {option.displayCode}
                                        </span>
                                        <span className="flex-1 text-sm text-slate-600">
                                          {option.description}
                                        </span>
                                        {option.isCorrect ? (
                                          <StatusBadge tone="success">Correta</StatusBadge>
                                        ) : null}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </details>
                        ))}
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      ) : null}

      {selectedTemplate ? (
        <GenerateArtifactsModal
          open={generateModalOpen}
          examTemplate={selectedTemplate}
          onClose={() => setGenerateModalOpen(false)}
        />
      ) : null}

      {selectedBatch && batchDetailQuery.data ? (
        <SendExamBatchModal
          open={dispatchModalOpen}
          onClose={() => setDispatchModalOpen(false)}
          batchId={selectedBatch.id}
          proofsAvailable={batchDetailQuery.data.quantity}
        />
      ) : null}
    </div>
  );
};
