# language: pt
Funcionalidade: Gerenciamento de provas

  Cenário: Criação de prova com identificação por letras
    Dado que existe uma questão cadastrada com o enunciado "Quanto é 2 + 3?" e as alternativas:
      | description | isCorrect |
      | 4           | false     |
      | 5           | true      |
    E que existe uma questão cadastrada com o enunciado "Quanto é 7 - 2?" e as alternativas:
      | description | isCorrect |
      | 5           | true      |
      | 6           | false     |
    Quando eu criar uma prova com o título "Prova de Matemática A" usando as questões cadastradas e o tipo de alternativa "LETTERS"
    Então a resposta deve ter status 201
    E a prova retornada deve ter o título "Prova de Matemática A"
    E a prova retornada deve usar o tipo de alternativa "LETTERS"
    E a prova retornada deve conter 2 questões no snapshot

  Cenário: Criação de prova com identificação por potências de 2
    Dado que existe uma questão cadastrada com o enunciado "Quanto é 4 x 2?" e as alternativas:
      | description | isCorrect |
      | 6           | false     |
      | 8           | true      |
    E que existe uma questão cadastrada com o enunciado "Quanto é 9 / 3?" e as alternativas:
      | description | isCorrect |
      | 2           | false     |
      | 3           | true      |
    Quando eu criar uma prova com o título "Prova de Matemática B" usando as questões cadastradas e o tipo de alternativa "POWERS_OF_2"
    Então a resposta deve ter status 201
    E a prova retornada deve ter o título "Prova de Matemática B"
    E a prova retornada deve usar o tipo de alternativa "POWERS_OF_2"
    E a prova retornada deve conter 2 questões no snapshot

  Cenário: Imutabilidade do snapshot da prova
    Dado que existe uma questão cadastrada com o enunciado "Enunciado original" e as alternativas:
      | description | isCorrect |
      | A           | true      |
      | B           | false     |
    Quando eu criar uma prova com o título "Prova Imutável" usando as questões cadastradas e o tipo de alternativa "LETTERS"
    Então a resposta deve ter status 201
    Quando eu atualizar a questão original para o enunciado "Enunciado alterado" e as alternativas:
      | description | isCorrect |
      | C           | false     |
      | D           | true      |
    Então a resposta deve ter status 200
    Quando eu consultar a prova cadastrada
    Então a resposta deve ter status 200
    E o snapshot da prova deve manter o enunciado original "Enunciado original"
