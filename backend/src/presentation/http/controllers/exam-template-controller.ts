import { Request, Response } from "express";

import { CreateExamTemplateUseCase } from "../../../application/use-cases/create-exam-template-use-case";
import { DeleteExamTemplateUseCase } from "../../../application/use-cases/delete-exam-template-use-case";
import { GenerateExamInstancesUseCase } from "../../../application/use-cases/generate-exam-instances-use-case";
import { GetExamTemplateUseCase } from "../../../application/use-cases/get-exam-template-use-case";
import { ListExamTemplateBatchesUseCase } from "../../../application/use-cases/list-exam-template-batches-use-case";
import { ListExamTemplatesUseCase } from "../../../application/use-cases/list-exam-templates-use-case";
import { UpdateExamTemplateUseCase } from "../../../application/use-cases/update-exam-template-use-case";

export class ExamTemplateController {
  constructor(
    private readonly createExamTemplateUseCase: CreateExamTemplateUseCase,
    private readonly listExamTemplatesUseCase: ListExamTemplatesUseCase,
    private readonly getExamTemplateUseCase: GetExamTemplateUseCase,
    private readonly listExamTemplateBatchesUseCase: ListExamTemplateBatchesUseCase,
    private readonly updateExamTemplateUseCase: UpdateExamTemplateUseCase,
    private readonly deleteExamTemplateUseCase: DeleteExamTemplateUseCase,
    private readonly generateExamInstancesUseCase: GenerateExamInstancesUseCase
  ) {}

  create = async (request: Request, response: Response): Promise<void> => {
    const examTemplate = await this.createExamTemplateUseCase.execute(request.body);
    response.status(201).json(examTemplate);
  };

  list = async (_request: Request, response: Response): Promise<void> => {
    const examTemplates = await this.listExamTemplatesUseCase.execute();
    response.status(200).json(examTemplates);
  };

  getById = async (request: Request, response: Response): Promise<void> => {
    const examTemplate = await this.getExamTemplateUseCase.execute(
      request.params.id as string
    );
    response.status(200).json(examTemplate);
  };

  listBatches = async (request: Request, response: Response): Promise<void> => {
    const examBatches = await this.listExamTemplateBatchesUseCase.execute(
      request.params.id as string
    );
    response.status(200).json(examBatches);
  };

  update = async (request: Request, response: Response): Promise<void> => {
    const examTemplate = await this.updateExamTemplateUseCase.execute(
      request.params.id as string,
      request.body
    );
    response.status(200).json(examTemplate);
  };

  delete = async (request: Request, response: Response): Promise<void> => {
    await this.deleteExamTemplateUseCase.execute(request.params.id as string);
    response.status(204).send();
  };

  generateInstances = async (request: Request, response: Response): Promise<void> => {
    const generatedExamBatch = await this.generateExamInstancesUseCase.execute({
      examTemplateId: request.params.id as string,
      quantity: request.body.quantity
    });

    response.status(201).json(generatedExamBatch);
  };
}
