import { Request, Response } from "express";

import { CreateGoalUseCase } from "../../../application/use-cases/create-goal-use-case";
import { DeleteGoalUseCase } from "../../../application/use-cases/delete-goal-use-case";
import { ListGoalsUseCase } from "../../../application/use-cases/list-goals-use-case";
import { UpdateGoalUseCase } from "../../../application/use-cases/update-goal-use-case";

export class GoalController {
  constructor(
    private readonly createGoalUseCase: CreateGoalUseCase,
    private readonly listGoalsUseCase: ListGoalsUseCase,
    private readonly updateGoalUseCase: UpdateGoalUseCase,
    private readonly deleteGoalUseCase: DeleteGoalUseCase
  ) {}

  create = async (request: Request, response: Response): Promise<void> => {
    const goal = await this.createGoalUseCase.execute(request.body);
    response.status(201).json(goal);
  };

  list = async (_request: Request, response: Response): Promise<void> => {
    const goals = await this.listGoalsUseCase.execute();
    response.status(200).json(goals);
  };

  update = async (request: Request, response: Response): Promise<void> => {
    const goal = await this.updateGoalUseCase.execute(
      request.params.id as string,
      request.body
    );
    response.status(200).json(goal);
  };

  delete = async (request: Request, response: Response): Promise<void> => {
    await this.deleteGoalUseCase.execute(request.params.id as string);
    response.status(204).send();
  };
}
