import { BookOpenCheck, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Alert } from "@/components/ui/alert";
import { Button, getButtonClassName } from "@/components/ui/button";
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
import { ClassFormModal } from "@/features/classes/class-form-modal";
import { useClassGroups, useDeleteClassGroup } from "@/features/classes/hooks";
import { useGoals } from "@/features/goals/hooks";
import { useStudents } from "@/features/students/hooks";
import { normalizeApiError } from "@/services/http/error";
import { ClassGroup } from "@/types/api";

export const ClassesPage = () => {
  const { data: classes = [], isLoading, isError, error } = useClassGroups();
  const { data: students = [] } = useStudents();
  const { data: goals = [] } = useGoals();
  const deleteClassMutation = useDeleteClassGroup();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassGroup | null>(null);
  const [classToDelete, setClassToDelete] = useState<ClassGroup | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return classes;
    return classes.filter((classGroup) =>
      [classGroup.topic, String(classGroup.year), `${classGroup.semester}º`]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [classes, search]);

  const handleDelete = async () => {
    if (!classToDelete) return;
    setDeleteError(null);
    try {
      await deleteClassMutation.mutateAsync(classToDelete.id);
      setClassToDelete(null);
    } catch (mutationError) {
      setDeleteError(normalizeApiError(mutationError).message);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Turmas"
        description="Organize turmas por tema, ano e semestre, associando alunos e metas para acompanhar o progresso pedagógico."
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setEditingClass(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nova turma
          </Button>
        }
      />

      <div className="surface p-6">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <Input
            placeholder="Buscar por tema, ano ou semestre"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Button variant="ghost" onClick={() => setSearch("")}>Limpar busca</Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge tone="neutral">{filtered.length} visíveis</StatusBadge>
          <StatusBadge tone="info">{classes.length} turmas</StatusBadge>
          <StatusBadge tone="success">{students.length} alunos cadastrados</StatusBadge>
          <StatusBadge tone="warning">{goals.length} metas disponíveis</StatusBadge>
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
          icon={<BookOpenCheck className="h-8 w-8" />}
          title="Nenhuma turma encontrada"
          description="Crie a primeira turma para começar a acompanhar avaliações por aluno e meta."
          action={
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setEditingClass(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Cadastrar turma
            </Button>
          }
        />
      ) : null}

      {!isLoading && !isError && filtered.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Tema</TableHeaderCell>
              <TableHeaderCell>Ano</TableHeaderCell>
              <TableHeaderCell>Semestre</TableHeaderCell>
              <TableHeaderCell>Alunos</TableHeaderCell>
              <TableHeaderCell>Metas</TableHeaderCell>
              <TableHeaderCell className="text-right">Ações</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((classGroup) => (
              <TableRow key={classGroup.id}>
                <TableCell className="font-semibold text-slate-800">
                  <Link to={`/classes/${classGroup.id}`} className="text-mid-blue hover:underline">
                    {classGroup.topic}
                  </Link>
                </TableCell>
                <TableCell>{classGroup.year}</TableCell>
                <TableCell>{classGroup.semester}º semestre</TableCell>
                <TableCell>{classGroup.studentIds.length}</TableCell>
                <TableCell>{classGroup.goalIds.length}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      to={`/classes/${classGroup.id}`}
                      className={getButtonClassName({ variant: "secondary", size: "sm" })}
                    >
                      Ver avaliações
                    </Link>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingClass(classGroup);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setClassToDelete(classGroup)}
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

      <ClassFormModal
        open={formOpen}
        initialClass={editingClass}
        students={students}
        goals={goals}
        onClose={() => {
          setEditingClass(null);
          setFormOpen(false);
        }}
      />

      <Modal
        open={Boolean(classToDelete)}
        onClose={() => {
          setClassToDelete(null);
          setDeleteError(null);
        }}
        title="Excluir turma"
        description="Essa operação remove a turma e todas as suas avaliações. Alunos e metas permanecem cadastrados."
        className="max-w-xl"
      >
        <div className="space-y-5">
          {deleteError ? <Alert tone="danger">{deleteError}</Alert> : null}
          <p className="text-sm text-slate-600">
            Tem certeza de que deseja excluir a turma <strong>{classToDelete?.topic}</strong> ({classToDelete?.year}/{classToDelete?.semester})?
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setClassToDelete(null);
                setDeleteError(null);
              }}
              disabled={deleteClassMutation.isPending}
            >
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleteClassMutation.isPending}>
              Excluir turma
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
