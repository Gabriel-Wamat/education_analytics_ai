# language: pt
Funcionalidade: Geração de provas randomizadas

  Cenário: Geração de 5 instâncias únicas com gabarito consistente
    Dado que existe uma questão cadastrada com o enunciado "Quanto é 3 + 4?" e as alternativas:
      | description | isCorrect |
      | 6           | false     |
      | 7           | true      |
      | 8           | false     |
    E que existe uma questão cadastrada com o enunciado "Quanto é 8 - 5?" e as alternativas:
      | description | isCorrect |
      | 2           | false     |
      | 3           | true      |
      | 4           | false     |
    E eu criar uma prova com o título "Prova Randomizada" usando as questões cadastradas e o tipo de alternativa "LETTERS"
    Então a resposta deve ter status 201
    Quando eu gerar 5 instâncias a partir do modelo de prova cadastrado
    Então a resposta deve ter status 201
    E o lote retornado deve conter 5 instâncias
    E as instâncias geradas devem ter assinaturas únicas
    E ao menos duas instâncias devem ter ordem diferente de questões ou alternativas
    E um arquivo de gabarito CSV deve ter sido gerado
    E o gabarito CSV deve corresponder às respostas corretas das instâncias geradas

  Cenário: Geração é bloqueada para modelo legado sem metadados de cabeçalho
    Dado que existe uma questão cadastrada com o enunciado "Quanto é 5 + 1?" e as alternativas:
      | description | isCorrect |
      | 6           | true      |
      | 7           | false     |
    E eu criar um modelo de prova legado sem cabeçalho com o título "Prova Legada"
    Quando eu gerar 1 instâncias a partir do modelo de prova cadastrado
    Então a resposta deve ter status 400
    E a mensagem de erro deve ser "O modelo de prova precisa ter disciplina, professor e data antes da geração."

  Cenário: Falha quando não existe permutação suficiente para gerar instâncias únicas
    Dado que existe uma questão cadastrada com o enunciado "Quanto é 1 + 1?" e as alternativas:
      | description | isCorrect |
      | 1           | false     |
      | 2           | true      |
    E eu criar uma prova com o título "Prova Limitada" usando as questões cadastradas e o tipo de alternativa "LETTERS"
    Então a resposta deve ter status 201
    Quando eu gerar 3 instâncias a partir do modelo de prova cadastrado
    Então a resposta deve ter status 400
    E a mensagem de erro deve ser "Não foi possível gerar a quantidade solicitada de provas únicas dentro do limite de tentativas."
