import { ClassGroup } from "../../domain/entities/class-group";
import { EmailLog } from "../../domain/entities/email-log";
import { Evaluation } from "../../domain/entities/evaluation";
import { EvaluationLevel } from "../../domain/entities/evaluation-level";
import { Goal } from "../../domain/entities/goal";
import { Student } from "../../domain/entities/student";
import { IClassGroupRepository } from "../../domain/repositories/class-group-repository";
import { IEmailLogRepository } from "../../domain/repositories/email-log-repository";
import { IEvaluationRepository } from "../../domain/repositories/evaluation-repository";
import { IGoalRepository } from "../../domain/repositories/goal-repository";
import { IStudentRepository } from "../../domain/repositories/student-repository";
import { NotFoundError } from "../errors/not-found-error";

const LEVEL_SCORE: Record<EvaluationLevel, number> = {
  MANA: 0,
  MPA: 0.5,
  MA: 1
};

export interface StudentProfileClassSummary {
  id: string;
  topic: string;
  year: number;
  semester: 1 | 2;
  goalCount: number;
  evaluationCount: number;
}

export interface StudentProfileEvaluationItem {
  id: string;
  classId: string;
  classLabel: string;
  goalId: string;
  goalName: string;
  level: EvaluationLevel;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentProfileTimelinePoint {
  label: string;
  date: string;
  averageScore: number;
  attainmentPercentage: number;
  evaluatedGoals: number;
}

export interface StudentProfileEmailLogItem {
  id: string;
  subject: string;
  digestDate: string;
  status: EmailLog["status"];
  attemptedAt: Date;
  entriesCount: number;
}

export interface StudentProfileResponse {
  student: Student;
  summary: {
    totalClasses: number;
    totalGoals: number;
    totalEvaluations: number;
    manaCount: number;
    mpaCount: number;
    maCount: number;
    attainmentPercentage: number;
  };
  classes: StudentProfileClassSummary[];
  evaluations: StudentProfileEvaluationItem[];
  timeline: StudentProfileTimelinePoint[];
  emailLogs: StudentProfileEmailLogItem[];
}

const buildClassLabel = (classGroup: ClassGroup): string =>
  `${classGroup.topic} · ${classGroup.year}/${classGroup.semester}º semestre`;

const buildTimeline = (evaluations: StudentProfileEvaluationItem[]): StudentProfileTimelinePoint[] => {
  const sorted = [...evaluations].sort(
    (left, right) => left.updatedAt.getTime() - right.updatedAt.getTime()
  );
  const cumulativeScores: number[] = [];

  return sorted.map((evaluation, index) => {
    cumulativeScores.push(evaluation.score);
    const sum = cumulativeScores.reduce((accumulator, current) => accumulator + current, 0);
    const averageScore = sum / cumulativeScores.length;
    const attainmentPercentage = Math.round(averageScore * 100);

    return {
      label: `${index + 1}ª meta`,
      date: evaluation.updatedAt.toISOString(),
      averageScore: Number(averageScore.toFixed(2)),
      attainmentPercentage,
      evaluatedGoals: cumulativeScores.length
    };
  });
};

export class GetStudentProfileUseCase {
  constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly classGroupRepository: IClassGroupRepository,
    private readonly evaluationRepository: IEvaluationRepository,
    private readonly goalRepository: IGoalRepository,
    private readonly emailLogRepository: IEmailLogRepository
  ) {}

  async execute(studentId: string): Promise<StudentProfileResponse> {
    const student = await this.studentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError("Aluno não encontrado.");
    }

    const [classes, evaluations, goals, emailLogs] = await Promise.all([
      this.classGroupRepository.findByStudentId(studentId),
      this.evaluationRepository.findByStudentId(studentId),
      this.goalRepository.findAll(),
      this.emailLogRepository.findAll()
    ]);

    const goalsById = new Map(goals.map((goal) => [goal.id, goal]));
    const classesById = new Map(classes.map((classGroup) => [classGroup.id, classGroup]));

    const evaluationItems = evaluations
      .map<StudentProfileEvaluationItem | null>((evaluation) => {
        const classGroup = classesById.get(evaluation.classId);
        const goal = goalsById.get(evaluation.goalId);

        if (!classGroup || !goal) {
          return null;
        }

        return {
          id: evaluation.id,
          classId: classGroup.id,
          classLabel: buildClassLabel(classGroup),
          goalId: goal.id,
          goalName: goal.name,
          level: evaluation.level,
          score: LEVEL_SCORE[evaluation.level],
          createdAt: evaluation.createdAt,
          updatedAt: evaluation.updatedAt
        };
      })
      .filter((value): value is StudentProfileEvaluationItem => Boolean(value))
      .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime());

    const manaCount = evaluationItems.filter((evaluation) => evaluation.level === "MANA").length;
    const mpaCount = evaluationItems.filter((evaluation) => evaluation.level === "MPA").length;
    const maCount = evaluationItems.filter((evaluation) => evaluation.level === "MA").length;
    const totalEvaluations = evaluationItems.length;
    const totalGoals = classes.reduce((accumulator, classGroup) => accumulator + classGroup.goalIds.length, 0);
    const attainmentPercentage =
      totalEvaluations > 0
        ? Math.round(
            (evaluationItems.reduce((accumulator, evaluation) => accumulator + evaluation.score, 0) /
              totalEvaluations) *
              100
          )
        : 0;

    return {
      student,
      summary: {
        totalClasses: classes.length,
        totalGoals,
        totalEvaluations,
        manaCount,
        mpaCount,
        maCount,
        attainmentPercentage
      },
      classes: classes
        .map((classGroup) => ({
          id: classGroup.id,
          topic: classGroup.topic,
          year: classGroup.year,
          semester: classGroup.semester,
          goalCount: classGroup.goalIds.length,
          evaluationCount: evaluationItems.filter((evaluation) => evaluation.classId === classGroup.id)
            .length
        }))
        .sort((left, right) => left.topic.localeCompare(right.topic, "pt-BR")),
      evaluations: evaluationItems,
      timeline: buildTimeline(evaluationItems),
      emailLogs: emailLogs
        .filter((entry) => entry.studentId === studentId)
        .sort((left, right) => right.attemptedAt.getTime() - left.attemptedAt.getTime())
        .slice(0, 8)
        .map((entry) => ({
          id: entry.id,
          subject: entry.subject,
          digestDate: entry.digestDate,
          status: entry.status,
          attemptedAt: entry.attemptedAt,
          entriesCount: entry.entriesCount
        }))
    };
  }
}
