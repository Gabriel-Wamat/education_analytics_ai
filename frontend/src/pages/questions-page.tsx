import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { normalizeApiError } from "@/services/http/error";
import { Question } from "@/types/api";
import { QuestionFormModal } from "@/features/questions/question-form-modal";
import { QuestionsTable } from "@/features/questions/questions-table";
import { useDeleteQuestion, useQuestions } from "@/features/questions/hooks";
import {
  buildQuestionTopics,
  buildQuestionUnits,
  matchesQuestionSearch
} from "@/features/questions/metadata";

export const QuestionsPage = () => {
  const { data: questions = [], isLoading, isError, error } = useQuestions();
  const deleteQuestionMutation = useDeleteQuestion();
  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("ALL");
  const [selectedUnit, setSelectedUnit] = useState("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filteredQuestions = useMemo(
    () =>
      questions.filter((question) => {
        const matchesSearch = matchesQuestionSearch(question, search);
        const matchesTopic = selectedTopic === "ALL" || question.topic === selectedTopic;
        const matchesUnit =
          selectedUnit === "ALL" || question.unit === Number(selectedUnit);

        return matchesSearch && matchesTopic && matchesUnit;
      }),
    [questions, search, selectedTopic, selectedUnit]
  );
  const topicSuggestions = useMemo(() => buildQuestionTopics(questions), [questions]);
  const availableUnits = useMemo(() => buildQuestionUnits(questions), [questions]);

  const handleDelete = async () => {
    if (!questionToDelete) {
      return;
    }

    setDeleteError(null);

    try {
      await deleteQuestionMutation.mutateAsync(questionToDelete.id);
      setQuestionToDelete(null);
    } catch (mutationError) {
      setDeleteError(normalizeApiError(mutationError).message);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Banco de questões"
        description="Cadastre, revise e mantenha o repertório de questões fechadas usado na criação das provas."
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setEditingQuestion(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nova questão
          </Button>
        }
      />

      <div className="surface p-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px_200px_auto] xl:items-end">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-10"
              placeholder="Buscar por enunciado, tema ou unidade"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Tema</label>
            <Select
              value={selectedTopic}
              onChange={(event) => setSelectedTopic(event.target.value)}
            >
              <option value="ALL">Todos os temas</option>
              {topicSuggestions.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Unidade</label>
            <Select
              value={selectedUnit}
              onChange={(event) => setSelectedUnit(event.target.value)}
            >
              <option value="ALL">Todas as unidades</option>
              {availableUnits.map((unit) => (
                <option key={unit} value={unit}>
                  Unidade {unit}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => {
                setSearch("");
                setSelectedTopic("ALL");
                setSelectedUnit("ALL");
              }}
            >
              Limpar filtros
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge tone="neutral">{filteredQuestions.length} visíveis</StatusBadge>
          <StatusBadge tone="info">{topicSuggestions.length} temas mapeados</StatusBadge>
          <StatusBadge tone="warning">{availableUnits.length} unidades disponíveis</StatusBadge>
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

      {!isLoading && !isError && filteredQuestions.length === 0 ? (
        <EmptyState
          icon={<Plus className="h-8 w-8" />}
          title="Nenhuma questão encontrada"
          description="Comece cadastrando novas questões ou ajuste a busca para visualizar o catálogo completo."
          action={
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setEditingQuestion(null);
                setFormOpen(true);
              }}
            >
              Criar primeira questão
            </Button>
          }
        />
      ) : null}

      {!isLoading && !isError && filteredQuestions.length > 0 ? (
        <QuestionsTable
          questions={filteredQuestions}
          onEdit={(question) => {
            setEditingQuestion(question);
            setFormOpen(true);
          }}
          onDelete={(question) => setQuestionToDelete(question)}
        />
      ) : null}

      <QuestionFormModal
        open={formOpen}
        initialQuestion={editingQuestion}
        existingTopics={topicSuggestions}
        availableUnits={availableUnits}
        onClose={() => {
          setEditingQuestion(null);
          setFormOpen(false);
        }}
      />

      <Modal
        open={Boolean(questionToDelete)}
        onClose={() => {
          setQuestionToDelete(null);
          setDeleteError(null);
        }}
        title="Excluir questão"
        description="Essa operação remove a questão do catálogo. Provas antigas mantêm seus snapshots, mas a questão deixará de estar disponível para novas montagens."
        className="max-w-xl"
      >
        <div className="space-y-5">
          {deleteError ? <Alert tone="danger">{deleteError}</Alert> : null}
          <p className="text-sm text-slate-600">
            Tem certeza de que deseja excluir a questão <strong>{questionToDelete?.statement}</strong>?
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setQuestionToDelete(null);
                setDeleteError(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleteQuestionMutation.isPending}
            >
              {deleteQuestionMutation.isPending ? "Excluindo..." : "Confirmar exclusão"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
