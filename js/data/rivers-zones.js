/**
 * Base de Dados Georreferenciada de Rios, Zonas de Pesca e Infraestrutura do Mato Grosso do Sul
 * Inclui:
 * 🟢 Regiões Permitidas
 * 🔴 Zonas Proibidas (Unidades de conservação, santuários e proximidades de barragens/corredeiras)
 * 🟡 Zonas Restritas (Pesque e Solte obrigatório)
 * ⚠️ Áreas de Risco (Pedrais submersos, correntezas e corredeiras violentas)
 * 🐟 Hotspots de Espécies
 * 📍 Acessos a rios e rampas de barcos (🛶)
 * 🏕️ Áreas de camping e apoio
 * ⛽ Abastecimento
 * 🏥 Hospitais e Prontos-Socorros
 * 👮 Postos da PMA (Polícia Militar Ambiental)
 */

export const MS_GEO_BOUNDS = {
  center: [-20.25, -55.5], // Centro aproximado de MS
  zoom: 7,
  minZoom: 6,
  maxZoom: 17,
  bounds: [
    [-24.2, -58.3], // Sudoeste (fronteira Paraguai/Argentina)
    [-17.1, -50.9]  // Nordeste (divisa GO/MG/SP)
  ]
};

export const FISHING_ZONES = [
  // 🔴 ZONAS PROIBIDAS (PESCA TOTALMENTE VEDADA)
  {
    id: "zone-rio-salobra",
    name: "Rio Salobra (Miranda/Bodoquena)",
    category: "prohibited",
    type: "🔴 Área de Pesca Proibida",
    description: "Pesca terminantemente proibida em toda a extensão do Rio Salobra e afluentes (Unidade de Conservação e Berçário da Ictiofauna). Infração de crime ambiental grave.",
    legalBasis: "Decreto Estadual e Resoluções IMASUL de proteção da Serra da Bodoquena",
    coordinates: [
      [-20.45, -56.78],
      [-20.52, -56.88],
      [-20.65, -56.95],
      [-20.73, -56.85],
      [-20.62, -56.72]
    ],
    center: [-20.58, -56.84]
  },
  {
    id: "zone-bonito-formoso-prata",
    name: "Rios Formoso e da Prata (Bonito e Jardim)",
    category: "prohibited",
    type: "🔴 Santuário Ecológico - Proibição Total",
    description: "Pesca PROIBIDA o ano todo nos Rios Formoso, Sucuri, da Prata, Olho d'Água e Peixe. Rios de águas cristalinas destinados exclusivamente à conservação e ecoturismo.",
    legalBasis: "Lei Municipal de Bonito / Leis Estaduais de Preservação Cênica",
    coordinates: [
      [-21.10, -56.45],
      [-21.25, -56.35],
      [-21.48, -56.42],
      [-21.40, -56.60],
      [-21.18, -56.55]
    ],
    center: [-21.28, -56.48]
  },
  {
    id: "zone-barragem-jupia",
    name: "Área de Segurança - Barragem UHE Jupiá (Três Lagoas)",
    category: "prohibited",
    type: "🔴 Raio de 1.500m da Barragem",
    description: "Proibido pescar a menos de 1.500 metros a montante e a jusante da barragem da Usina Hidrelétrica Eng. Souza Dias (Jupiá). Risco mortal de turbilhonamento e comporta.",
    legalBasis: "Portaria IMASUL / Legislação Federal de Segurança de Barragens",
    center: [-20.7836, -51.6311],
    radiusKm: 1.5
  },
  {
    id: "zone-parque-ivinhema",
    name: "Parque Estadual das Várzeas do Rio Ivinhema",
    category: "prohibited",
    type: "🔴 Parque Estadual - Pesca Proibida",
    description: "Proteção integral nas ilhas, canais e lagoas interiores do Parque Estadual das Várzeas do Rio Ivinhema.",
    legalBasis: "Decreto de Criação da Unidade de Conservação de Proteção Integral",
    coordinates: [
      [-22.35, -53.60],
      [-22.65, -53.75],
      [-22.85, -53.65],
      [-22.50, -53.45]
    ],
    center: [-22.58, -53.62]
  },

  // 🟡 ZONAS RESTRITAS (PESQUE E SOLTE OBRIGATÓRIO OU LIMITAÇÕES ESPECIAIS)
  {
    id: "zone-rio-perdido",
    name: "Rio Perdido (Caracol/Porto Murtinho)",
    category: "restricted",
    type: "🟡 Pesque e Solte Obrigatório",
    description: "Permitida exclusivamente a modalidade 'Pesque e Solte'. É terminantemente proibido o abate ou transporte de qualquer peixe nativo capturado neste trecho.",
    legalBasis: "Resolução Conjunta SEMADESC/IMASUL",
    coordinates: [
      [-21.65, -57.45],
      [-21.80, -57.55],
      [-22.05, -57.50],
      [-21.90, -57.35]
    ],
    center: [-21.82, -57.45]
  },
  {
    id: "zone-rio-negro-abobral",
    name: "Rio Negro e Rio Abobral (Pantanal)",
    category: "restricted",
    type: "🟡 Trechos Especiais de Pesque e Solte",
    description: "Área de alta fragilidade pantaneira. Exige extremo respeito às matrizes e cota zero em trechos regulamentados.",
    legalBasis: "Portarias Específicas do IMASUL para o Pantanal da Nhecolândia",
    coordinates: [
      [-19.35, -56.55],
      [-19.65, -56.80],
      [-19.55, -57.05],
      [-19.25, -56.80]
    ],
    center: [-19.45, -56.80]
  },

  // 🟢 REGIÕES PERMITIDAS (PESCA AMADORA DENTRO DAS NORMAS GERAIS)
  {
    id: "zone-rio-paraguai-corumba",
    name: "Rio Paraguai - Região de Corumbá e Ladário",
    category: "permitted",
    type: "🟢 Pesca Permitida (Norma Geral)",
    description: "Pesca amadora permitida para pescadores com licença válida IMASUL. Respeitar cota de 1 exemplar nativo + 5 piranhas e tamanhos legais. Dourado deve ser solto obrigatoriamente.",
    center: [-18.99, -57.65],
    coordinates: [
      [-18.80, -57.70],
      [-19.15, -57.60],
      [-19.20, -57.45],
      [-18.85, -57.50]
    ]
  },
  {
    id: "zone-rio-miranda-passo-lontra",
    name: "Rio Miranda - Passo do Lontra e Estrada Parque",
    category: "permitted",
    type: "🟢 Pesca Permitida (Norma Geral)",
    description: "Região tradicional de pesca esportiva no Pantanal Sul. Excelentes pontos para Pintado, Pacu e Cachara nos canais e balseiros.",
    center: [-19.58, -57.02],
    coordinates: [
      [-19.50, -56.90],
      [-19.75, -57.10],
      [-19.65, -57.18],
      [-19.45, -56.98]
    ]
  },
  {
    id: "zone-rio-aquidauana",
    name: "Rio Aquidauana - Piraputanga e Camisão",
    category: "permitted",
    type: "🟢 Pesca Permitida (Norma Geral)",
    description: "Pesca permitida com vara e anzol. Ótimo ponto para Piraputangas e Piaus nos remansos e corredeiras.",
    center: [-20.46, -55.52],
    coordinates: [
      [-20.40, -55.40],
      [-20.55, -55.65],
      [-20.50, -55.70],
      [-20.35, -55.45]
    ]
  },
  {
    id: "zone-rio-taquari-coxim",
    name: "Rio Taquari e Rio Coxim (Pantanal Norte)",
    category: "permitted",
    type: "🟢 Pesca Permitida (Norma Geral)",
    description: "Bacia do Taquari. Águas com grande ocorrência de Curimbatá, Pintado e Jaú em poços profundos.",
    center: [-18.50, -54.75],
    coordinates: [
      [-18.35, -54.65],
      [-18.65, -54.85],
      [-18.60, -55.00],
      [-18.30, -54.80]
    ]
  },
  {
    id: "zone-rio-parana-tres-lagoas",
    name: "Rio Paraná e Sucuriú - Três Lagoas",
    category: "permitted",
    type: "🟢 Pesca Permitida (Água Cristalina)",
    description: "Região de represas com grande abundância de Tucunaré-azul (sem cota de captura), Corvina e Tilápia. Respeitar limites das barragens.",
    center: [-20.75, -51.70],
    coordinates: [
      [-20.60, -51.60],
      [-20.90, -51.80],
      [-20.85, -51.95],
      [-20.55, -51.75]
    ]
  },
  {
    id: "zone-rio-apa-murtinho",
    name: "Rio Apa e Rio Paraguai - Porto Murtinho",
    category: "permitted",
    type: "🟢 Pesca Permitida na Calha Principal",
    description: "Fronteira com o Paraguai. Região profunda e de forte correnteza com grandes Jaús, Pintados e Dourados (pesque e solte).",
    center: [-21.70, -57.88],
    coordinates: [
      [-21.60, -57.80],
      [-21.85, -57.95],
      [-21.90, -57.85],
      [-21.65, -57.70]
    ]
  }
];

export const POINTS_OF_INTEREST = [
  // ⚠️ ÁREAS DE PERIGO E RISCO NÁUTICO
  {
    id: "risk-corredeiras-palmeiras",
    name: "Cachoeira das Palmeiras (Rio Taquari)",
    type: "⚠️ Corredeiras e Turbilhões Perigosos",
    category: "danger",
    description: "Fortes quedas d'água, pedras submersas afiadas e redemoinhos. Não se aproximar de barco com motor pequeno. Risco de emborcamento.",
    lat: -18.421,
    lng: -54.792
  },
  {
    id: "risk-pedral-albuquerque",
    name: "Pedral Submerso de Albuquerque (Rio Paraguai)",
    type: "⚠️ Pedras Submersas em Maré Baixa",
    category: "danger",
    description: "Na estiagem, lajes de pedra ficam a menos de 30 cm da flor d'água no canal secundário. Risco sério de quebra de hélice e casco.",
    lat: -19.183,
    lng: -57.485
  },
  {
    id: "risk-boca-corixo-negro",
    name: "Confluência Corixo Negro / Paraguai",
    type: "⚠️ Correnteza Traiçoeira e Balseiros de Camalote",
    category: "danger",
    description: "Grandes ilhas flutuantes de aguapés (camalotes) descem com força e podem prender embarcações ou arrancar âncoras durante o vendaval.",
    lat: -18.752,
    lng: -57.589
  },

  // 👮 POSTOS DA POLÍCIA MILITAR AMBIENTAL (PMA)
  {
    id: "pma-corumba",
    name: "1º Pelotão PMA - Corumbá",
    type: "👮 Polícia Militar Ambiental",
    category: "police",
    phone: "(67) 3232-4876",
    address: "Rua Cuiabá, Corumbá - MS",
    description: "Fiscalização ambiental, emissão de lacres e atendimento a ocorrências nos rios do Pantanal.",
    lat: -19.0064,
    lng: -57.6534
  },
  {
    id: "pma-bonito",
    name: "Pelotão PMA - Bonito",
    type: "👮 Polícia Militar Ambiental",
    category: "police",
    phone: "(67) 3255-3220",
    address: "Bonito - MS",
    description: "Fiscalização dos rios da Serra da Bodoquena e santuários ecológicos.",
    lat: -21.1278,
    lng: -56.4839
  },
  {
    id: "pma-miranda",
    name: "Base Avançada PMA - Miranda / Passo do Lontra",
    type: "👮 Polícia Militar Ambiental",
    category: "police",
    phone: "(67) 3242-1246",
    address: "Trecho Estrada Parque / Rio Miranda",
    description: "Posto de bloqueio e fiscalização no coração do Pantanal.",
    lat: -19.5782,
    lng: -57.0189
  },
  {
    id: "pma-coxim",
    name: "Pelotão PMA - Coxim",
    type: "👮 Polícia Militar Ambiental",
    category: "police",
    phone: "(67) 3291-1025",
    address: "Rua Cel. Ponce, Coxim - MS",
    description: "Fiscalização dos Rios Taquari, Coxim e afluentes.",
    lat: -18.5089,
    lng: -54.7541
  },
  {
    id: "pma-tres-lagoas",
    name: "Pelotão PMA - Três Lagoas",
    type: "👮 Polícia Militar Ambiental",
    category: "police",
    phone: "(67) 3929-1360",
    address: "Três Lagoas - MS",
    description: "Fiscalização dos Lagos de Jupiá, Ilha Solteira e Rio Sucuriú.",
    lat: -20.7852,
    lng: -51.7089
  },

  // 🛶 PONTOS DE ACESSO, RAMPAS E MARINAS PÚBLICAS
  {
    id: "ramp-porto-geral-corumba",
    name: "Rampa Pública do Porto Geral (Corumbá)",
    type: "🛶 Rampa de Embarque e Marina",
    category: "access",
    description: "Rampa de concreto larga com fácil manobra de carretas, atracadouros, iluminação pública e posto de combustível ribeirinho próximo.",
    lat: -18.9972,
    lng: -57.6508
  },
  {
    id: "ramp-passo-lontra",
    name: "Rampa da Ponte do Passo do Lontra (Rio Miranda)",
    type: "🛶 Acesso a Barcos e Camping",
    category: "access",
    description: "Acesso direto à Estrada Parque Pantanal. Pousadas com suporte náutico, guias locais e aluguel de barcos com piloteiro.",
    lat: -19.5794,
    lng: -57.0215
  },
  {
    id: "ramp-porto-murtinho",
    name: "Porto Geral de Porto Murtinho (Rio Paraguai)",
    type: "🛶 Rampa Municipal e Cais",
    category: "access",
    description: "Excelente estrutura com rampa para barcos esportivos e grandes lanchas. Ponto de partida para os poços do Rio Apa.",
    lat: -21.6985,
    lng: -57.8842
  },
  {
    id: "ramp-balneario-tres-lagoas",
    name: "Rampa do Balneário Municipal (Três Lagoas)",
    type: "🛶 Rampa e Apoio Náutico",
    category: "access",
    description: "Rampa pavimentada de acesso ao Lago do Rio Sucuriú. Quiosques, banheiros e estacionamento seguro para reboques.",
    lat: -20.7321,
    lng: -51.6854
  },
  {
    id: "ramp-piraputanga",
    name: "Ponto da Ponte de Piraputanga (Rio Aquidauana)",
    type: "🛶 Ponto de Descida de Caiaques e Pequenos Barcos",
    category: "access",
    description: "Acesso de cascalho às margens do Rio Aquidauana. Ideal para pesca de caiaque e arremesso em corredeiras.",
    lat: -20.4612,
    lng: -55.5184
  },

  // 🏕️ ÁREAS DE CAMPING E APOIO AO PESCADOR
  {
    id: "camp-pesqueiro-toca-jacare",
    name: "Pesqueiro & Apoio Pantaneiro (Rio Miranda)",
    type: "🏕️ Pousada e Área de Apoio",
    category: "camping",
    phone: "(67) 9987-1234",
    description: "Venda de iscas vivas (tuvira, caranguejo, minhocuçu), gelo, refeições, aluguel de barcos com motor e piloteiros experientes.",
    lat: -19.6451,
    lng: -56.8821
  },
  {
    id: "camp-porto-da-manga",
    name: "Apoio de Pesca Porto da Manga (Rio Paraguai)",
    type: "🏕️ Ponto de Apoio e Balsa",
    category: "camping",
    description: "Ponto tradicional da travessia de balsa. Venda de combustível, gelo e iscas. Chalés para pescadores amadores.",
    lat: -19.2536,
    lng: -57.2458
  },

  // 🏥 HOSPITAIS E PRONTOS-SOCORROS DE EMERGÊNCIA
  {
    id: "hosp-santa-casa-corumba",
    name: "Santa Casa de Misericórdia de Corumbá",
    type: "🏥 Hospital e Pronto-Socorro 24h",
    category: "hospital",
    phone: "(67) 3234-4400 / 192 (SAMU)",
    address: "Rua 15 de Novembro, Corumbá - MS",
    description: "Atendimento de urgência e emergência 24 horas com suporte a acidentes com animais peçonhentos (soro antiofídico e antiescorpiônico).",
    lat: -19.0098,
    lng: -57.6582
  },
  {
    id: "hosp-hospital-miranda",
    name: "Hospital Municipal Renato Albuquerque Filho (Miranda)",
    type: "🏥 Pronto Atendimento 24h",
    category: "hospital",
    phone: "(67) 3242-1430",
    address: "Miranda - MS",
    description: "Posto de saúde mais próximo para acidentes náuticos no Rio Miranda e Estrada Parque.",
    lat: -20.2415,
    lng: -56.3812
  },
  {
    id: "hosp-regional-coxim",
    name: "Hospital Regional Álvaro Fontoura (Coxim)",
    type: "🏥 Hospital Geral Regional",
    category: "hospital",
    phone: "(67) 3291-1188",
    address: "Rua Virgílio Gonçalves, Coxim - MS",
    description: "Atendimento especializado da região norte pantaneira.",
    lat: -18.5142,
    lng: -54.7610
  },
  {
    id: "hosp-nossa-senhora-auxiliadora",
    name: "Hospital Auxiliadora (Três Lagoas)",
    type: "🏥 Hospital de Urgência de Alta Complexidade",
    category: "hospital",
    phone: "(67) 2105-3500",
    address: "Três Lagoas - MS",
    description: "Pronto-Socorro 24h para traumas náuticos na Bacia do Paraná.",
    lat: -20.7891,
    lng: -51.7042
  },

  // 🐟 HOTSPOTS DE ESPÉCIES
  {
    id: "fish-hotspot-dourado-apa",
    name: "Hotspot: Dourados das Corredeiras do Rio Apa",
    type: "🐟 Hotspot de Pesca Esportiva",
    category: "fish_spot",
    description: "Forte correnteza e pedrais propícios para o arremesso de iscas artificiais no Dourado (Pesque e Solte obrigatório).",
    species: ["Dourado", "Piraputanga", "Curimbatá"],
    lat: -21.842,
    lng: -57.721
  },
  {
    id: "fish-hotspot-pintado-passo-lontra",
    name: "Hotspot: Poços do Pintado e Cachara (Rio Miranda)",
    type: "🐟 Hotspot de Grandes Peixes de Couro",
    category: "fish_spot",
    description: "Curvas de canal de até 12 metros de profundidade com alta concentração de Pintados e Cacharas na tuvira de fundo.",
    species: ["Pintado", "Cachara", "Pacu"],
    lat: -19.592,
    lng: -57.035
  },
  {
    id: "fish-hotspot-tucunare-tres-lagoas",
    name: "Hotspot: Pauleiras do Tucunaré-Azul (Represa Jupiá)",
    type: "🐟 Hotspot de Tucunaré e Corvina",
    category: "fish_spot",
    description: "Águas cristalinas em meio a troncos submersos. Excelente para trabalho de iscas de superfície com ataque visual.",
    species: ["Tucunaré-azul", "Corvina", "Tucunaré-amarelo"],
    lat: -20.718,
    lng: -51.642
  }
];

export const MS_RIVERS_GEO = [
  {
    id: "river-paraguai",
    name: "Rio Paraguai",
    basin: "Bacia do Paraguai",
    lengthKm: "1.400 km em território nacional",
    description: "A grande artéria hidrográfica do Pantanal sul-mato-grossense. Rio navegável de grande porte, célebre pelas viagens em barcos-hotéis e fartura de peixes nobres.",
    coordinates: [
      [-17.65, -57.48],
      [-18.05, -57.55],
      [-18.60, -57.65],
      [-18.99, -57.65],
      [-19.25, -57.25],
      [-19.55, -57.05],
      [-20.40, -57.85],
      [-21.70, -57.88],
      [-22.25, -57.95]
    ]
  },
  {
    id: "river-miranda",
    name: "Rio Miranda",
    basin: "Bacia do Paraguai",
    lengthKm: "490 km",
    description: "Um dos rios mais procurados para a pesca esportiva no Brasil. Atravessa a Serra da Bodoquena e o Pantanal do Abobral, desaguando no Rio Paraguai.",
    coordinates: [
      [-20.85, -55.80],
      [-20.45, -56.10],
      [-20.24, -56.38],
      [-19.85, -56.75],
      [-19.58, -57.02],
      [-19.42, -57.15]
    ]
  },
  {
    id: "river-aquidauana",
    name: "Rio Aquidauana",
    basin: "Bacia do Paraguai",
    lengthKm: "560 km",
    description: "Nasce na Serra de Maracaju e corre para o Pantanal. Famoso pelos paredões de arenito de Piraputanga e pela rica fauna aquática.",
    coordinates: [
      [-20.20, -54.90],
      [-20.46, -55.52],
      [-20.47, -55.78],
      [-20.15, -56.20],
      [-19.85, -56.75]
    ]
  },
  {
    id: "river-taquari",
    name: "Rio Taquari",
    basin: "Bacia do Paraguai",
    lengthKm: "800 km",
    description: "Rio de grande vazão com trecho de planalto pedregoso e trecho pantaneiro de planície com vastas baías e confluências.",
    coordinates: [
      [-18.15, -53.50],
      [-18.35, -54.20],
      [-18.50, -54.75],
      [-18.70, -55.50],
      [-19.10, -56.80]
    ]
  },
  {
    id: "river-parana",
    name: "Rio Paraná (Fronteira Leste MS-SP)",
    basin: "Bacia do Paraná",
    lengthKm: "Trecho MS ~ 400 km",
    description: "Grande calha navegável com águas limpas e represadas pelas usinas. Paraíso da pesca de Tucunarés, Corvinas e esportiva embarcada.",
    coordinates: [
      [-20.10, -51.10],
      [-20.60, -51.60],
      [-20.78, -51.63],
      [-21.50, -52.20],
      [-22.40, -52.90],
      [-23.50, -54.00]
    ]
  }
];
