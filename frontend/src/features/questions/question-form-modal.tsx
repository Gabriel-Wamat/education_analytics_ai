import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { MinusCircle, PlusCircle } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldHint, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { normalizeApiError } from "@/services/http/error";
import { Question } from "@/types/api";
import { QuestionFormValues } from "@/types/ui";
import { buildQuestionUnits, DEFAULT_QUESTION_UNITS, formatQuestionUnit } from "./metadata";
import {
  toQuestionFormValues,
  useCreateQuestion,
  useUpdateQuestion
} from "./hooks";

const questionFormSchema = z.object({
  topic: z.string().trim().min(1, "Informe o tema da questão."),
  unit: z.coerce.number().int().min(1, "Selecione uma unidade válida."),
  statement: z.string().trim().min(1, "Informe o enunciado da questão."),
  options: z
    .array(
      z.object({
        description: z.string().trim().min(1, "Informe a descrição da alternativa."),
        isCorrect: z.boolean()
      })
    )
    .min(2, "Adicione pelo menos duas alternativas.")
}).superRefine((value, context) => {
  if (!value.options.some((option) => option.isCorrect)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Selecione pelo menos uma alternativa correta.",
      path: ["options"]
    });
  }
});

const defaultValues: QuestionFormValues = {
  topic: "",
  unit: 1,
  statement: "",
  options: [
    { description: "", isCorrect: false },
    { description: "", isCorrect: false }
  ]
};

interface QuestionFormModalProps {
  open: boolean;
  initialQuestion?: Question | null;
  onClose: () => void;
  existingTopics?: string[];
  availableUnits?: number[];
}

export const QuestionFormModal = ({
  open,
  initialQuestion,
  onClose,
  existingTopics = [],
  availableUnits = DEFAULT_QUESTION_UNITS
}: QuestionFormModalProps) => {
  const createQuestionMutation = useCreateQuestion();
  const updateQuestionMutation = useUpdateQuestion();
  const [apiError, setApiError] = useState<string | null>(null);
  const [unitOptions, setUnitOptions] = useState<number[]>(
    buildQuestionUnits([], availableUnits)
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options"
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    setUnitOptions(
      buildQuestionUnits(
        initialQuestion ? [initialQuestion] : [],
        initialQuestion ? [...availableUnits, initialQuestion.unit] : availableUnits
      )
    );
    reset(initialQuestion ? toQuestionFormValues(initialQuestion) : defaultValues);
    setApiError(null);
  }, [availableUnits, initialQuestion, open, reset]);

  const title = useMemo(
    () => (initialQuestion ? "Editar questão" : "Nova questão"),
    [initialQuestion]
  );

  const handleAddUnit = () => {
    const nextUnit = (unitOptions.at(-1) ?? DEFAULT_QUESTION_UNITS.at(-1) ?? 3) + 1;

    setUnitOptions((current) => [...current, nextUnit]);
    setValue("unit", nextUnit, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
  };

  const onSubmit = handleSubmit(async (values) => {
    setApiError(null);

    try {
      if (initialQuestion) {
        await updateQuestionMutation.mutateAsync({
          questionId: initialQuestion.id,
          payload: values
        });
      } else {
        await createQuestionMutation.mutateAsync(values);
      }

      onClose();
    } catch (error) {
      setApiError(normalizeApiError(error).message);
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description="Mantenha a redação clara e marque quais alternativas devem ser selecionadas pelo aluno."
    >
      <form className="space-y-6" onSubmit={onSubmit}>
        {apiError ? <Alert tone="danger">{apiError}</Alert> : null}

        <Field>
          <FieldLabel htmlFor="question-topic">Tema (target)</FieldLabel>
          <Input
            id="question-topic"
            list="question-topic-suggestions"
            placeholder="Ex.: Frações, Geometria, Revolução Francesa"
            {...register("topic")}
          />
          <datalist id="question-topic-suggestions">
            {existingTopics.map((topic) => (
              <option key={topic} value={topic} />
            ))}
          </datalist>
          <FieldHint>
            Digite um novo tema ou reaproveite um já cadastrado para padronizar o banco de
            questões.
          </FieldHint>
          {errors.topic ? <FieldError>{errors.topic.message}</FieldError> : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="question-unit">Unidade</FieldLabel>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center">
            <Select
              id="question-unit"
              {...register("unit", {
                setValueAs: (value) => Number(value)
              })}
            >
              {unitOptions.map((unit) => (
                <option key={unit} value={unit}>
                  {formatQuestionUnit(unit)}
                </option>
              ))}
            </Select>

            <Button
              variant="secondary"
              size="md"
              className="w-full justify-center whitespace-nowrap"
              onClick={handleAddUnit}
            >
              <PlusCircle className="h-4 w-4" />
              Adicionar unidade
            </Button>
          </div>
          <FieldHint>
            Comece com as unidades 1, 2 e 3 e expanda quando o conteúdo evoluir.
          </FieldHint>
          {errors.unit ? <FieldError>{errors.unit.message}</FieldError> : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="question-statement">Enunciado</FieldLabel>
          <Textarea
            id="question-statement"
            placeholder="Ex.: Quais afirmações estão corretas sobre o tema?"
            {...register("statement")}
          />
          {errors.statement ? <FieldError>{errors.statement.message}</FieldError> : null}
        </Field>

        <div className="space-y-4">
          <div className="subtle-panel flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <FieldLabel>Alternativas</FieldLabel>
              <FieldHint>
                É possível ter mais de uma alternativa correta quando a questão exigir múltiplas marcações.
              </FieldHint>
            </div>
            <Button
              variant="secondary"
              size="md"
              className="w-full justify-center whitespace-nowrap sm:w-auto sm:min-w-[220px]"
              onClick={() => append({ description: "", isCorrect: false })}
            >
              <PlusCircle className="h-4 w-4" />
              Adicionar alternativa
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="subtle-panel p-4"
              >
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_auto] md:items-start">
                  <Field>
                    <FieldLabel htmlFor={`option-${field.id}`}>Descrição</FieldLabel>
                    <Input
                      id={`option-${field.id}`}
                      placeholder={`Alternativa ${index + 1}`}
                      {...register(`options.${index}.description`)}
                    />
                    {errors.options?.[index]?.description ? (
                      <FieldError>{errors.options[index]?.description?.message}</FieldError>
                    ) : null}
                  </Field>

                  <Field className="pt-7">
                    <Checkbox
                      label="Alternativa correta"
                      {...register(`options.${index}.isCorrect`)}
                    />
                  </Field>

                  <div className="pt-7">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 2}
                    >
                      <MinusCircle className="h-4 w-4" />
                      Remover
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {errors.options?.message ? <FieldError>{errors.options.message}</FieldError> : null}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="md" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : initialQuestion ? "Salvar alterações" : "Criar questão"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
