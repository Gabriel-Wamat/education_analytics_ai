import { Request, Response } from "express";

import { CreateQuestionUseCase } from "../../../application/use-cases/create-question-use-case";
import { DeleteQuestionUseCase } from "../../../application/use-cases/delete-question-use-case";
import { GetQuestionUseCase } from "../../../application/use-cases/get-question-use-case";
import { ListQuestionsUseCase } from "../../../application/use-cases/list-questions-use-case";
import { UpdateQuestionUseCase } from "../../../application/use-cases/update-question-use-case";

export class QuestionController {
  constructor(
    private readonly createQuestionUseCase: CreateQuestionUseCase,
    private readonly getQuestionUseCase: GetQuestionUseCase,
    private readonly listQuestionsUseCase: ListQuestionsUseCase,
    private readonly updateQuestionUseCase: UpdateQuestionUseCase,
    private readonly deleteQuestionUseCase: DeleteQuestionUseCase
  ) {}

  create = async (request: Request, response: Response): Promise<void> => {
    const question = await this.createQuestionUseCase.execute(request.body);
    response.status(201).json(question);
  };

  getById = async (request: Request, response: Response): Promise<void> => {
    const question = await this.getQuestionUseCase.execute(request.params.id as string);
    response.status(200).json(question);
  };

  list = async (_request: Request, response: Response): Promise<void> => {
    const questions = await this.listQuestionsUseCase.execute();
    response.status(200).json(questions);
  };

  update = async (request: Request, response: Response): Promise<void> => {
    const question = await this.updateQuestionUseCase.execute(
      request.params.id as string,
      request.body
    );
    response.status(200).json(question);
  };

  delete = async (request: Request, response: Response): Promise<void> => {
    await this.deleteQuestionUseCase.execute(request.params.id as string);
    response.status(204).send();
  };
}
