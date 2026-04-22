import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldHint, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { normalizeApiError } from "@/services/http/error";
import { Student } from "@/types/api";

import { useCreateStudent, useUpdateStudent } from "./hooks";

const cpfRegex = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;

const studentSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do aluno."),
  cpf: z
    .string()
    .trim()
    .min(1, "Informe o CPF.")
    .regex(cpfRegex, "Informe um CPF válido (11 dígitos)."),
  email: z.string().trim().email("Informe um e-mail válido.")
});

type StudentFormValues = z.infer<typeof studentSchema>;

const defaultValues: StudentFormValues = { name: "", cpf: "", email: "" };

interface StudentFormModalProps {
  open: boolean;
  initialStudent?: Student | null;
  onClose: () => void;
}

export const StudentFormModal = ({ open, initialStudent, onClose }: StudentFormModalProps) => {
  const createStudentMutation = useCreateStudent();
  const updateStudentMutation = useUpdateStudent();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues
  });

  useEffect(() => {
    if (!open) return;
    setApiError(null);
    if (initialStudent) {
      reset({ name: initialStudent.name, cpf: initialStudent.cpf, email: initialStudent.email });
    } else {
      reset(defaultValues);
    }
  }, [open, initialStudent, reset]);

  const onSubmit = async (values: StudentFormValues) => {
    setApiError(null);
    try {
      if (initialStudent) {
        await updateStudentMutation.mutateAsync({ id: initialStudent.id, payload: values });
      } else {
        await createStudentMutation.mutateAsync(values);
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
      title={initialStudent ? "Editar aluno" : "Novo aluno"}
      description="Preencha os dados do aluno. O CPF deve ser válido e o e-mail será usado para notificações diárias."
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {apiError ? <Alert tone="danger">{apiError}</Alert> : null}

        <Field>
          <FieldLabel htmlFor="student-name">Nome completo</FieldLabel>
          <Input id="student-name" placeholder="Ex: Ana Souza" {...register("name")} />
          {errors.name ? <FieldError>{errors.name.message}</FieldError> : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="student-cpf">CPF</FieldLabel>
          <Input id="student-cpf" placeholder="000.000.000-00" {...register("cpf")} />
          <FieldHint>Aceita os formatos 00000000000 ou 000.000.000-00.</FieldHint>
          {errors.cpf ? <FieldError>{errors.cpf.message}</FieldError> : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="student-email">E-mail</FieldLabel>
          <Input id="student-email" type="email" placeholder="aluno@exemplo.com" {...register("email")} />
          {errors.email ? <FieldError>{errors.email.message}</FieldError> : null}
        </Field>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {initialStudent ? "Salvar alterações" : "Cadastrar aluno"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
