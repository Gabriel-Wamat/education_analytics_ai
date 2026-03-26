# language: pt
Funcionalidade: Insights educacionais

  Cenário: Dashboard e insights são gerados a partir de métricas agregadas da turma
    Dado que existe um relatório de prova corrigida com duas questões e dois alunos
    Quando eu consultar os insights educacionais dessa prova
    Então a resposta deve ter status 200
    E as métricas do dashboard devem indicar 2 alunos e média 1.5
    E as métricas do dashboard devem indicar percentual médio 75
    E a linha da questão 1 deve indicar média 0.5 e taxa de acerto completo 50
    E a barra da questão 2 deve indicar taxa de acerto 100 e média percentual 100
    E o donut da questão 1 deve indicar 1 marcação na alternativa "2" e 1 marcação na alternativa "3"
    E o provider de IA deve ter recebido métricas agregadas sem dados pessoais
    E o texto de insights deve ser retornado

  Cenário: Timeout do provedor de IA não derruba o endpoint de insights
    Dado que existe um relatório de prova corrigida com duas questões e dois alunos
    E que o provider de IA está indisponível por timeout
    Quando eu consultar os insights educacionais dessa prova
    Então a resposta deve ter status 200
    E as métricas do dashboard devem indicar 2 alunos e média 1.5
    E o aviso de insights indisponíveis deve ser retornado
    E o campo de insights deve vir nulo
