# Auditoria de Rotas, Testes e Benchmarks

Data da auditoria: 2026-03-25

## Escopo

Auditoria completa das rotas do sistema, cobrindo:

- backend HTTP em `backend/src/presentation/http/routes`
- frontend SPA em `frontend/src/app/router`
- contratos consumidos pelo frontend em `frontend/src/services/api`
- testes automatizados de contrato/fluxo
- benchmarks in-process do backend com banco PostgreSQL de teste

## Mapa de Rotas do Backend

| Método | Rota | Finalidade | Cobertura |
| --- | --- | --- | --- |
| `GET` | `/health` | Health check do backend | `npm run test:routes` |
| `POST` | `/questions` | Criação de questão | `npm run test:routes`, `npm run test:acceptance` |
| `GET` | `/questions` | Listagem de questões | `npm run test:routes` |
| `GET` | `/questions/:id` | Busca de questão por ID | `npm run test:routes` |
| `PUT` | `/questions/:id` | Atualização de questão | `npm run test:routes`, `npm run test:acceptance` |
| `DELETE` | `/questions/:id` | Remoção de questão | `npm run test:routes`, `npm run test:acceptance` |
| `POST` | `/exam-templates` | Criação de modelo de prova | `npm run test:routes`, `npm run test:acceptance` |
| `GET` | `/exam-templates` | Listagem de modelos de prova | `npm run test:routes` |
| `GET` | `/exam-templates/:id` | Busca de modelo de prova por ID | `npm run test:routes`, `npm run test:acceptance` |
| `PUT` | `/exam-templates/:id` | Atualização de modelo de prova | `npm run test:routes` |
| `DELETE` | `/exam-templates/:id` | Remoção de modelo de prova e cascata de artefatos/resultados | `npm run test:routes` |
| `POST` | `/exam-templates/:id/generate` | Geração de instâncias, PDFs e CSV | `npm run test:routes`, `npm run test:acceptance` |
| `POST` | `/exams/grade` | Correção via upload multipart | `npm run test:routes`, `npm run test:acceptance` |
| `GET` | `/exams/:id/metrics` | Métricas numéricas do dashboard | `npm run test:routes`, `npm run test:acceptance` |
| `GET` | `/exams/:id/insights` | Métricas + insights pedagógicos | `npm run test:routes`, `npm run test:acceptance` |

## Mapa de Rotas do Frontend

| Rota | Tela | Dependências de backend |
| --- | --- | --- |
| `/` | Redireciona para `/questions` | nenhuma |
| `/questions` | Banco de questões | `GET/POST/PUT/DELETE /questions` |
| `/exam-templates/new` | Assistente de criação de prova | `GET /questions`, `POST /exam-templates`, `POST /exam-templates/:id/generate`, `GET /exam-templates/:id` |
| `/grading` | Upload, correção e relatório | `POST /exams/grade` |
| `/exams/:examId` | Dashboard de métricas e insights | `GET /exams/:id/metrics`, `GET /exams/:id/insights` |
| `*` | Página não encontrada | nenhuma |

## Problemas Encontrados na Auditoria

### Corrigidos nesta rodada

1. O frontend dependia do prefixo `/api` com proxy de desenvolvimento, mas o proxy não reescrevia a URL.
2. O frontend em desenvolvimento dependia demais do proxy; agora ele também suporta base URL direta para o backend local.
3. O backend não liberava CORS para o frontend local.
4. O banco principal `exam_manager` não existia no ambiente local, o que gerava `500` ao listar questões.
5. O CRUD de `exam-templates` estava incompleto no backend: faltavam listagem, atualização e remoção.
6. Não existia uma suíte automatizada específica para validar todas as rotas HTTP do backend.
7. Não existia teste dedicado para o roteamento do frontend.
8. Não existia benchmark automatizado dos endpoints críticos.

### Gaps que permanecem como evolução

1. O frontend ainda não possui uma tela dedicada de gerenciamento de modelos de prova usando `GET/PUT/DELETE /exam-templates`.
2. A geração de artefatos ainda trabalha com `absolutePath`; o backend não expõe download HTTP/ZIP.
3. O benchmark atual mede o backend em modo in-process, sem latência de rede e sem provedor LLM real.
4. O bundle do frontend continua grande e emite warning de chunk no build.

## Testes Automatizados Executados

### Backend

- `npm run test:routes`
  - 4 testes
  - 4 aprovados
  - cobre todas as rotas HTTP do backend e o preflight CORS local
- `npm run test:acceptance`
  - 16 cenários
  - 107 steps
  - 100% aprovados

### Frontend

- `npm test`
  - 4 arquivos
  - 11 testes
  - 100% aprovados
- inclui smoke test do roteador em `frontend/src/app/router/index.test.tsx`

### Build

- `npm run build` no backend: aprovado
- `npm run build` no frontend: aprovado

## Benchmarks Executados

Ambiente:

- backend em memória/in-process via `supertest`
- PostgreSQL de teste real (`exam_manager_test`)
- provedor LLM fake
- migrations aplicadas automaticamente

Resultados:

| Método | Rota | Iterações | Média (ms) | Min (ms) | P95 (ms) | Máx (ms) |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| GET | `/health` | 25 | 1.19 | 0.49 | 1.69 | 9.35 |
| GET | `/questions` | 20 | 2.09 | 1.44 | 3.39 | 4.17 |
| POST | `/questions` | 10 | 3.81 | 2.11 | 13.82 | 13.82 |
| GET | `/exam-templates` | 20 | 2.00 | 1.24 | 3.40 | 5.34 |
| POST | `/exam-templates/:id/generate` | 5 | 18.34 | 11.32 | 30.26 | 30.26 |
| POST | `/exams/grade` | 5 | 6.25 | 4.16 | 12.41 | 12.41 |
| GET | `/exams/:id/metrics` | 20 | 1.71 | 1.27 | 2.61 | 3.03 |
| GET | `/exams/:id/insights` | 20 | 1.44 | 1.17 | 1.69 | 1.90 |

## Avaliação

### Estado atual

- O backend está consistente do ponto de vista de rotas e agora cobre o CRUD de questões e provas, geração, correção, métricas e insights.
- O frontend está estável nas rotas principais e já não depende exclusivamente do proxy do Vite para falar com o backend local.
- A suíte de aceitação continua íntegra após as mudanças.
- A nova suíte de rotas protege o contrato HTTP contra regressões.

### Leitura dos benchmarks

- As rotas de leitura (`GET /health`, `GET /questions`, `GET /exam-templates`, `GET /exams/:id/metrics`, `GET /exams/:id/insights`) estão muito rápidas no cenário in-process.
- `POST /exam-templates/:id/generate` é hoje a rota mais pesada do conjunto, como esperado, por envolver randomização, persistência, PDF e CSV.
- `POST /exams/grade` ficou abaixo de `10 ms` em média no cenário de benchmark com um conjunto mínimo, o que é um bom sinal para o algoritmo base.
- Os números são úteis para baseline de regressão, mas não substituem um benchmark com rede real, payloads maiores e LLM real.

## Plano de Ação

### Prioridade alta

1. Criar uma tela frontend de gerenciamento de modelos de prova usando `GET /exam-templates`, `PUT /exam-templates/:id` e `DELETE /exam-templates/:id`.
2. Expor downloads HTTP para os artefatos gerados, eliminando a dependência de `absolutePath` no frontend.
3. Adicionar smoke test end-to-end do frontend com navegador real para o fluxo completo: questão -> prova -> geração -> correção -> dashboard.

### Prioridade média

1. Expandir o benchmark para datasets maiores e múltiplas provas por lote.
2. Medir a rota de insights com provedor LLM real e timeout configurado.
3. Introduzir code splitting no frontend para remover o warning de chunk grande no build.

### Prioridade baixa

1. Persistir e versionar um relatório de benchmark por rodada de auditoria.
2. Adicionar testes de contrato para respostas de erro (`400`, `404`) mais detalhados por endpoint.

## Status Final da Auditoria

- Rotas mapeadas: concluído
- Testes adicionais criados: concluído
- Benchmarks executados: concluído
- Erros de integração corrigidos: concluído
- Revalidação pós-correção: concluído
