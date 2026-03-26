# language: pt
Funcionalidade: Gerenciamento de questões

  Cenário: Cadastro de questão válida com múltiplas alternativas
    Quando eu cadastrar uma questão com o enunciado "Quanto é 2 + 2?" e as alternativas:
      | description | isCorrect |
      | 3           | false     |
      | 4           | true      |
      | 5           | false     |
    Então a resposta deve ter status 201
    E a questão retornada deve ter o enunciado "Quanto é 2 + 2?"
    E a questão retornada deve conter 3 alternativas
    E a questão retornada deve ter exatamente 1 alternativa correta

  Cenário: Erro ao tentar cadastrar questão sem alternativa correta
    Quando eu tentar cadastrar uma questão inválida com o enunciado "Capital do Brasil?" e as alternativas:
      | description    | isCorrect |
      | São Paulo      | false     |
      | Rio de Janeiro | false     |
    Então a resposta deve ter status 400
    E a mensagem de erro deve ser "Falha na validação da questão."
    E os detalhes do erro devem conter "A questão deve ter pelo menos uma alternativa correta."

  Cenário: Atualização completa do enunciado e alternativas
    Dado que existe uma questão cadastrada com o enunciado "Quanto é 5 + 5?" e as alternativas:
      | description | isCorrect |
      | 10          | true      |
      | 12          | false     |
    Quando eu atualizar a questão cadastrada para o enunciado "Quanto é 6 + 6?" e as alternativas:
      | description | isCorrect |
      | 11          | false     |
      | 12          | true      |
      | 13          | false     |
    Então a resposta deve ter status 200
    E a questão retornada deve ter o enunciado "Quanto é 6 + 6?"
    E a questão retornada deve conter 3 alternativas
    E a questão retornada deve ter exatamente 1 alternativa correta

  Cenário: Remoção física de uma questão
    Dado que existe uma questão cadastrada com o enunciado "Quanto é 10 - 4?" e as alternativas:
      | description | isCorrect |
      | 5           | false     |
      | 6           | true      |
    Quando eu remover a questão cadastrada
    Então a resposta deve ter status 204
    Quando eu consultar a questão cadastrada removida
    Então a resposta deve ter status 404
    E a mensagem de erro deve ser "Questão não encontrada."
