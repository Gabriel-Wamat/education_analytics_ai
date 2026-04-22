# Education Analytics AI 

### Trabalho da discíplina de mestrado: Agentes de IA

Sistema web para montagem, geração, correção e análise de provas, com backend em Node.js/TypeScript e frontend em React/TypeScript.

Link: https://education-analytics.vercel.app/questions

## Stack

- Backend: Node.js, TypeScript, Express, Prisma, PostgreSQL, Cucumber
- Frontend: React, TypeScript, Vite, Tailwind CSS, Recharts
- IA: OpenAI para geração de insights pedagógicos

## Estrutura

```text
backend/     código-fonte do backend
frontend/    código-fonte do frontend
prisma/      schema e migrations
tests/       testes de rota e aceitação
scripts/     seed e utilitários
```

## Pré-requisitos

- Node.js 25.2.1 ou compatível
- PostgreSQL em execução
- npm

## Instalação

Este projeto não usa Python, então não há `uv` nem `requirements.txt`. As dependências são instaladas com `npm`.

### Backend

```bash
npm install
npm run prisma:migrate:deploy
```

### Frontend

```bash
cd frontend
npm install
```

## Variáveis de ambiente

O projeto usa um único arquivo `.env` na raiz. Ele é ignorado pelo Git e deve concentrar tanto a configuração local quanto a de testes:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/exam_manager?schema=public
TEST_DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/exam_manager_test?schema=public
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini

# Módulo pedagógico
JSON_STORAGE_DIR=data
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=no-reply@education-analytics.local
EMAIL_DIGEST_INTERVAL_MS=
```

`DATABASE_URL` é usado pela aplicação em desenvolvimento. `TEST_DATABASE_URL` é usado automaticamente pelos testes de rota, benchmarks e aceitação. O `OPENAI_API_KEY` é opcional. Sem ele, o dashboard continua funcionando, mas os insights de IA ficam indisponíveis. Para o módulo pedagógico, o `JSON_STORAGE_DIR` aponta para a pasta onde os JSONs de alunos, metas, turmas, avaliações e fila de digest são persistidos. Quando `SMTP_HOST/PORT` não estão configurados, o sistema cai no `ConsoleEmailService` (apenas loga o e-mail) — útil em desenvolvimento. `EMAIL_DIGEST_INTERVAL_MS` ativa o agendador em background que drena a fila de resumo em intervalos regulares; quando ausente, a fila deve ser drenada manualmente via `POST /email/digest`.

## Execução

### Backend

```bash
npm run dev
```

Servidor padrão: `http://127.0.0.1:3000`

### Frontend

```bash
cd frontend
npm run dev
```

Aplicação padrão: `http://127.0.0.1:5173`

## Banco de dados

Para aplicar migrations:

```bash
npm run prisma:migrate:deploy
```

Para popular o sistema com uma carga real de demonstração:

```bash
npm run seed:demo
```

## Testes

### Backend

```bash
npm run test:routes
npm run test:acceptance
```

### Frontend

```bash
cd frontend
npm test
```

## Funcionalidades principais

- CRUD de questões
- Criação e gerenciamento de provas
- Geração de instâncias randomizadas, PDF e CSV
- Correção com estratégias estrita e proporcional
- Dashboard com métricas e insights pedagógicos
- Módulo pedagógico: cadastro de alunos (com validação de CPF e e-mail), metas, turmas (tema, ano, semestre) com matrícula de alunos e associação de metas
- Avaliação aluno x meta com três níveis (MANA/MPA/MA) e persistência em JSON
- Resumo diário por e-mail agrupando alterações por aluno (SMTP real via `SMTP_*` ou fallback de console)

## Novas rotas HTTP

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET/POST/PUT/DELETE` | `/students` | CRUD de alunos |
| `GET/POST/PUT/DELETE` | `/goals` | CRUD de metas |
| `GET/POST/PUT/DELETE` | `/classes` | CRUD de turmas |
| `GET` | `/classes/:id/evaluations` | Lista avaliações da turma |
| `PUT` | `/classes/:id/evaluations` | Define (cria/atualiza) a avaliação de um aluno em uma meta |
| `POST` | `/email/digest` | Processa a fila diária e envia os resumos pendentes |

## Persistência JSON

Os dados do módulo pedagógico ficam em arquivos JSON dentro de `JSON_STORAGE_DIR` (ex.: `data/students.json`, `data/classes.json`). A escrita é atômica (arquivo temporário + `rename`) e as operações são serializadas por uma cadeia de promises para evitar corridas.
