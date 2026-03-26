import { PrismaClient, Question as PrismaQuestion } from "@prisma/client";

import { Question } from "../../domain/entities/question";
import { IQuestionRepository } from "../../domain/repositories/question-repository";

type PrismaQuestionWithOptions = PrismaQuestion & {
  options: Array<{
    id: string;
    description: string;
    isCorrect: boolean;
    questionId: string;
  }>;
};

const toDomainQuestion = (question: PrismaQuestionWithOptions): Question => ({
  id: question.id,
  topic: question.topic,
  unit: question.unit,
  statement: question.statement,
  options: question.options.map((option) => ({
    id: option.id,
    description: option.description,
    isCorrect: option.isCorrect
  })),
  createdAt: question.createdAt,
  updatedAt: question.updatedAt
});

export class PrismaQuestionRepository implements IQuestionRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  async create(question: Question): Promise<Question> {
    const createdQuestion = await this.prismaClient.question.create({
      data: {
        id: question.id,
        topic: question.topic,
        unit: question.unit,
        statement: question.statement,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
        options: {
          create: question.options.map((option) => ({
            id: option.id,
            description: option.description,
            isCorrect: option.isCorrect
          }))
        }
      },
      include: {
        options: true
      }
    });

    return toDomainQuestion(createdQuestion);
  }

  async update(question: Question): Promise<Question> {
    const updatedQuestion = await this.prismaClient.question.update({
      where: { id: question.id },
      data: {
        topic: question.topic,
        unit: question.unit,
        statement: question.statement,
        updatedAt: question.updatedAt,
        options: {
          deleteMany: {},
          create: question.options.map((option) => ({
            id: option.id,
            description: option.description,
            isCorrect: option.isCorrect
          }))
        }
      },
      include: {
        options: true
      }
    });

    return toDomainQuestion(updatedQuestion);
  }

  async delete(id: string): Promise<void> {
    await this.prismaClient.question.delete({
      where: { id }
    });
  }

  async findById(id: string): Promise<Question | null> {
    const question = await this.prismaClient.question.findUnique({
      where: { id },
      include: {
        options: true
      }
    });

    return question ? toDomainQuestion(question) : null;
  }

  async findAll(): Promise<Question[]> {
    const questions = await this.prismaClient.question.findMany({
      include: {
        options: true
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    return questions.map(toDomainQuestion);
  }

  async findByIds(ids: string[]): Promise<Question[]> {
    const questions = await this.prismaClient.question.findMany({
      where: {
        id: {
          in: ids
        }
      },
      include: {
        options: true
      }
    });

    return questions.map(toDomainQuestion);
  }
}
