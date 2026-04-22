# language: pt
Funcionalidade: Avaliação por metas e alunos

  Contexto:
    Dado que existe o aluno "Ana Souza" com CPF "52998224725" e e-mail "ana@example.com"
    E que existe a meta "Leitura fluente"
    E que existe a turma "Alfabetização" em 2026/1 com os alunos "Ana Souza" e as metas "Leitura fluente"

  Cenário: Registrar avaliação Meta Atingida
    Quando eu avaliar o aluno "Ana Souza" na meta "Leitura fluente" da turma "Alfabetização" como "MA"
    Então a resposta deve ter status 200
    E a avaliação retornada deve ter o nível "MA"

  Cenário: Atualizar avaliação existente
    Dado que o aluno "Ana Souza" foi avaliado na meta "Leitura fluente" da turma "Alfabetização" como "MANA"
    Quando eu avaliar o aluno "Ana Souza" na meta "Leitura fluente" da turma "Alfabetização" como "MPA"
    Então a resposta deve ter status 200
    E a avaliação retornada deve ter o nível "MPA"
    E a lista de avaliações da turma "Alfabetização" deve conter 1 avaliação

  Cenário: Erro ao usar nível inválido
    Quando eu tentar avaliar o aluno "Ana Souza" na meta "Leitura fluente" da turma "Alfabetização" como "XYZ"
    Então a resposta deve ter status 400
