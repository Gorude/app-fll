/**
 * Legislação Consolidada de Pesca Amadora de Mato Grosso do Sul
 * Fontes oficiais:
 * - Lei Estadual nº 6.390 de 27 de março de 2025 (Prorrogação da proibição do Dourado até 31/03/2027)
 * - Lei Estadual nº 5.321 de 10 de janeiro de 2019
 * - Decreto Estadual nº 15.166 de 21 de fevereiro de 2019 (Regulamento de Pesca e Cota de Transporte)
 * - Portarias do IMASUL (Instituto de Meio Ambiente de Mato Grosso do Sul)
 * - Lei Federal de Crimes Ambientais nº 9.605/1998 e Decreto nº 6.514/2008
 */

export const LAWS_DATA = {
  lastUpdated: "2026",
  officialAuthority: "IMASUL / SEMADESC / Polícia Militar Ambiental (PMA-MS)",
  
  coreRules: [
    {
      id: "law-dourado",
      title: "Lei do Dourado (Lei nº 6.390/2025 e Lei nº 5.321/2019)",
      badge: "Proteção Especial - Até 2027",
      status: "critical",
      summary: "É terminantemente PROIBIDA a captura, o embarque, o transporte, a comercialização, o processamento e a industrialização da espécie Dourado (Salminus brasiliensis) em todos os rios de Mato Grosso do Sul.",
      details: "A proteção foi estendida formalmente até 31 de março de 2027. É permitida unicamente a modalidade 'Pesque e Solte'. O exemplar fisgado deve ser manuseado com rapidez, oxigenado e devolvido com vida à água no mesmo local da captura.",
      penalty: "Apreensão imediata dos apetrechos, embarcação, veículo e multa gravíssima por crime ambiental (Lei 9.605/98)."
    },
    {
      id: "law-quota",
      title: "Cota de Transporte e Captura (Decreto nº 15.166/2019)",
      badge: "Cota Máxima Permitida",
      status: "important",
      summary: "O pescador amador licenciado pode transportar apenas 1 (um) exemplar de peixe nativo dentro das medidas permitidas + até 5 exemplares de piranha.",
      details: "Para o transporte intermunicipal ou interestadual, o pescador deve possuir a Licença Ambiental de Pesca do IMASUL ativa e solicitar a Guia de Controle de Pescado (Lacre). O exemplar nativo deve obrigatoriamente estar dentro do intervalo entre o tamanho mínimo e o tamanho máximo da espécie.",
      exceptions: "Espécies exóticas (Tucunaré, Tilápia, Corvina, Carpa, Bagre-africano) NÃO POSSUEM LIMITE DE COTA NEM TAMANHO MÍNIMO, sendo sua retirada incentivada para o controle populacional."
    },
    {
      id: "law-piracema",
      title: "Período de Defeso / Piracema",
      badge: "Novembro a Fevereiro",
      status: "warning",
      summary: "Período anual de reprodução natural das espécies nos rios do estado.",
      details: "Na Bacia do Rio Paraguai, o defeso vigora geralmente de 05 de novembro até 28 de fevereiro. Na Bacia do Rio Paraná, de 01 de novembro até 28 de fevereiro. Durante a piracema, a pesca amadora é proibida em quase toda a bacia hidrográfica, com exceções pontuais regulamentadas pelo IMASUL (como a abertura do Pesque e Solte no canal principal em fevereiro em anos autorizados).",
      penalty: "Prisão em flagrante de 1 a 3 anos e multa administrativa que varia de R$ 700 a R$ 100.000, com acréscimo de R$ 20 por quilo de pescado apreendido."
    },
    {
      id: "law-license",
      title: "Licença Digital de Pesca Amadora (IMASUL)",
      badge: "Obrigatória",
      status: "info",
      summary: "Porte obrigatório da Autorização Ambiental para Pesca Amadora e Desportiva emitida pelo IMASUL.",
      details: "A licença pode ser obtida digitalmente pelo portal do IMASUL (sistema SIRGHA/Gepesca). Modalidades: Desembarcada (pesca de barranco), Embarcada (barcos a motor ou remo) e Subaquática (em locais autorizados). O pescador deve portar o documento impresso ou no celular junto a um documento oficial com foto. Aposentados e maiores de 65 anos possuem isenção de taxa, mas devem emitir a carteira de isento.",
      link: "https://www.imasul.ms.gov.br"
    },
    {
      id: "law-gear",
      title: "Apetrechos Permitidos vs. Proibidos",
      badge: "Equipamentos",
      status: "standard",
      allowed: [
        "Linha de mão e caniço simples",
        "Vara com molinete ou carretilha",
        "Iscas naturais com anzol simples ou circular",
        "Iscas artificiais com garateias sem farpa ou com farpas amassadas (recomendado na pesca esportiva)",
        "Puçá ou passaguá de mão para embarque do peixe vivo",
        "Espingarda de mergulho (apenas em rios onde a pesca subaquática é expressamente autorizada)"
      ],
      forbidden: [
        "Redes de emalhar de qualquer malha",
        "Tarrafas de qualquer tamanho para pesca amadora",
        "Espinhéis, cordas de espinhel e palangres",
        "Anzol de galho, joão-bobo (bóia louca) e cavalinho",
        "Covos, jequis e armadilhas de peixe",
        "Arpão ou zagaia operados de cima da embarcação",
        "Explosivos, dinamite ou substâncias químicas e tóxicas (crime inafiançável)",
        "Bater na água com remos para espantar peixes para a margem"
      ]
    },
    {
      id: "law-forbidden-places",
      title: "Locais com Pesca Permanentemente Proibida",
      badge: "Distâncias Mínimas Legais",
      status: "critical",
      summary: "Mesmo fora do defeso, a pesca é vedada em pontos estratégicos de trânsito e reprodução dos peixes:",
      locations: [
        "A menos de 200 metros a montante e a jusante de cachoeiras, corredeiras e escadas de peixes;",
        "A menos de 1.500 metros a montante e a jusante de barragens de usinas hidrelétricas;",
        "A menos de 500 metros de confluências e saídas de lagoas e corixos de desova;",
        "Em Unidades de Conservação de Proteção Integral (Parques Nacionais, Parques Estaduais, Estações Ecológicas);",
        "Em rios declarados como santuários (ex: Rio Formoso, Rio da Prata, Rio Salobra, Rio Corguinho);"
      ]
    },
    {
      id: "law-transport",
      title: "Regras de Transporte e Lacre de Pescado",
      badge: "Fiscalização PMA",
      status: "warning",
      summary: "Como transportar o peixe pescado legalmente sem risco de apreensão:",
      steps: [
        "1. Certifique-se de que o exemplar é de espécie nativa com abate permitido (NÃO é Dourado).",
        "2. Meça o peixe com régua rígida e comprove que está RIGOROSAMENTE entre o tamanho mínimo e o tamanho máximo.",
        "3. O peixe deve ser mantido com cabeça, cauda, escamas ou pele íntegros para que a fiscalização da PMA possa medir e identificar a espécie.",
        "4. É proibido transportar peixe nativo cortado em postas, filés ou moído se estiver no barco ou na estrada sem a devida guia e lacre.",
        "5. Apresente a Autorização de Pesca Amadora do IMASUL e solicite o lacre e vistoria no posto da Polícia Militar Ambiental antes de ingressar nas rodovias interestaduais."
      ]
    }
  ],

  penalties: {
    administrative: "Multas de R$ 700,00 a R$ 100.000,00, calculadas com base na gravidade da infração, mais R$ 20,00 por quilograma ou fração do produto da pesca.",
    judicial: "Pena de detenção de 1 (um) a 3 (três) anos (Artigo 34 da Lei Federal nº 9.605/1998).",
    confiscation: "Apreensão sumária e definitiva de embarcações, motores de popa, veículos de tração, carretas de reboque, varas, molinetes, caixas térmicas e todo material empregado na infração."
  }
};
