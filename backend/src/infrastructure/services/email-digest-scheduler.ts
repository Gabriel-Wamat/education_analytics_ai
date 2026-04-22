import { SendEvaluationDigestUseCase } from "../../application/use-cases/send-evaluation-digest-use-case";

export interface EmailDigestSchedulerConfig {
  /** Intervalo entre execuções do job, em milissegundos. */
  intervalMs: number;
  fromAddress: string;
  onError?: (error: unknown) => void;
  onSuccess?: (result: { emailsSent: number; entriesProcessed: number; emailsFailed: number }) => void;
}

export class EmailDigestScheduler {
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly useCase: SendEvaluationDigestUseCase,
    private readonly config: EmailDigestSchedulerConfig
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    const tick = async (): Promise<void> => {
      if (!this.running) return;
      try {
        const result = await this.useCase.execute({ fromAddress: this.config.fromAddress });
        this.config.onSuccess?.(result);
      } catch (error) {
        this.config.onError?.(error);
      } finally {
        if (this.running) {
          this.timer = setTimeout(tick, this.config.intervalMs);
        }
      }
    };
    this.timer = setTimeout(tick, this.config.intervalMs);
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }
}
