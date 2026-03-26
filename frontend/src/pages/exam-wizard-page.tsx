import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpenCheck, CalendarDays, GraduationCap, Search, Sparkles } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldHint, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup } from "@/components/ui/radio-group";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { useQuestions } from "@/features/questions/hooks";
import {
  buildQuestionTopics,
  buildQuestionUnits,
  formatQuestionUnit,
  matchesQuestionSearch
} from "@/features/questions/metadata";
import { normalizeApiError } from "@/services/http/error";
import { AlternativeIdentificationType, ExamTemplate, Question } from "@/types/api";
import { GenerateArtifactsModal } from "@/features/generation/generate-artifacts-modal";
import { ExamTemplateSuccessPanel } from "@/features/exam-templates/exam-template-success-panel";
import { useCreateExamTemplate } from "@/features/exam-templates/hooks";

const examWizardSchema = z.object({
  title: z.string().trim().min(1, "Informe o título da prova."),
  alternativeIdentificationType: z.enum(["LETTERS", "POWERS_OF_2"]),
  discipline: z.string().optional(),
  teacher: z.string().optional(),
  date: z.string().optional()
});

type ExamWizardSchema = z.infer<typeof examWizardSchema>;

const alternativeOptions = [
  {
    value: "LETTERS",
    label: "Letras (A, B, C...)",
    description: "Ideal quando o aluno preencher as letras marcadas diretamente."
  },
  {
    value: "POWERS_OF_2",
    label: "Potências de 2",
    description: "Ideal quando a correção usa o somatório das alternativas selecionadas."
  }
];

export const ExamWizardPage = () => {
  const { data: questions = [], isLoading, isError, error } = useQuestions();
  const createExamTemplateMutation = useCreateExamTemplate();
  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("ALL");
  const [selectedUnit, setSelectedUnit] = useState("ALL");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [createdExamTemplate, setCreatedExamTemplate] = useState<ExamTemplate | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<ExamWizardSchema>({
    resolver: zodResolver(examWizardSchema),
    defaultValues: {
      title: "",
      alternativeIdentificationType: "LETTERS",
      discipline: "",
      teacher: "",
      date: ""
    }
  });

  const filteredQuestions = useMemo(
    () =>
      questions.filter((question) => {
        const matchesSearch = matchesQuestionSearch(question, search);
        const matchesTopic = selectedTopic === "ALL" || question.topic === selectedTopic;
        const matchesUnit = selectedUnit === "ALL" || question.unit === Number(selectedUnit);

        return matchesSearch && matchesTopic && matchesUnit;
      }),
    [questions, search, selectedTopic, selectedUnit]
  );
  const topicSuggestions = useMemo(() => buildQuestionTopics(questions), [questions]);
  const unitSuggestions = useMemo(() => buildQuestionUnits(questions), [questions]);

  const selectedQuestions = useMemo(
    () => questions.filter((question) => selectedQuestionIds.includes(question.id)),
    [questions, selectedQuestionIds]
  );

  const toggleQuestion = (question: Question) => {
    setSelectedQuestionIds((current) =>
      current.includes(question.id)
        ? current.filter((questionId) => questionId !== question.id)
        : [...current, question.id]
    );
  };

  const onSubmit = handleSubmit(async (values) => {
    setApiError(null);

    if (selectedQuestionIds.length === 0) {
      setApiError("Selecione pelo menos uma questão para montar a prova.");
      return;
    }

    try {
      const createdTemplate = await createExamTemplateMutation.mutateAsync({
        title: values.title,
        questionIds: selectedQuestionIds,
        alternativeIdentificationType:
          values.alternativeIdentificationType as AlternativeIdentificationType
      });

      setCreatedExamTemplate(createdTemplate);
    } catch (mutationError) {
      setApiError(normalizeApiError(mutationError).message);
    }
  });

  if (createdExamTemplate) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Assistente concluído"
          title="Template de prova criado"
          description="O template já está persistido no backend e pronto para acionar a geração de PDFs e CSV."
        />

        <ExamTemplateSuccessPanel
          examTemplate={createdExamTemplate}
          onGenerateArtifacts={() => setGenerateModalOpen(true)}
          onCreateAnother={() => {
            setCreatedExamTemplate(null);
            setSelectedQuestionIds([]);
            setApiError(null);
            reset();
          }}
        />

        <GenerateArtifactsModal
          open={generateModalOpen}
          examTemplate={createdExamTemplate}
          onClose={() => setGenerateModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Montagem de prova"
        description="Selecione o conjunto de questões, defina o tipo de identificação das alternativas e prepare o template para geração."
      />

      {apiError ? <Alert tone="danger">{apiError}</Alert> : null}
      {isError ? <Alert tone="danger">{normalizeApiError(error).message}</Alert> : null}

      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Catálogo de questões</h2>
              <p className="mt-1 text-base text-slate-600">
                Monte a prova selecionando as questões já cadastradas no sistema.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-10"
                  placeholder="Buscar por enunciado, tema ou unidade"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <Select value={selectedTopic} onChange={(event) => setSelectedTopic(event.target.value)}>
                <option value="ALL">Todos os temas</option>
                {topicSuggestions.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </Select>

              <Select value={selectedUnit} onChange={(event) => setSelectedUnit(event.target.value)}>
                <option value="ALL">Todas as unidades</option>
                {unitSuggestions.map((unit) => (
                  <option key={unit} value={unit}>
                    {formatQuestionUnit(unit)}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="neutral">{filteredQuestions.length} disponíveis</StatusBadge>
              <StatusBadge tone="info">{selectedQuestionIds.length} selecionadas</StatusBadge>
              <StatusBadge tone="warning">{topicSuggestions.length} temas</StatusBadge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : null}

            {!isLoading &&
              filteredQuestions.map((question) => (
                <div
                  key={question.id}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm transition hover:border-slate-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="font-semibold text-slate-800">{question.statement}</div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge tone="info">{question.topic}</StatusBadge>
                        <StatusBadge tone="warning">
                          {formatQuestionUnit(question.unit)}
                        </StatusBadge>
                        <StatusBadge tone="neutral">
                          {question.options.length} alternativas
                        </StatusBadge>
                        <StatusBadge tone="success">
                          {question.options.filter((option) => option.isCorrect).length} corretas
                        </StatusBadge>
                      </div>
                    </div>

                    <Checkbox
                      checked={selectedQuestionIds.includes(question.id)}
                      onChange={() => toggleQuestion(question)}
                      label="Selecionar"
                    />
                  </div>
                </div>
              ))}

            {!isLoading && filteredQuestions.length === 0 ? (
              <Alert tone="info">Nenhuma questão encontrada com esse filtro.</Alert>
            ) : null}
          </CardContent>
        </Card>

        <Card className="xl:col-span-4 xl:sticky xl:top-28 xl:self-start">
          <form className="flex flex-col" onSubmit={onSubmit}>
            <CardHeader>
              <h2 className="text-2xl font-bold text-slate-800">Resumo da prova</h2>
              <p className="mt-1 text-base text-slate-600">
                Configure o template e mantenha os metadados futuros visíveis sem competir com o fluxo principal.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <Field>
                <FieldLabel htmlFor="exam-title">Título da prova</FieldLabel>
                <Input id="exam-title" placeholder="Ex.: Avaliação Bimestral 2" {...register("title")} />
                {errors.title ? <FieldError>{errors.title.message}</FieldError> : null}
              </Field>

              <Field>
                <FieldLabel>Identificação das alternativas</FieldLabel>
                <RadioGroup
                  name="alternativeIdentificationType"
                  value={watch("alternativeIdentificationType")}
                  onChange={(value) =>
                    setValue("alternativeIdentificationType", value as AlternativeIdentificationType)
                  }
                  options={alternativeOptions}
                />
              </Field>

              <div className="subtle-panel space-y-4 border-dashed p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-highlight" />
                  <div className="font-semibold text-slate-800">Cabeçalho da prova</div>
                  <StatusBadge tone="warning">Em breve</StatusBadge>
                </div>

                <div className="grid gap-4">
                  <Field>
                    <FieldLabel htmlFor="discipline">Disciplina</FieldLabel>
                    <div className="relative">
                      <BookOpenCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input id="discipline" className="pl-10" placeholder="Matemática" {...register("discipline")} />
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="teacher">Professor</FieldLabel>
                    <div className="relative">
                      <GraduationCap className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input id="teacher" className="pl-10" placeholder="Profa. Carla Mendes" {...register("teacher")} />
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="date">Data</FieldLabel>
                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input id="date" type="date" className="pl-10" {...register("date")} />
                    </div>
                  </Field>
                </div>
              </div>

              <div className="subtle-panel px-5 py-5">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Seleção atual
                </div>
                <div className="mt-2 text-3xl font-bold text-slate-800">{selectedQuestionIds.length}</div>
                <div className="mt-1 text-sm text-slate-600">questões adicionadas ao template</div>
                <div className="mt-4 space-y-3">
                  {selectedQuestions.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500 shadow-sm">
                      Nenhuma questão selecionada ainda. Use o catálogo ao lado para montar a prova.
                    </div>
                  ) : null}

                  {selectedQuestions.slice(0, 4).map((question, index) => (
                    <div
                      key={question.id}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm"
                    >
                      <div className="font-semibold text-slate-800">
                        Q{index + 1}. {question.statement}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {question.topic} • {formatQuestionUnit(question.unit)}
                      </div>
                    </div>
                  ))}

                  {selectedQuestions.length > 4 ? (
                    <div className="text-sm text-slate-600">
                      + {selectedQuestions.length - 4} questões adicionais
                    </div>
                  ) : null}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" size="md" fullWidth disabled={isSubmitting}>
                {isSubmitting ? "Criando template..." : "Criar prova"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};
