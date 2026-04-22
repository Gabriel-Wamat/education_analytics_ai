import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldHint, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { normalizeApiError } from "@/services/http/error";
import { ClassGroup, Goal, Student } from "@/types/api";

import { useCreateClassGroup, useUpdateClassGroup } from "./hooks";

const classSchema = z.object({
  topic: z.string().trim().min(1, "Informe o tema da turma."),
  year: z.coerce.number().int().min(2000, "Ano inválido.").max(2100, "Ano inválido."),
  semester: z.coerce.number().int().refine((value) => value === 1 || value === 2, {
    message: "Selecione 1 ou 2."
  }),
  studentIds: z.array(z.string()).default([]),
  goalIds: z.array(z.string()).default([])
});

type ClassFormValuesInternal = z.infer<typeof classSchema>;

const currentYear = new Date().getFullYear();

const defaultValues: ClassFormValuesInternal = {
  topic: "",
  year: currentYear,
  semester: 1,
  studentIds: [],
  goalIds: []
};

interface ClassFormModalProps {
  open: boolean;
  initialClass?: ClassGroup | null;
  students: Student[];
  goals: Goal[];
  onClose: () => void;
}

export const ClassFormModal = ({
  open,
  initialClass,
  students,
  goals,
  onClose
}: ClassFormModalProps) => {
  const createClassMutation = useCreateClassGroup();
  const updateClassMutation = useUpdateClassGroup();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting }
  } = useForm<ClassFormValuesInternal>({
    resolver: zodResolver(classSchema),
    defaultValues
  });

  useEffect(() => {
    if (!open) return;
    setApiError(null);
    if (initialClass) {
      reset({
        topic: initialClass.topic,
        year: initialClass.year,
        semester: initialClass.semester,
        studentIds: [...initialClass.studentIds],
        goalIds: [...initialClass.goalIds]
      });
    } else {
      reset(defaultValues);
    }
  }, [open, initialClass, reset]);

  const sortedStudents = useMemo(
    () => [...students].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [students]
  );
  const sortedGoals = useMemo(
    () => [...goals].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [goals]
  );

  const onSubmit = async (values: ClassFormValuesInternal) => {
    setApiError(null);
    const payload = {
      topic: values.topic,
      year: values.year,
      semester: values.semester as 1 | 2,
      studentIds: values.studentIds,
      goalIds: values.goalIds
    };
    try {
      if (initialClass) {
        await updateClassMutation.mutateAsync({ id: initialClass.id, payload });
      } else {
        await createClassMutation.mutateAsync(payload);
      }
      onClose();
    } catch (error) {
      setApiError(normalizeApiError(error).message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialClass ? "Editar turma" : "Nova turma"}
      description="Defina tema, ano/semestre e selecione os alunos e metas da turma."
      className="max-w-3xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {apiError ? <Alert tone="danger">{apiError}</Alert> : null}

        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_120px_140px]">
          <Field>
            <FieldLabel htmlFor="class-topic">Tema</FieldLabel>
            <Input id="class-topic" placeholder="Ex: Alfabetização" {...register("topic")} />
            {errors.topic ? <FieldError>{errors.topic.message}</FieldError> : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="class-year">Ano</FieldLabel>
            <Input id="class-year" type="number" min={2000} max={2100} {...register("year")} />
            {errors.year ? <FieldError>{errors.year.message}</FieldError> : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="class-semester">Semestre</FieldLabel>
            <Select id="class-semester" {...register("semester")}>
              <option value={1}>1º semestre</option>
              <option value={2}>2º semestre</option>
            </Select>
            {errors.semester ? <FieldError>{errors.semester.message}</FieldError> : null}
          </Field>
        </div>

        <Field>
          <FieldLabel>Alunos da turma</FieldLabel>
          <FieldHint>
            {sortedStudents.length === 0
              ? "Cadastre alunos antes para poder associá-los à turma."
              : "Selecione os alunos que participarão desta turma."}
          </FieldHint>
          <Controller
            control={control}
            name="studentIds"
            render={({ field }) => (
              <div className="max-h-60 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2">
                {sortedStudents.map((student) => {
                  const checked = field.value.includes(student.id);
                  return (
                    <Checkbox
                      key={student.id}
                      checked={checked}
                      label={student.name}
                      description={student.email}
                      onChange={(event) => {
                        if (event.target.checked) {
                          field.onChange([...field.value, student.id]);
                        } else {
                          field.onChange(field.value.filter((id) => id !== student.id));
                        }
                      }}
                    />
                  );
                })}
              </div>
            )}
          />
          {errors.studentIds ? <FieldError>{errors.studentIds.message as string}</FieldError> : null}
        </Field>

        <Field>
          <FieldLabel>Metas da turma</FieldLabel>
          <FieldHint>
            {sortedGoals.length === 0
              ? "Cadastre metas antes para avaliar o progresso da turma."
              : "Selecione as metas que serão avaliadas ao longo do semestre."}
          </FieldHint>
          <Controller
            control={control}
            name="goalIds"
            render={({ field }) => (
              <div className="max-h-60 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2">
                {sortedGoals.map((goal) => {
                  const checked = field.value.includes(goal.id);
                  return (
                    <Checkbox
                      key={goal.id}
                      checked={checked}
                      label={goal.name}
                      description={goal.description}
                      onChange={(event) => {
                        if (event.target.checked) {
                          field.onChange([...field.value, goal.id]);
                        } else {
                          field.onChange(field.value.filter((id) => id !== goal.id));
                        }
                      }}
                    />
                  );
                })}
              </div>
            )}
          />
          {errors.goalIds ? <FieldError>{errors.goalIds.message as string}</FieldError> : null}
        </Field>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {initialClass ? "Salvar alterações" : "Cadastrar turma"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
