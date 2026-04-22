# language: pt
Funcionalidade: Gerenciamento de alunos

  Cenário: Cadastro de aluno com dados válidos
    Quando eu cadastrar o aluno "Ana Souza" com CPF "52998224725" e e-mail "ana@example.com"
    Então a resposta deve ter status 201
    E o aluno retornado deve ter o nome "Ana Souza"
    E o aluno retornado deve ter o e-mail "ana@example.com"

  Cenário: Erro ao cadastrar aluno com CPF inválido
    Quando eu cadastrar o aluno "João Silva" com CPF "11111111111" e e-mail "joao@example.com"
    Então a resposta deve ter status 400
    E a mensagem de erro deve ser "Dados do aluno inválidos."

  Cenário: Atualização de dados do aluno
    Dado que existe o aluno "Carlos Lima" com CPF "52998224725" e e-mail "carlos@example.com"
    Quando eu atualizar o aluno "Carlos Lima" para o e-mail "carlos.lima@example.com"
    Então a resposta deve ter status 200
    E o aluno retornado deve ter o e-mail "carlos.lima@example.com"

  Cenário: Remoção de aluno existente
    Dado que existe o aluno "Fernanda Rocha" com CPF "52998224725" e e-mail "fernanda@example.com"
    Quando eu remover o aluno "Fernanda Rocha"
    Então a resposta deve ter status 204
    Quando eu listar os alunos
    Então a resposta deve ter status 200
    E a lista de alunos não deve conter "Fernanda Rocha"
