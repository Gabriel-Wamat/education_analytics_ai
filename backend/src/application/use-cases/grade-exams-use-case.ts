import { randomUUID } from "node:crypto";

import { GradeExamsInput } from "../dto/grade-exams-input";
import { ValidationError } from "../errors/validation-error";
import { ICsvService, StudentResponseRow } from "../services/csv-service";
import { createGradingStrategy } from "../support/grading-strategy-factory";
import {
  buildDisplayAnswer,
  buildExpectedStates,
  normalizeMarkedAnswer
} from "../../domain/services/answer-normalizer";
import { ExamReportStudentResult } from "../../domain/entities/exam-report";
import { GradingStrategyType } from "../../domain/entities/grading-strategy-type";
import { IExamReportRepository } from "../../domain/repositories/exam-report-repository";
import { IExamInstanceRepository } from "../../domain/repositories/exam-instance-repository";
import { IExamTemplateRepository } from "../../domain/repositories/exam-template-repository";

export interface GradedQuestionResult {
  questionPosition: number;
  originalQuestionId: string;
  questionPositionInTemplate: number;
  expectedAnswer: string;
  actualAnswer: string;
  score: number;
  selectedOptionIds: string[];
  wasFullyCorrect: boolean;
}

export interface GradedStudentResult {
  studentId: string;
  studentName?: string;
  examCode: string;
  totalScore: number;
  percentage: number;
  questionResults: GradedQuestionResult[];
}

export interface GradeExamsResult {
  examId: string;
  strategy: GradingStrategyType;
  totalStudents: number;
  averageScore: number;
  students: GradedStudentResult[];
}

const groupResponses = (
  studentResponses: StudentResponseRow[]
): Map<string, StudentResponseRow> => {
  const groupedResponses = new Map<string, StudentResponseRow>();

  for (const response of studentResponses) {
    const studentKey = `${response.studentId}::${response.examCode}`;
    if (groupedResponses.has(studentKey)) {
      throw new ValidationError(
        "O arquivo de respostas possui linhas duplicadas para o mesmo aluno e prova.",
        [studentKey]
      );
    }

    groupedResponses.set(studentKey, response);
  }

  return groupedResponses;
};

const buildAnswerKeyLookup = (
  answerKeyRows: Array<{ examCode: string; answers: string[] }>
): Map<string, { examCode: string; answers: string[] }> => {
  const answerKeyByExamCode = new Map<string, { examCode: string; answers: string[] }>();

  for (const row of answerKeyRows) {
    if (answerKeyByExamCode.has(row.examCode)) {
      throw new ValidationError(
        "O arquivo de gabarito possui mais de uma linha para a mesma prova.",
        [row.examCode]
      );
    }

    answerKeyByExamCode.set(row.examCode, row);
  }

  return answerKeyByExamCode;
};

const buildQuestionPositionLookup = (questionIds: string[]): Map<string, number> =>
  new Map(questionIds.map((questionId, index) => [questionId, index + 1]));

const normalizeAnswerWithValidation = (
  answer: string,
  examCode: string,
  questionPosition: number,
  alternativeIdentificationType: string,
  normalizer: () => boolean[]
): boolean[] => {
  try {
    return normalizer();
  } catch (error) {
    throw new ValidationError("Resposta inválida encontrada no CSV.", [
      examCode,
      `q${questionPosition}`,
      alternativeIdentificationType,
      error instanceof Error ? error.message : "Erro desconhecido"
    ]);
  }
};

export class GradeExamsUseCase {
  constructor(
    private readonly csvService: ICsvService,
    private readonly examInstanceRepository: IExamInstanceRepository,
    private readonly examTemplateRepository: IExamTemplateRepository,
    private readonly examReportRepository: IExamReportRepository
  ) {}

  async execute(input: GradeExamsInput): Promise<GradeExamsResult> {
    const gradingStrategy = createGradingStrategy(input.gradingStrategyType);

    const [answerKeyRows, studentResponseRows] = await Promise.all([
      this.csvService.parseAnswerKey(input.answerKeyFile.buffer),
      this.csvService.parseStudentResponses(input.studentResponsesFile.buffer)
    ]);

    if (answerKeyRows.length === 0) {
      throw new ValidationError("O arquivo de gabarito está vazio.");
    }

    if (studentResponseRows.length === 0) {
      throw new ValidationError("O arquivo de respostas dos alunos está vazio.");
    }

    const examCodes = [...new Set(answerKeyRows.map((row) => row.examCode))];
    const examInstances = await this.examInstanceRepository.findByExamCodes(examCodes);
    const examInstancesByCode = new Map(
      examInstances.map((examInstance) => [examInstance.examCode, examInstance])
    );

    const missingExamCodes = examCodes.filter((examCode) => !examInstancesByCode.has(examCode));
    if (missingExamCodes.length > 0) {
      throw new ValidationError("Existem provas no gabarito que não foram encontradas.", missingExamCodes);
    }

    const relatedExamInstances = examCodes.map((examCode) => examInstancesByCode.get(examCode)!);
    const batchIds = [...new Set(relatedExamInstances.map((examInstance) => examInstance.batchId))];
    if (batchIds.length !== 1) {
      throw new ValidationError("O gabarito deve pertencer a um único lote de provas.", batchIds);
    }

    const templateIds = [...new Set(relatedExamInstances.map((examInstance) => examInstance.templateId))];
    if (templateIds.length !== 1) {
      throw new ValidationError(
        "O gabarito deve pertencer a um único modelo de prova.",
        templateIds
      );
    }

    const examTemplates = await Promise.all(
      templateIds.map((templateId) => this.examTemplateRepository.findById(templateId))
    );
    const missingTemplates = templateIds.filter((_, index) => !examTemplates[index]);
    if (missingTemplates.length > 0) {
      throw new ValidationError(
        "Existem provas geradas vinculadas a um modelo de prova inexistente.",
        missingTemplates
      );
    }

    const examTemplatesById = new Map(
      examTemplates.map((examTemplate) => [examTemplate!.id, examTemplate!])
    );
    const templateQuestionPositionsById = new Map(
      examTemplates.map((examTemplate) => [
        examTemplate!.id,
        buildQuestionPositionLookup(examTemplate!.questionsSnapshot.map((question) => question.id))
      ])
    );
    const answerKeyByExamCode = buildAnswerKeyLookup(answerKeyRows);

    for (const answerKeyRow of answerKeyRows) {
      const examInstance = examInstancesByCode.get(answerKeyRow.examCode)!;
      const orderedQuestions = [...examInstance.randomizedQuestions].sort(
        (left, right) => left.position - right.position
      );

      if (answerKeyRow.answers.length !== orderedQuestions.length) {
        throw new ValidationError(
          "O gabarito não possui a mesma quantidade de questões da prova.",
          [
          answerKeyRow.examCode,
          String(orderedQuestions.length),
          String(answerKeyRow.answers.length)
        ]
        );
      }

      for (const [index, question] of orderedQuestions.entries()) {
        const expectedAnswer = buildDisplayAnswer(
          buildExpectedStates(question),
          question,
          examInstance.alternativeIdentificationType
        );

        if (expectedAnswer !== answerKeyRow.answers[index]) {
          throw new ValidationError("O gabarito não corresponde às respostas esperadas da prova.", [
            answerKeyRow.examCode,
            `q${index + 1}`
          ]);
        }
      }
    }

    const groupedResponses = groupResponses(studentResponseRows);
    const students: GradedStudentResult[] = [];

    for (const [studentKey, studentResponse] of groupedResponses.entries()) {
      const examInstance = examInstancesByCode.get(studentResponse.examCode);

      if (!examInstance) {
        throw new ValidationError("Existe resposta para uma prova sem gabarito correspondente.", [
          studentResponse.examCode
        ]);
      }

      const answerKeyRow = answerKeyByExamCode.get(studentResponse.examCode);
      if (!answerKeyRow) {
        throw new ValidationError("Existe resposta para uma prova sem gabarito correspondente.", [
          studentResponse.examCode
        ]);
      }

      const questionPositionLookup = templateQuestionPositionsById.get(examInstance.templateId);
      if (!questionPositionLookup) {
        throw new ValidationError("Não foi possível resolver a posição original das questões.", [
          examInstance.templateId
        ]);
      }

      const orderedQuestions = [...examInstance.randomizedQuestions].sort(
        (left, right) => left.position - right.position
      );

      if (studentResponse.answers.length !== orderedQuestions.length) {
        throw new ValidationError(
          "O arquivo de respostas não possui a mesma quantidade de questões da prova.",
          [
            studentKey,
            String(orderedQuestions.length),
            String(studentResponse.answers.length)
          ]
        );
      }

      const questionResults = orderedQuestions.map((question, index) => {
      const expectedStates = normalizeAnswerWithValidation(
          answerKeyRow.answers[index] ?? "",
          studentResponse.examCode,
          index + 1,
          examInstance.alternativeIdentificationType,
          () =>
            normalizeMarkedAnswer(
              answerKeyRow.answers[index] ?? "",
              question,
              examInstance.alternativeIdentificationType
            )
        );
        const actualAnswer = studentResponse.answers[index] ?? "";
        const actualStates = normalizeMarkedAnswer(
          actualAnswer,
          question,
          examInstance.alternativeIdentificationType
        );
        const questionPositionInTemplate = questionPositionLookup.get(question.originalQuestionId);

        if (!questionPositionInTemplate) {
          throw new ValidationError("Questão da prova não encontrada no modelo original.", [
            question.originalQuestionId
          ]);
        }

        const expectedAnswer = buildDisplayAnswer(
          expectedStates,
          question,
          examInstance.alternativeIdentificationType
        );
        const normalizedActualAnswer = buildDisplayAnswer(
          actualStates,
          question,
          examInstance.alternativeIdentificationType
        );
        const selectedOptionIds = question.randomizedOptions
          .filter((_, index) => actualStates[index])
          .map((option) => option.originalOptionId);
        const score = gradingStrategy.calculateQuestionScore(expectedStates, actualStates);
        const wasFullyCorrect = expectedStates.every(
          (expectedState, index) => expectedState === actualStates[index]
        );

        return {
          questionPosition: question.position,
          originalQuestionId: question.originalQuestionId,
          questionPositionInTemplate,
          expectedAnswer,
          actualAnswer: normalizedActualAnswer,
          score,
          selectedOptionIds,
          wasFullyCorrect
        };
      });

      const totalScore = questionResults.reduce((total, questionResult) => total + questionResult.score, 0);
      const percentage = (totalScore / questionResults.length) * 100;

      students.push({
        studentId: studentResponse.studentId,
        studentName: studentResponse.studentName,
        examCode: studentResponse.examCode,
        totalScore,
        percentage,
        questionResults
      });
    }

    const averageScore =
      students.reduce((total, student) => total + student.totalScore, 0) / students.length;
    const templateId = templateIds[0]!;
    const examTemplate = examTemplatesById.get(templateId)!;
    const examReportStudentsSnapshot: ExamReportStudentResult[] = students.map((student) => ({
      studentId: student.studentId,
      studentName: student.studentName,
      examCode: student.examCode,
      totalScore: student.totalScore,
      percentage: student.percentage,
      questionResults: student.questionResults.map((questionResult) => ({
        originalQuestionId: questionResult.originalQuestionId,
        questionPositionInTemplate: questionResult.questionPositionInTemplate,
        expectedAnswer: questionResult.expectedAnswer,
        actualAnswer: questionResult.actualAnswer,
        score: questionResult.score,
        selectedOptionIds: questionResult.selectedOptionIds,
        wasFullyCorrect: questionResult.wasFullyCorrect
      }))
    }));

    const now = new Date();
    const examReport = await this.examReportRepository.create({
      id: randomUUID(),
      batchId: batchIds[0]!,
      templateId,
      templateTitle: examTemplate.title,
      gradingStrategyType: input.gradingStrategyType,
      studentsSnapshot: examReportStudentsSnapshot,
      createdAt: now,
      updatedAt: now
    });

    return {
      examId: examReport.id,
      strategy: input.gradingStrategyType,
      totalStudents: students.length,
      averageScore,
      students
    };
  }
}
