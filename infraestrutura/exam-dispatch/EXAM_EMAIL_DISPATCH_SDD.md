# User Story

Como professor, eu quero disparar um lote de provas por e-mail para todos os alunos de uma turma para que cada estudante receba o seu PDF individual sem que eu precise baixar e encaminhar arquivo por arquivo.

# Objetivo

Implementar um fluxo operacional e determinístico de distribuição de provas por e-mail, preservando:

- um PDF individual por aluno;
- o gabarito CSV do lote como artefato exclusivo do professor;
- a rastreabilidade do envio;
- a visualização posterior das provas e gabaritos no Banco de Provas.

# Escopo funcional

1. O professor gera um lote de provas a partir de um template já cadastrado.
2. O sistema persiste as instâncias geradas no banco.
3. O Banco de Provas lista templates, lotes, provas individuais e gabaritos por lote.
4. O professor escolhe uma turma e dispara o envio do lote.
5. Cada aluno recebe um e-mail com:
   - identificação da prova;
   - cabeçalho acadêmico;
   - link individual de download do seu PDF.
6. O gabarito não é enviado aos alunos.
7. O envio é determinístico:
   - os alunos são respeitados na ordem da turma;
   - as provas são atribuídas na ordem de `examCode`.
8. Todo envio fica registrado no histórico de e-mails.

# Requisitos não funcionais

- Não depender de anexos pesados para funcionar em ambiente serverless.
- Funcionar com geração sob demanda dos artefatos.
- Manter compatibilidade com o Banco de Provas e o dashboard atuais.
- Expor mensagens claras para turmas vazias, provas insuficientes e erros de envio.

# Fluxo do gabarito

## Geração

1. `GenerateExamInstancesUseCase` randomiza questões e alternativas.
2. Cada `ExamInstance` é persistida com sua ordem final.
3. `CsvFileService.generateAnswerKeyCsv` gera um CSV largo no formato:
   `examCode,q1,q2,...,qN`
4. O lote retorna:
   - PDFs individuais
   - CSV do gabarito
   - `downloadUrl` para cada artefato

## Visualização

1. `GetExamBatchUseCase` reconstroi o gabarito por prova a partir da `ExamInstance`.
2. O frontend mostra:
   - provas individuais;
   - gabarito por questão;
   - botões reais de download.

## Correção

1. O professor envia:
   - CSV de gabarito do lote;
   - CSV de respostas dos alunos.
2. `GradeExamsUseCase` usa o CSV de gabarito como fonte de verdade.
3. O sistema reconstrói os vetores booleanos por questão e aplica:
   - `STRICT`
   - `PROPORTIONAL`

# Arquitetura da feature

## Backend

- `SendExamBatchToClassUseCase`
  - carrega o lote;
  - carrega a turma;
  - resolve os alunos;
  - mapeia aluno -> prova;
  - monta e envia os e-mails;
  - grava o histórico.

- `POST /exam-batches/:batchId/email-dispatch`
  - body:
    ```json
    {
      "classId": "uuid"
    }
    ```

## Frontend

- Banco de Provas (`/exam-bank`)
  - lista templates
  - lista lotes
  - exibe provas + gabaritos
  - abre modal de envio por turma

- Modal de geração
  - após gerar um lote, permite enviar o lote diretamente por e-mail

# Regras de validação

- turma inexistente -> `404`
- lote inexistente -> `404`
- turma sem alunos -> `400`
- provas insuficientes para a turma -> `400`
- aluno referenciado na turma mas ausente no cadastro -> `400`

# Estratégia de determinismo

- ordenar instâncias por `examCode`
- respeitar a ordem de `studentIds` da turma
- atribuir `instances[index]` para `studentIds[index]`

Assim, o mesmo lote e a mesma turma sempre produzem o mesmo mapeamento.

# Testes implementados

## Backend

- rota de geração continua retornando PDF + CSV
- rota de download continua funcional
- nova rota de disparo por e-mail:
  - envia para todos os alunos
  - usa mapeamento determinístico
  - registra histórico

## Frontend

- modal de envio:
  - lista turmas
  - envia a turma selecionada
  - mostra o resumo do resultado

# Validação manual recomendada

1. Criar ou selecionar um template.
2. Gerar um lote com quantidade suficiente para uma turma.
3. Abrir `/exam-bank`.
4. Selecionar o lote.
5. Conferir:
   - PDF individual
   - CSV do gabarito
   - gabarito por prova na UI
6. Enviar para uma turma.
7. Abrir `/emails` e verificar os e-mails registrados.

# Limitações assumidas

- Os alunos recebem link individual, não anexo físico.
- O gabarito continua sendo um artefato do professor.
- O envio usa o serviço de e-mail já configurado no sistema.
