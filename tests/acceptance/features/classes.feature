# language: pt
Funcionalidade: Gerenciamento de turmas

  Contexto:
    Dado que existe o aluno "Ana Souza" com CPF "52998224725" e e-mail "ana@example.com"
    E que existe a meta "Leitura fluente"
    E que existe a meta "Interpretação de texto"

  Cenário: Cadastro de turma com alunos e metas
    Quando eu cadastrar a turma "Alfabetização" em 2026/1 com os alunos "Ana Souza" e as metas "Leitura fluente, Interpretação de texto"
    Então a resposta deve ter status 201
    E a turma retornada deve ter o tema "Alfabetização"
    E a turma retornada deve ter 1 aluno e 2 metas

  Cenário: Erro ao criar turma com aluno inexistente
    Quando eu tentar cadastrar a turma "Ciências" em 2026/1 com os alunos "Zé Desconhecido" e as metas "Leitura fluente"
    Então a resposta deve ter status 400

  Cenário: Atualização de turma removendo uma meta
    Dado que existe a turma "Alfabetização" em 2026/1 com os alunos "Ana Souza" e as metas "Leitura fluente, Interpretação de texto"
    Quando eu atualizar a turma "Alfabetização" para manter apenas a meta "Leitura fluente"
    Então a resposta deve ter status 200
    E a turma retornada deve ter 1 aluno e 1 metas
