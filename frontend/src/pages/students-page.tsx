import { Pencil, Plus, Trash2, UserPlus, UsersRound } from "lucide-react";
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
import { StudentFormModal } from "@/features/students/student-form-modal";
import { useDeleteStudent, useStudents } from "@/features/students/hooks";
import { normalizeApiError } from "@/services/http/error";
import { Student } from "@/types/api";

const formatCpfMask = (raw: string): string => {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 11) return raw;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

export const StudentsPage = () => {
  const { data: students = [], isLoading, isError, error } = useStudents();
  const deleteStudentMutation = useDeleteStudent();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return students;
    return students.filter((student) =>
      [student.name, student.email, student.cpf]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [students, search]);

  const handleDelete = async () => {
    if (!studentToDelete) return;
    setDeleteError(null);
    try {
      await deleteStudentMutation.mutateAsync(studentToDelete.id);
      setStudentToDelete(null);
    } catch (mutationError) {
      setDeleteError(normalizeApiError(mutationError).message);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Alunos"
        description="Cadastre, revise e mantenha atualizado o cadastro dos alunos acompanhados pelas turmas."
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setEditingStudent(null);
              setFormOpen(true);
            }}
          >
            <UserPlus className="h-4 w-4" />
            Novo aluno
          </Button>
        }
      />

      <div className="surface p-6">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <Input
            placeholder="Buscar por nome, CPF ou e-mail"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Button variant="ghost" onClick={() => setSearch("")}>Limpar busca</Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge tone="neutral">{filtered.length} visíveis</StatusBadge>
          <StatusBadge tone="info">{students.length} cadastrados</StatusBadge>
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
          icon={<UsersRound className="h-8 w-8" />}
          title="Nenhum aluno encontrado"
          description="Comece cadastrando novos alunos ou ajuste a busca para visualizar o cadastro completo."
          action={
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setEditingStudent(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Cadastrar aluno
            </Button>
          }
        />
      ) : null}

      {!isLoading && !isError && filtered.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Nome</TableHeaderCell>
              <TableHeaderCell>CPF</TableHeaderCell>
              <TableHeaderCell>E-mail</TableHeaderCell>
              <TableHeaderCell className="text-right">Ações</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-semibold text-slate-800">{student.name}</TableCell>
                <TableCell>{formatCpfMask(student.cpf)}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingStudent(student);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setStudentToDelete(student)}
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

      <StudentFormModal
        open={formOpen}
        initialStudent={editingStudent}
        onClose={() => {
          setEditingStudent(null);
          setFormOpen(false);
        }}
      />

      <Modal
        open={Boolean(studentToDelete)}
        onClose={() => {
          setStudentToDelete(null);
          setDeleteError(null);
        }}
        title="Excluir aluno"
        description="Essa operação remove o aluno do cadastro e de todas as turmas em que esteja matriculado. Avaliações existentes também serão removidas."
        className="max-w-xl"
      >
        <div className="space-y-5">
          {deleteError ? <Alert tone="danger">{deleteError}</Alert> : null}
          <p className="text-sm text-slate-600">
            Tem certeza de que deseja excluir o aluno <strong>{studentToDelete?.name}</strong>?
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setStudentToDelete(null);
                setDeleteError(null);
              }}
              disabled={deleteStudentMutation.isPending}
            >
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleteStudentMutation.isPending}>
              Excluir aluno
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
