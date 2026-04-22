# language: pt
Funcionalidade: Resumo diário de avaliações por e-mail

  Contexto:
    Dado que existe o aluno "Ana Souza" com CPF "52998224725" e e-mail "ana@example.com"
    E que existe a meta "Leitura fluente"
    E que existe a meta "Interpretação de texto"
    E que existe a turma "Alfabetização" em 2026/1 com os alunos "Ana Souza" e as metas "Leitura fluente, Interpretação de texto"

  Cenário: Uma alteração de avaliação gera um único e-mail por aluno
    Quando eu avaliar o aluno "Ana Souza" na meta "Leitura fluente" da turma "Alfabetização" como "MPA"
    E eu avaliar o aluno "Ana Souza" na meta "Interpretação de texto" da turma "Alfabetização" como "MA"
    E eu processar o resumo diário de avaliações
    Então a resposta deve ter status 200
    E o resumo deve indicar 1 e-mail enviado
    E o e-mail enviado deve ter como destinatário "ana@example.com"
    E o e-mail enviado deve mencionar "Leitura fluente"
    E o e-mail enviado deve mencionar "Interpretação de texto"

  Cenário: Quando não há alterações do dia, nenhum e-mail é enviado
    Quando eu processar o resumo diário de avaliações
    Então a resposta deve ter status 200
    E o resumo deve indicar 0 e-mail enviado
