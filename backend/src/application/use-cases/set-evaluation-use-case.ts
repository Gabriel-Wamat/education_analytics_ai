import { randomUUID } from "node:crypto";

import { Evaluation } from "../../domain/entities/evaluation";
import { EmailDigestEntry } from "../../domain/entities/email-notification";
import { IClassGroupRepository } from "../../domain/repositories/class-group-repository";
import { IEmailDigestRepository } from "../../domain/repositories/email-digest-repository";
import { IEvaluationRepository } from "../../domain/repositories/evaluation-repository";
import { IGoalRepository } from "../../domain/repositories/goal-repository";
import { IStudentRepository } from "../../domain/repositories/student-repository";
import { SetEvaluationInput } from "../dto/evaluation-input";
import { NotFoundError } from "../errors/not-found-error";
import { ValidationError } from "../errors/validation-error";
import { isEvaluationLevel } from "../../domain/entities/evaluation-level";
import { IClock, SystemClock } from "../services/clock";

const formatDigestDate = (date: Date): string => {
  // Bucket diário em UTC para evitar problemas de timezone na fila.
  return date.toISOString().slice(0, 10);
};

export class SetEvaluationUseCase {
  constructor(
    private readonly evaluationRepository: IEvaluationRepository,
    private readonly classGroupRepository: IClassGroupRepository,
    private readonly studentRepository: IStudentRepository,
    private readonly goalRepository: IGoalRepository,
    private readonly emailDigestRepository: IEmailDigestRepository,
    private readonly clock: IClock = new SystemClock()
  ) {}

  async execute(input: SetEvaluationInput): Promise<Evaluation> {
    if (!isEvaluationLevel(input.level)) {
      throw new ValidationError("Nível de avaliação inválido.", [
        "O nível deve ser MANA, MPA ou MA."
      ]);
    }

    const classGroup = await this.classGroupRepository.findById(input.classId);
    if (!classGroup) {
      throw new NotFoundError("Turma não encontrada.");
    }
    if (!classGroup.studentIds.includes(input.studentId)) {
      throw new ValidationError("Aluno não está matriculado nesta turma.");
    }
    if (!classGroup.goalIds.includes(input.goalId)) {
      throw new ValidationError("Meta não pertence a esta turma.");
    }

    const student = await this.studentRepository.findById(input.studentId);
    if (!student) throw new NotFoundError("Aluno não encontrado.");
    const goal = await this.goalRepository.findById(input.goalId);
    if (!goal) throw new NotFoundError("Meta não encontrada.");

    const now = this.clock.now();
    const existing = await this.evaluationRepository.findByClassStudentGoal(
      input.classId,
      input.studentId,
      input.goalId
    );

    const evaluation: Evaluation = existing
      ? {
          ...existing,
          level: input.level,
          updatedAt: now
        }
      : {
          id: randomUUID(),
          classId: input.classId,
          studentId: input.studentId,
          goalId: input.goalId,
          level: input.level,
          createdAt: now,
          updatedAt: now
        };

    const persisted = await this.evaluationRepository.upsert(evaluation);

    const previousLevel = existing?.level ?? null;
    if (previousLevel !== persisted.level) {
      const digestEntry: EmailDigestEntry = {
        id: randomUUID(),
        studentId: persisted.studentId,
        classId: persisted.classId,
        goalId: persisted.goalId,
        previousLevel,
        newLevel: persisted.level,
        changedAt: now,
        digestDate: formatDigestDate(now),
        status: "pending"
      };
      await this.emailDigestRepository.enqueue(digestEntry);
    }

    return persisted;
  }
}
