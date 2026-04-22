import { Pencil, Plus, Target, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

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
import { PageHeader } from "@/components/layout/page-header";
import { GoalFormModal } from "@/features/goals/goal-form-modal";
import { useDeleteGoal, useGoals } from "@/features/goals/hooks";
import { normalizeApiError } from "@/services/http/error";
import { Goal } from "@/types/api";

export const GoalsPage = () => {
  const { data: goals = [], isLoading, isError, error } = useGoals();
  const deleteGoalMutation = useDeleteGoal();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return goals;
    return goals.filter((goal) =>
      [goal.name, goal.description ?? ""].join(" ").toLowerCase().includes(term)
    );
  }, [goals, search]);

  const handleDelete = async () => {
    if (!goalToDelete) return;
    setDeleteError(null);
    try {
      await deleteGoalMutation.mutateAsync(goalToDelete.id);
      setGoalToDelete(null);
    } catch (mutationError) {
      setDeleteError(normalizeApiError(mutationError).message);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Metas pedagógicas"
        description="Cadastre as metas (competências) que serão avaliadas pelas turmas ao longo do semestre."
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setEditingGoal(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nova meta
          </Button>
        }
      />

      <div className="surface p-6">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <Input
            placeholder="Buscar por nome ou descrição"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Button variant="ghost" onClick={() => setSearch("")}>Limpar busca</Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge tone="neutral">{filtered.length} visíveis</StatusBadge>
          <StatusBadge tone="info">{goals.length} cadastradas</StatusBadge>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {isError ? <Alert tone="danger">{normalizeApiError(error).message}</Alert> : null}

      {!isLoading && !isError && filtered.length === 0 ? (
        <EmptyState
          icon={<Target className="h-8 w-8" />}
          title="Nenhuma meta encontrada"
          description="Cadastre metas para organizar as competências acompanhadas nas turmas."
          action={
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setEditingGoal(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Cadastrar meta
            </Button>
          }
        />
      ) : null}

      {!isLoading && !isError && filtered.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Nome</TableHeaderCell>
              <TableHeaderCell>Descrição</TableHeaderCell>
              <TableHeaderCell className="text-right">Ações</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((goal) => (
              <TableRow key={goal.id}>
                <TableCell className="font-semibold text-slate-800">{goal.name}</TableCell>
                <TableCell className="text-slate-600">{goal.description ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingGoal(goal);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setGoalToDelete(goal)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}

      <GoalFormModal
        open={formOpen}
        initialGoal={editingGoal}
        onClose={() => {
          setEditingGoal(null);
          setFormOpen(false);
        }}
      />

      <Modal
        open={Boolean(goalToDelete)}
        onClose={() => {
          setGoalToDelete(null);
          setDeleteError(null);
        }}
        title="Excluir meta"
        description="Essa operação remove a meta de todas as turmas que a utilizam e apaga as avaliações associadas."
        className="max-w-xl"
      >
        <div className="space-y-5">
          {deleteError ? <Alert tone="danger">{deleteError}</Alert> : null}
          <p className="text-sm text-slate-600">
            Tem certeza de que deseja excluir a meta <strong>{goalToDelete?.name}</strong>?
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setGoalToDelete(null);
                setDeleteError(null);
              }}
              disabled={deleteGoalMutation.isPending}
            >
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleteGoalMutation.isPending}>
              Excluir meta
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
