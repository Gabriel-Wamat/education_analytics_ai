import { z } from "zod";

export const sendManualEmailBodySchema = z
  .object({
    scope: z.enum(["STUDENT", "CLASS"], {
      required_error: "Informe se o envio será para um aluno ou uma turma."
    }),
    studentId: z.string().uuid("O ID do aluno precisa ser um UUID válido.").optional(),
    classId: z.string().uuid("O ID da turma precisa ser um UUID válido.").optional(),
    subject: z.string().trim().min(1, "O assunto do e-mail é obrigatório."),
    text: z.string().trim().min(1, "O corpo do e-mail é obrigatório.")
  })
  .superRefine((value, context) => {
    if (value.scope === "STUDENT" && !value.studentId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["studentId"],
        message: "Informe o aluno que receberá o e-mail."
      });
    }

    if (value.scope === "CLASS" && !value.classId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["classId"],
        message: "Informe a turma que receberá o e-mail."
      });
    }
  });
