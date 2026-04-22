/**
 * Abstração mínima de relógio para tornar o agendador de digest determinístico
 * em testes.
 */
export interface IClock {
  now(): Date;
}

export class SystemClock implements IClock {
  now(): Date {
    return new Date();
  }
}
