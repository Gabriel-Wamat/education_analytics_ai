import { Request, Response } from "express";

import { ListEmailLogsUseCase } from "../../../application/use-cases/list-email-logs-use-case";
import { SendEvaluationDigestUseCase } from "../../../application/use-cases/send-evaluation-digest-use-case";
import { SendManualEmailUseCase } from "../../../application/use-cases/send-manual-email-use-case";

export class EmailDigestController {
  constructor(
    private readonly sendEvaluationDigestUseCase: SendEvaluationDigestUseCase,
    private readonly listEmailLogsUseCase: ListEmailLogsUseCase,
    private readonly sendManualEmailUseCase: SendManualEmailUseCase,
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

  listMessages = async (_request: Request, response: Response): Promise<void> => {
    const logs = await this.listEmailLogsUseCase.execute();
    response.status(200).json(logs);
  };

  sendManual = async (request: Request, response: Response): Promise<void> => {
    const result = await this.sendManualEmailUseCase.execute(request.body);
    response.status(200).json(result);
  };
}
