import { Link } from "react-router-dom";
import { useState } from "react";
import { ArrowRight, FileSpreadsheet, Upload } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button, getButtonClassName } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dropzone } from "@/components/ui/dropzone";
import { Field, FieldHint, FieldLabel } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
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
import { useGradeExams } from "@/features/grading/hooks";
import { formatPercentage, formatScore } from "@/lib/formatters";
import { normalizeApiError } from "@/services/http/error";
import { GradeExamsResponse, GradingStrategyType } from "@/types/api";

export const GradingPage = () => {
  const gradeMutation = useGradeExams();
  const [gradingStrategyType, setGradingStrategyType] =
    useState<GradingStrategyType>("STRICT");
  const [answerKeyFile, setAnswerKeyFile] = useState<File | null>(null);
  const [studentResponsesFile, setStudentResponsesFile] = useState<File | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [report, setReport] = useState<GradeExamsResponse | null>(null);

  const handleSubmit = async () => {
    setApiError(null);

    if (!answerKeyFile || !studentResponsesFile) {
      setApiError("Selecione os arquivos de gabarito e respostas para iniciar a correção.");
      return;
    }

    try {
      const response = await gradeMutation.mutateAsync({
        gradingStrategyType,
        answerKeyFile,
        studentResponsesFile
      });

      setReport(response);
    } catch (error) {
      setApiError(normalizeApiError(error).message);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Correção de provas"
        description="Envie o CSV de gabarito e o CSV de respostas para gerar as notas da turma e abrir o dashboard analítico."
      />

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-4">
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-slate-800">Upload e estratégia</h2>
              <p className="mt-1 text-base text-slate-600">
                Envie os dois arquivos exigidos pelo backend e escolha a estratégia de correção.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {apiError ? <Alert tone="danger">{apiError}</Alert> : null}

              <Field>
                <FieldLabel>Estratégia de correção</FieldLabel>
                <Select
                  value={gradingStrategyType}
                  onChange={(event) =>
                    setGradingStrategyType(event.target.value as GradingStrategyType)
                  }
                >
                  <option value="STRICT">STRICT • erro zera a questão</option>
                  <option value="PROPORTIONAL">PROPORTIONAL • nota parcial por estados corretos</option>
                </Select>
                <FieldHint>Escolha a severidade da nota antes do envio dos arquivos.</FieldHint>
              </Field>

              <Dropzone
                label="CSV de gabarito"
                description="Arquivo exportado pela geração das provas."
                file={answerKeyFile}
                onFileSelect={setAnswerKeyFile}
              />
              <Dropzone
                label="CSV de respostas dos alunos"
                description="Arquivo consolidado com `studentId`, `examCode`, `questionPosition` e `markedAnswer`."
                file={studentResponsesFile}
                onFileSelect={setStudentResponsesFile}
              />

              <Button
                fullWidth
                onClick={handleSubmit}
                disabled={gradeMutation.isPending}
              >
                <Upload className="h-4 w-4" />
                {gradeMutation.isPending ? "Corrigindo..." : "Corrigir provas"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-slate-800">Guia rápido do fluxo</h2>
              <p className="mt-1 text-base text-slate-600">
                Esta área ajuda a reduzir erros operacionais antes do envio dos arquivos.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="subtle-panel px-4 py-4">
                <div className="text-sm font-semibold text-slate-800">1. Gabarito</div>
                <p className="mt-1 text-sm text-slate-600">
                  Use o CSV gerado pelo módulo de randomização das provas.
                </p>
              </div>
              <div className="subtle-panel px-4 py-4">
                <div className="text-sm font-semibold text-slate-800">2. Respostas</div>
                <p className="mt-1 text-sm text-slate-600">
                  Importe o consolidado do formulário com identificação da prova e marcações do aluno.
                </p>
              </div>
              <div className="subtle-panel px-4 py-4">
                <div className="text-sm font-semibold text-slate-800">3. Dashboard</div>
                <p className="mt-1 text-sm text-slate-600">
                  Após a correção, use o `examId` gerado para abrir a visão analítica da turma.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-8">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Resumo da turma</h2>
                <p className="mt-1 text-base text-slate-600">
                  Após a correção, esta área mostra o resultado imediato e o acesso ao dashboard detalhado.
                </p>
              </div>
              {report ? (
                <Link
                  to={`/exams/${report.examId}`}
                  className={getButtonClassName({ variant: "primary", size: "sm" })}
                >
                  Abrir dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </CardHeader>
            <CardContent>
              {report ? (
                <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="subtle-panel px-4 py-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Exam ID
                      </div>
                      <div className="mt-2 break-all text-sm font-semibold text-slate-800">
                        {report.examId}
                      </div>
                    </div>
                    <div className="subtle-panel px-4 py-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Alunos
                      </div>
                      <div className="mt-2 text-2xl font-bold text-slate-800">
                        {report.totalStudents}
                      </div>
                    </div>
                    <div className="subtle-panel px-4 py-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Média
                      </div>
                      <div className="mt-2 text-2xl font-bold text-slate-800">
                        {formatScore(report.averageScore)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge tone="info">{report.strategy}</StatusBadge>
                    <span className="text-sm text-slate-500">
                      Relatório pronto para análise detalhada.
                    </span>
                  </div>
                </div>
              ) : (
                <Alert tone="info">
                  O relatório aparecerá aqui assim que o backend concluir a correção da turma.
                </Alert>
              )}
            </CardContent>
          </Card>

          {report ? <StudentsReportTable report={report} /> : null}
        </div>
      </div>
    </div>
  );
};

const StudentsReportTable = ({ report }: { report: GradeExamsResponse }) => (
  <Card>
    <CardHeader>
      <h2 className="text-2xl font-bold text-slate-800">Relatório de alunos</h2>
      <p className="mt-1 text-base text-slate-600">
        Visão consolidada com identificação da prova, nota total e percentual de desempenho.
      </p>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Aluno</TableHeaderCell>
            <TableHeaderCell>Prova</TableHeaderCell>
            <TableHeaderCell>Nota total</TableHeaderCell>
            <TableHeaderCell>Percentual</TableHeaderCell>
          </tr>
        </TableHead>
        <TableBody>
          {report.students.map((student) => (
            <TableRow key={`${student.studentId}-${student.examCode}`}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                    {(student.studentName || student.studentId).slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">
                      {student.studentName || student.studentId}
                    </div>
                    <div className="text-xs text-slate-500">{student.studentId}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="inline-flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-accent" />
                  {student.examCode}
                </div>
              </TableCell>
              <TableCell>{formatScore(student.totalScore)}</TableCell>
              <TableCell>{formatPercentage(student.percentage)}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);
