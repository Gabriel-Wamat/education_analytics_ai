import { useEffect, useState } from "react";
import { Copy, Download, FileArchive, FolderOutput, Sparkles } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldHint, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { SendExamBatchModal } from "@/features/exam-batches/send-exam-batch-modal";
import { normalizeApiError } from "@/services/http/error";
import { ExamTemplate, GenerateExamInstancesResponse } from "@/types/api";
import { ArtifactViewModel } from "@/types/ui";
import { useGenerateExamInstances } from "../exam-templates/hooks";

interface GenerateArtifactsModalProps {
  open: boolean;
  examTemplate: ExamTemplate;
  onClose: () => void;
}

const toArtifactViewModel = (artifact: GenerateExamInstancesResponse["artifacts"][number]): ArtifactViewModel => ({
  ...artifact
});

const triggerArtifactDownload = (downloadUrl: string) => {
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.rel = "noreferrer";
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const GenerateArtifactsModal = ({
  open,
  examTemplate,
  onClose
}: GenerateArtifactsModalProps) => {
  const [quantity, setQuantity] = useState("5");
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateExamInstancesResponse | null>(null);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const generateMutation = useGenerateExamInstances(examTemplate.id);

  useEffect(() => {
    if (open) {
      setApiError(null);
      setResult(null);
      setQuantity("5");
    }
  }, [open, examTemplate.id]);

  const handleGenerate = async () => {
    setApiError(null);

    try {
      const response = await generateMutation.mutateAsync({ quantity: Number(quantity) });
      setResult(response);
    } catch (error) {
      setApiError(normalizeApiError(error).message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Gerar PDFs e CSV"
      description="Dispare a randomização das provas e acompanhe os artefatos gerados pelo backend."
      className="max-w-5xl"
    >
      <div className="space-y-6">
        <Card>
          <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px_auto] lg:items-end">
            <div className="subtle-panel px-4 py-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Template ativo
              </div>
              <div className="mt-2 text-base font-bold text-slate-800">{examTemplate.title}</div>
              <div className="mt-1 text-sm text-slate-500">{examTemplate.id}</div>
            </div>

            <Field>
              <FieldLabel htmlFor="generation-quantity">Quantidade de provas</FieldLabel>
              <Input
                id="generation-quantity"
                type="number"
                min={1}
                step={1}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
              <FieldHint>O backend validará limite e unicidade das variações geradas.</FieldHint>
            </Field>

            <Button
              variant="success"
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? "Gerando..." : "Gerar artefatos"}
            </Button>
          </CardContent>
        </Card>

        {apiError ? <Alert tone="danger">{apiError}</Alert> : null}

        {result ? (
          <div className="space-y-4">
            <Card>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="subtle-panel px-4 py-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Batch ID
                  </div>
                  <div className="mt-2 break-all text-sm font-semibold text-slate-800">
                    {result.batchId}
                  </div>
                </div>
                <div className="subtle-panel px-4 py-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Quantidade gerada
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-800">{result.quantity}</div>
                </div>
                <div className="subtle-panel px-4 py-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Artefatos
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-800">
                    {result.artifacts.length}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setDispatchModalOpen(true)}>
                <Sparkles className="h-4 w-4" />
                Enviar lote por e-mail
              </Button>
            </div>

            <div className="space-y-3">
              {result.artifacts.map((artifact) => {
                const item = toArtifactViewModel(artifact);

                return (
                  <Card key={`${item.kind}-${item.fileName}`}>
                    <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="rounded-xl bg-slate-100 p-3 text-slate-700 shadow-sm">
                          <FileArchive className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-semibold text-slate-800">{item.fileName}</div>
                            <StatusBadge tone={item.kind === "CSV" ? "warning" : "info"}>
                              {item.kind}
                            </StatusBadge>
                          </div>
                          <div className="text-sm text-slate-500">{item.mimeType}</div>
                          {item.absolutePath ? (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <FolderOutput className="h-4 w-4" />
                              {item.absolutePath}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500">
                              Artefato persistido e disponível para download.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {item.absolutePath ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              await navigator.clipboard.writeText(item.absolutePath ?? "");
                            }}
                          >
                            <Copy className="h-4 w-4" />
                            Copiar caminho
                          </Button>
                        ) : null}
                        <Button
                          variant="highlight"
                          size="sm"
                          disabled={!item.downloadUrl}
                          onClick={() =>
                            item.downloadUrl ? triggerArtifactDownload(item.downloadUrl) : undefined
                          }
                          title={
                            item.downloadUrl
                              ? "Baixar artefato"
                              : "Artefato indisponível para download."
                          }
                        >
                          <Download className="h-4 w-4" />
                          Baixar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <Alert tone="info">
            Gere o lote para receber os PDFs individuais, o CSV de gabarito e o disparo opcional por e-mail para uma turma já cadastrada.
          </Alert>
        )}
      </div>

      {result ? (
        <SendExamBatchModal
          open={dispatchModalOpen}
          onClose={() => setDispatchModalOpen(false)}
          batchId={result.batchId}
          proofsAvailable={result.quantity}
        />
      ) : null}
    </Modal>
  );
};
