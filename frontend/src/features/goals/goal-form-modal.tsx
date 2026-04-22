import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { normalizeApiError } from "@/services/http/error";
import { Goal } from "@/types/api";

import { useCreateGoal, useUpdateGoal } from "./hooks";

const goalSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da meta."),
  description: z.string().trim().optional()
});

type GoalFormValues = z.infer<typeof goalSchema>;

const defaultValues: GoalFormValues = { name: "", description: "" };

interface GoalFormModalProps {
  open: boolean;
  initialGoal?: Goal | null;
  onClose: () => void;
}

export const GoalFormModal = ({ open, initialGoal, onClose }: GoalFormModalProps) => {
  const createGoalMutation = useCreateGoal();
  const updateGoalMutation = useUpdateGoal();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues
  });

  useEffect(() => {
    if (!open) return;
    setApiError(null);
    if (initialGoal) {
      reset({ name: initialGoal.name, description: initialGoal.description ?? "" });
    } else {
      reset(defaultValues);
    }
  }, [open, initialGoal, reset]);

  const onSubmit = async (values: GoalFormValues) => {
    setApiError(null);
    const payload = {
      name: values.name,
      description: values.description && values.description.trim().length > 0
        ? values.description.trim()
        : undefined
    };
    try {
      if (initialGoal) {
        await updateGoalMutation.mutateAsync({ id: initialGoal.id, payload });
      } else {
        await createGoalMutation.mutateAsync(payload);
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
      title={initialGoal ? "Editar meta" : "Nova meta"}
      description="Metas representam competências ou objetivos pedagógicos avaliados por turma."
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {apiError ? <Alert tone="danger">{apiError}</Alert> : null}

        <Field>
          <FieldLabel htmlFor="goal-name">Nome da meta</FieldLabel>
          <Input id="goal-name" placeholder="Ex: Ler textos curtos com fluência" {...register("name")} />
          {errors.name ? <FieldError>{errors.name.message}</FieldError> : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="goal-description">Descrição (opcional)</FieldLabel>
          <Textarea
            id="goal-description"
            placeholder="Detalhe o que o aluno precisa demonstrar para atingir esta meta."
            {...register("description")}
          />
          {errors.description ? <FieldError>{errors.description.message}</FieldError> : null}
        </Field>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {initialGoal ? "Salvar alterações" : "Cadastrar meta"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
