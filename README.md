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
cp .env.example .env
npm run prisma:migrate:deploy
```

### Frontend

```bash
cd frontend
npm install
```

## Variáveis de ambiente

Crie um arquivo `.env` na raiz com os valores necessários:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/exam_manager?schema=public
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
```

O `OPENAI_API_KEY` é opcional. Sem ele, o dashboard continua funcionando, mas os insights de IA ficam indisponíveis.

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

