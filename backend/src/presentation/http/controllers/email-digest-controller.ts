import { Request, Response } from "express";

import { SendEvaluationDigestUseCase } from "../../../application/use-cases/send-evaluation-digest-use-case";

export class EmailDigestController {
  constructor(
    private readonly sendEvaluationDigestUseCase: SendEvaluationDigestUseCase,
    private readonly defaultFromAddress: string
  ) {}

  process = async (request: Request, response: Response): Promise<void> => {
    const fromAddress = typeof request.body?.from === "string" && request.body.from.trim().length > 0
      ? String(request.body.from)
      : this.defaultFromAddress;
    const digestDate = typeof request.body?.digestDate === "string"
      ? String(request.body.digestDate)
      : undefined;
    const result = await this.sendEvaluationDigestUseCase.execute({
      fromAddress,
      digestDate
    });
    response.status(200).json(result);
  };
}
