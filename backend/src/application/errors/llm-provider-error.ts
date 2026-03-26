export class LLMProviderError extends Error {
  constructor(message = "Falha ao gerar insights com o provedor de IA.") {
    super(message);
    this.name = "LLMProviderError";
  }
}

export class LLMTimeoutError extends LLMProviderError {
  constructor(message = "Tempo limite excedido ao gerar insights com o provedor de IA.") {
    super(message);
    this.name = "LLMTimeoutError";
  }
}
