# language: pt
Funcionalidade: Correção de provas

  Esquema do Cenário: Correção rigorosa zera a questão ao menor desvio
    Dado que existe uma instância de prova com 1 questão, 5 alternativas, 2 corretas e identificação "LETTERS"
    Quando eu corrigir as respostas de um aluno com <matchingStates> estados corretos de 5 usando a estratégia "STRICT"
    Então a resposta deve ter status 200
    E o relatório deve conter 1 aluno corrigido
    E a nota da primeira questão do primeiro aluno deve ser <expectedScore>
    E a nota total do primeiro aluno deve ser <expectedScore>

    Exemplos:
      | matchingStates | expectedScore |
      | 5              | 1             |
      | 4              | 0             |

  Esquema do Cenário: Correção proporcional calcula a fração de estados corretos
    Dado que existe uma instância de prova com 1 questão, <totalStates> alternativas, 1 corretas e identificação "POWERS_OF_2"
    Quando eu corrigir as respostas de um aluno com <matchingStates> estados corretos de <totalStates> usando a estratégia "PROPORTIONAL"
    Então a resposta deve ter status 200
    E o relatório deve conter 1 aluno corrigido
    E a nota da primeira questão do primeiro aluno deve ser <expectedScore>
    E a nota total do primeiro aluno deve ser <expectedScore>

    Exemplos:
      | totalStates | matchingStates | expectedScore |
      | 5           | 4              | 0.8           |
      | 4           | 2              | 0.5           |

  Cenário: Correção proporcional considera resposta em branco como todas as alternativas não marcadas
    Dado que existe uma instância de prova com 1 questão, 4 alternativas, 1 corretas e identificação "POWERS_OF_2"
    Quando eu corrigir uma resposta em branco usando a estratégia "PROPORTIONAL"
    Então a resposta deve ter status 200
    E o relatório deve conter 1 aluno corrigido
    E a nota da primeira questão do primeiro aluno deve ser 0.75
    E a nota total do primeiro aluno deve ser 0.75
