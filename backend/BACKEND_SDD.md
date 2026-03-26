# Backend SDD

## 1. Visao geral

Este documento descreve o estado atual do backend do sistema de gerenciamento, geracao, correcao e analise de provas.

Stack atual:

- Node.js + TypeScript
- Express na camada HTTP
- Prisma ORM
- PostgreSQL
- Cucumber + Gherkin + Supertest para testes de aceitacao
- PDFKit para geracao inicial dos PDFs
- OpenAI SDK para a integracao isolada de insights por IA

## 2. Escopo implementado hoje

O backend atualmente implementa:

- CRUD completo de questoes
- criacao e consulta de modelos de prova (`ExamTemplate`)
- geracao de instancias randomizadas de prova (`ExamInstance`)
- geracao de PDF individual por prova
- geracao de CSV de gabarito
- correcao de provas com estrategias `STRICT` e `PROPORTIONAL`
- persistencia de relatorio de correcao (`ExamReport`)
- dashboard com metricas agregadas por prova corrigida
- endpoint de insights pedagogicos com fallback resiliente

## 3. Arquitetura adotada

Foi usada uma variacao enxuta de Clean Architecture com quatro camadas:

### Domain

Responsavel pelo nucleo de negocio:

- entidades: `Question`, `Option`, `ExamTemplate`, `ExamInstance`, `ExamReport`
- enums: `AlternativeIdentificationType`, `GradingStrategyType`
- contratos de repositorio
- servicos de dominio:
  - randomizacao de instancias
  - normalizacao de respostas
  - estrategias de correcao
  - agregacao de metricas de dashboard

### Application

Responsavel pelos casos de uso, DTOs e regras de aplicacao:

- questoes:
  - `CreateQuestionUseCase`
  - `GetQuestionUseCase`
  - `ListQuestionsUseCase`
  - `UpdateQuestionUseCase`
  - `DeleteQuestionUseCase`
- provas:
  - `CreateExamTemplateUseCase`
  - `GetExamTemplateUseCase`
  - `GenerateExamInstancesUseCase`
- correcao e analytics:
  - `GradeExamsUseCase`
  - `GetDashboardMetricsUseCase`
  - `GenerateClassInsightsUseCase`

### Infrastructure

Responsavel por detalhes tecnicos:

- cliente Prisma
- repositorios PostgreSQL via Prisma
- servicos de CSV
- servico de PDF
- provider de LLM
- bootstrap da aplicacao

### Presentation

Responsavel pela interface HTTP:

- rotas
- controllers
- schemas Zod
- middleware global de erros

## 4. Estrutura logica

```text
backend/
  src/
    domain/
    application/
    infrastructure/
    presentation/
  BACKEND_SDD.md

prisma/
tests/acceptance/
```

## 5. Modelo de dominio atual

### Option

```ts
interface Option {
  id: string;
  description: string;
  isCorrect: boolean;
}
```

### Question

```ts
interface Question {
  id: string;
  topic: string;
  unit: number;
  statement: string;
  options: Option[];
  createdAt: Date;
  updatedAt: Date;
}
```

### ExamTemplate

```ts
interface ExamTemplate {
  id: string;
  title: string;
  questionsSnapshot: Question[];
  alternativeIdentificationType: "LETTERS" | "POWERS_OF_2";
  createdAt: Date;
  updatedAt: Date;
}
```

### ExamInstance

```ts
interface ExamInstance {
  id: string;
  batchId: string;
  examCode: string;
  signature: string;
  templateId: string;
  templateTitle: string;
  alternativeIdentificationType: "LETTERS" | "POWERS_OF_2";
  randomizedQuestions: ExamInstanceQuestion[];
  createdAt: Date;
  updatedAt: Date;
}
```

### ExamReport

```ts
interface ExamReport {
  id: string;
  batchId: string;
  templateId: string;
  templateTitle: string;
  gradingStrategyType: "STRICT" | "PROPORTIONAL";
  studentsSnapshot: ExamReportStudentResult[];
  createdAt: Date;
  updatedAt: Date;
}
```

## 6. Persistencia

Tabelas principais:

- `questions`
- `options`
- `exam_templates`
- `exam_instances`
- `exam_reports`

Decisoes principais:

- questoes e alternativas sao persistidas relacionalmente
- cada questao registra tambem `topic` e `unit`, permitindo organizar o banco por tema e unidade curricular
- `ExamTemplate.questionsSnapshot` usa `JSONB` para congelar o estado das questoes na criacao da prova, incluindo `topic` e `unit`
- `ExamInstance.randomizedQuestions` usa `JSONB` para preservar a ordem embaralhada de questoes e alternativas
- `ExamReport.studentsSnapshot` usa `JSONB` para preservar o resultado detalhado da correcao

## 7. Endpoints HTTP atuais

### Questoes

- `POST /questions`
- `GET /questions`
- `GET /questions/:id`
- `PUT /questions/:id`
- `DELETE /questions/:id`

### Modelos de prova

- `GET /exam-templates`
- `POST /exam-templates`
- `GET /exam-templates/:id`
- `PUT /exam-templates/:id`
- `DELETE /exam-templates/:id`
- `POST /exam-templates/:id/generate`

### Correcao e relatorios

- `POST /exams/grade`
- `GET /exams/:id/metrics`
- `GET /exams/:id/insights`

## 8. Fluxos principais

### 8.1 Criacao de questao

1. Cliente envia `POST /questions`
2. Zod valida `topic`, `unit`, `statement` e `options`
3. Controller chama `CreateQuestionUseCase`
4. Caso de uso valida regras e gera IDs
5. Repositorio Prisma persiste em `questions` e `options`
6. API retorna `201`

### 8.2 Criacao de modelo de prova

1. Cliente envia `POST /exam-templates`
2. Zod valida body
3. Caso de uso consulta questoes existentes
4. O snapshot e montado e salvo em `exam_templates`
5. API retorna `201`

### 8.3 Geracao de provas randomizadas

1. Cliente envia `POST /exam-templates/:id/generate`
2. Caso de uso carrega o template
3. As questoes e alternativas sao embaralhadas
4. Sao geradas `N` instancias unicas
5. As instancias sao persistidas em `exam_instances`
6. O backend gera PDFs e um CSV de gabarito
7. API retorna `201`

### 8.4 Correcao

1. Cliente envia `POST /exams/grade` com dois CSVs
2. O backend faz parse dos arquivos
3. O gabarito e reconciliado com as `ExamInstance`
4. A estrategia de correcao e aplicada por questao
5. O resultado da turma e salvo como `ExamReport`
6. API retorna `examId`, resumo e notas por aluno

### 8.5 Dashboard e insights

1. Cliente consulta `GET /exams/:id/metrics`
2. O backend carrega `ExamReport` e `ExamTemplate`
3. As metricas sao agregadas por `originalQuestionId` e `originalOptionId`
4. Cliente consulta `GET /exams/:id/insights`
5. O backend reusa as metricas e chama o provider de IA
6. Em timeout ou indisponibilidade, as metricas continuam sendo retornadas com aviso

## 9. Estado de aderencia aos requisitos do enunciado

### Requisito 1: Gerenciamento de questoes fechadas

Status: **ATENDIDO**

Cobertura atual:

- inclusao, alteracao e remocao implementadas
- cada questao possui enunciado e alternativas
- cada alternativa possui descricao e indicacao `isCorrect`

Observacao:

- a exclusao e fisica

### Requisito 2: Gerenciamento de provas

Status: **PARCIALMENTE ATENDIDO**

Cobertura atual:

- criacao de prova a partir de questoes existentes: atendido
- definicao de `LETTERS` ou `POWERS_OF_2`: atendido
- consulta de prova: atendido
- alteracao de prova: **nao implementado**
- remocao de prova: **nao implementado**

Observacao importante:

- hoje o backend trata a prova gerenciavel como `ExamTemplate`
- existe geracao de `ExamInstance`, mas nao ha CRUD completo de `ExamTemplate`

### Requisito 3: Geracao de PDFs e CSVs

Status: **PARCIALMENTE ATENDIDO**

Cobertura atual:

- geracao de um numero `N` de provas randomizadas: atendido
- variacao da ordem de questoes e alternativas: atendido
- espaco apos a questao para resposta em letras: atendido
- espaco apos a questao para resposta em soma de potencias de 2: atendido
- geracao de CSV de gabarito: atendido, mas em formato diferente do enunciado

Lacunas atuais:

- cabecalho completo com disciplina, professor, data etc.: **nao implementado**
- rodape em cada pagina com numero da prova: **nao implementado corretamente**
- espaco final para nome e CPF do aluno: **nao implementado**
- CSV no formato "uma linha por prova com todas as respostas da prova": **nao implementado**

Observacao importante sobre o CSV:

- o backend atual gera CSV em formato longo, com **uma linha por questao da prova**
- o enunciado pede **uma linha por prova**, seguida do gabarito de cada questao

### Requisito 4: Correcao e relatorio da turma

Status: **PARCIALMENTE ATENDIDO**

Cobertura atual:

- upload do CSV de gabarito e do CSV de respostas: atendido
- correcao rigorosa (`STRICT`): atendido
- correcao proporcional (`PROPORTIONAL`): atendido
- geracao de relatorio de notas da turma: atendido

Lacunas e desvios atuais:

- o backend espera CSV de respostas em formato longo, com uma linha por resposta de questao
- o fluxo descrito no enunciado sugere integracao mais direta com CSV de formulario contendo uma linha por aluno e colunas por questao
- o backend atual depende do formato longo tanto para o gabarito quanto para as respostas

## 10. Principais divergencias tecnicas encontradas na auditoria

1. **CRUD de provas incompleto**

- existem apenas criacao, consulta e geracao de instancias
- nao existem endpoints nem casos de uso para alterar ou remover `ExamTemplate`

2. **Formato do gabarito CSV nao cumpre o contrato do enunciado**

- o CSV gerado hoje tem uma linha por questao da prova
- o enunciado pede uma linha por prova com o conjunto das respostas

3. **Formato esperado na correcao nao casa com o fluxo tipico de Google Forms**

- o parser atual espera `studentId, studentName, examCode, questionPosition, markedAnswer`
- isso obriga pre-processamento externo antes da correcao caso o formulario exporte colunas por questao

4. **Layout do PDF ainda e um esqueleto tecnico**

- nao ha metadados de disciplina, professor e data no dominio
- o rodape nao e aplicado por pagina
- nao ha secao final para nome e CPF

## 11. Testes de aceitacao atuais

Cobrem:

- CRUD de questoes
- criacao de `ExamTemplate`
- imutabilidade do snapshot
- geracao randomizada de `ExamInstance`
- CSV de gabarito no formato atual do sistema
- correcao `STRICT`
- correcao `PROPORTIONAL`
- dashboard e insights com fallback de timeout

Nao cobrem ainda:

- alteracao e remocao de prova
- PDF com layout funcional exigido pelo enunciado
- CSV de gabarito em uma linha por prova
- importacao de CSV de respostas no formato tipico de planilha/formulario

## 12. Proximos ajustes necessarios para aderencia total

Para atender rigorosamente ao enunciado, o backend ainda precisa:

1. adicionar `PUT /exam-templates/:id` e `DELETE /exam-templates/:id`
2. enriquecer `ExamTemplate` com metadados de cabecalho da prova
3. corrigir o gerador de PDF para incluir rodape em todas as paginas
4. adicionar secao final com nome e CPF do aluno
5. mudar o contrato do CSV de gabarito para uma linha por prova
6. suportar parse de CSV de respostas em formato tabular por aluno

## 13. Conclusao

O backend esta consistente e funcional para o fluxo tecnico atualmente implementado, mas **ainda nao atende integralmente todos os requisitos do enunciado**.

Resumo objetivo:

- Requisito 1: atendido
- Requisito 2: parcial
- Requisito 3: parcial
- Requisito 4: parcial

Este documento foi atualizado para refletir com precisao o estado real da implementacao e as lacunas restantes.
