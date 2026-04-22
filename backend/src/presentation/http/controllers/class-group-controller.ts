import { Request, Response } from "express";

import { CreateClassGroupUseCase } from "../../../application/use-cases/create-class-group-use-case";
import { DeleteClassGroupUseCase } from "../../../application/use-cases/delete-class-group-use-case";
import { GetClassGroupUseCase } from "../../../application/use-cases/get-class-group-use-case";
import { ListClassGroupsUseCase } from "../../../application/use-cases/list-class-groups-use-case";
import { ListEvaluationsByClassUseCase } from "../../../application/use-cases/list-evaluations-by-class-use-case";
import { SetEvaluationUseCase } from "../../../application/use-cases/set-evaluation-use-case";
import { UpdateClassGroupUseCase } from "../../../application/use-cases/update-class-group-use-case";

export class ClassGroupController {
  constructor(
    private readonly createClassGroupUseCase: CreateClassGroupUseCase,
    private readonly listClassGroupsUseCase: ListClassGroupsUseCase,
    private readonly getClassGroupUseCase: GetClassGroupUseCase,
    private readonly updateClassGroupUseCase: UpdateClassGroupUseCase,
    private readonly deleteClassGroupUseCase: DeleteClassGroupUseCase,
    private readonly setEvaluationUseCase: SetEvaluationUseCase,
    private readonly listEvaluationsByClassUseCase: ListEvaluationsByClassUseCase
  ) {}

  create = async (request: Request, response: Response): Promise<void> => {
    const classGroup = await this.createClassGroupUseCase.execute(request.body);
    response.status(201).json(classGroup);
  };

  list = async (_request: Request, response: Response): Promise<void> => {
    const classes = await this.listClassGroupsUseCase.execute();
    response.status(200).json(classes);
  };

  getById = async (request: Request, response: Response): Promise<void> => {
    const classGroup = await this.getClassGroupUseCase.execute(request.params.id as string);
    response.status(200).json(classGroup);
  };

  update = async (request: Request, response: Response): Promise<void> => {
    const classGroup = await this.updateClassGroupUseCase.execute(
      request.params.id as string,
      request.body
    );
    response.status(200).json(classGroup);
  };

  delete = async (request: Request, response: Response): Promise<void> => {
    await this.deleteClassGroupUseCase.execute(request.params.id as string);
    response.status(204).send();
  };

  listEvaluations = async (request: Request, response: Response): Promise<void> => {
    const result = await this.listEvaluationsByClassUseCase.execute(
      request.params.id as string
    );
    response.status(200).json(result);
  };

  setEvaluation = async (request: Request, response: Response): Promise<void> => {
    const evaluation = await this.setEvaluationUseCase.execute({
      classId: request.params.id as string,
      studentId: request.body.studentId,
      goalId: request.body.goalId,
      level: request.body.level
    });
    response.status(200).json(evaluation);
  };
}
