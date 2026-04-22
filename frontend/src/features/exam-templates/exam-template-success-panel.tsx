import { Copy, FileSearch, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Alert } from "@/components/ui/alert";
import { Button, getButtonClassName } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, FieldHint, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { useExamTemplateById } from "@/features/exam-templates/hooks";
import { formatQuestionUnit } from "@/features/questions/metadata";
import { ExamTemplate } from "@/types/api";

interface ExamTemplateSuccessPanelProps {
  examTemplate: ExamTemplate;
  onGenerateArtifacts: () => void;
  onCreateAnother: () => void;
}

export const ExamTemplateSuccessPanel = ({
  examTemplate,
  onGenerateArtifacts,
  onCreateAnother
}: ExamTemplateSuccessPanelProps) => {
  const [lookupId, setLookupId] = useState(examTemplate.id);
  const [requestedLookupId, setRequestedLookupId] = useState("");
  const lookupQuery = useExamTemplateById(requestedLookupId, Boolean(requestedLookupId));

  const activeTemplate = useMemo(
    () => lookupQuery.data ?? examTemplate,
    [examTemplate, lookupQuery.data]
  );

  return (
    <div className="space-y-6">
      <Card className="border-emerald-200/70">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <StatusBadge tone="success">Prova criada</StatusBadge>
            <h2 className="text-2xl font-bold text-slate-800">Modelo pronto para geração</h2>
            <p className="max-w-2xl text-base text-slate-600">
              O backend confirmou a criação do template. Agora você pode gerar os artefatos ou abrir o Banco de Provas para acompanhar os lotes e gabaritos.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" size="md" onClick={onCreateAnother}>
              Criar outra
            </Button>
            <Link to="/exam-bank" className={getButtonClassName({ variant: "secondary", size: "md" })}>
              Banco de Provas
            </Link>
            <Button variant="success" onClick={onGenerateArtifacts}>
              <Sparkles className="h-4 w-4" />
              Gerar PDFs e CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          <div className="subtle-panel px-4 py-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Template ID
            </div>
            <div className="mt-2 break-all text-sm font-semibold text-slate-800">
              {examTemplate.id}
            </div>
          </div>
          <div className="subtle-panel px-4 py-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Questões
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-800">
              {examTemplate.questionsSnapshot.length}
            </div>
          </div>
          <div className="subtle-panel px-4 py-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Identificação
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-800">
              {examTemplate.alternativeIdentificationType}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold text-slate-800">Consultar por ID</h3>
          <p className="text-base text-slate-600">
            Consulta direta ao template via `GET /exam-templates/:id`, útil para checagem rápida ou compartilhamento do identificador.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
            <Field>
              <FieldLabel htmlFor="lookup-id">ID da prova</FieldLabel>
              <Input
                id="lookup-id"
                value={lookupId}
                onChange={(event) => setLookupId(event.target.value)}
              />
              <FieldHint>Você pode consultar o próprio template recém-criado ou outro ID conhecido.</FieldHint>
            </Field>
            <div className="flex items-end">
              <Button
                variant="ghost"
                onClick={async () => {
                  await navigator.clipboard.writeText(lookupId);
                }}
              >
                <Copy className="h-4 w-4" />
                Copiar ID
              </Button>
            </div>
            <div className="flex items-end">
              <Button
                variant="primary"
                onClick={() => setRequestedLookupId(lookupId.trim())}
              >
                <FileSearch className="h-4 w-4" />
                Consultar
              </Button>
            </div>
          </div>

          {lookupQuery.isError ? (
            <Alert tone="danger">Não foi possível consultar a prova pelo ID informado.</Alert>
          ) : null}

          <div className="subtle-panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-800">{activeTemplate.title}</div>
                <div className="text-xs text-slate-500">{activeTemplate.id}</div>
              </div>
              <StatusBadge tone="info">
                {activeTemplate.alternativeIdentificationType}
              </StatusBadge>
            </div>

            <div className="space-y-2">
              {activeTemplate.questionsSnapshot.map((question, index) => (
                <div
                  key={question.id}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                >
                  <div className="text-sm font-semibold text-slate-800">
                    Q{index + 1}. {question.statement}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge tone="info">{question.topic}</StatusBadge>
                    <StatusBadge tone="warning">{formatQuestionUnit(question.unit)}</StatusBadge>
                    <StatusBadge tone="neutral">
                      {question.options.length} alternativas
                    </StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
