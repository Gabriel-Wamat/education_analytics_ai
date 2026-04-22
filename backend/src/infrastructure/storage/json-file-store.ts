import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Camada genérica de persistência baseada em arquivo JSON.
 *
 * Características importantes:
 * - Escrita atômica (escreve em arquivo temporário e faz rename) para evitar
 *   corrupção em caso de crash no meio da operação.
 * - Serialização das operações através de uma fila promise-based, evitando
 *   condições de corrida quando múltiplas requisições chegam simultaneamente
 *   (Node é single-threaded mas as operações de I/O são assíncronas).
 * - Suporte a desserialização customizada (revive) para reconstruir tipos
 *   ricos como `Date` a partir do JSON cru.
 */
export class JsonFileStore<T> {
  private writeChain: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly filePath: string,
    private readonly defaultValue: () => T,
    private readonly revive: (raw: unknown) => T = (raw) => raw as T
  ) {}

  /** Lê o estado atual do arquivo. Cria o arquivo com o valor default se não existir. */
  async read(): Promise<T> {
    try {
      const content = await fs.readFile(this.filePath, "utf-8");
      const trimmed = content.trim();
      if (trimmed.length === 0) {
        return this.defaultValue();
      }
      return this.revive(JSON.parse(trimmed));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        const initial = this.defaultValue();
        await this.persist(initial);
        return initial;
      }
      throw error;
    }
  }

  /**
   * Aplica uma mutação serializada sobre o estado atual e persiste o resultado.
   * Garantia: chamadas concorrentes a `mutate` são executadas em ordem.
   */
  async mutate<R>(mutator: (state: T) => Promise<{ state: T; result: R }> | { state: T; result: R }): Promise<R> {
    const next = this.writeChain.then(async () => {
      const current = await this.read();
      const { state, result } = await mutator(current);
      await this.persist(state);
      return result;
    });
    this.writeChain = next.catch(() => {
      // engole o erro na cadeia para não derrubar mutações futuras;
      // o erro original ainda será propagado para o chamador atual.
    });
    return next;
  }

  private async persist(state: T): Promise<void> {
    const directory = path.dirname(this.filePath);
    await fs.mkdir(directory, { recursive: true });
    const tmpPath = `${this.filePath}.${randomUUID()}.tmp`;
    const payload = `${JSON.stringify(state, null, 2)}\n`;
    await fs.writeFile(tmpPath, payload, "utf-8");
    try {
      await fs.rename(tmpPath, this.filePath);
    } catch (error) {
      await fs.rm(tmpPath, { force: true });
      throw error;
    }
  }
}
