/**
 * Base de Conhecimento e Perguntas Frequentes para Consulta Offline
 * Suporta busca por palavras-chave e processamento de linguagem natural simples no cliente.
 */

export const FAQ_QA_DATA = [
  {
    keywords: ["dourado", "posso levar dourado", "levar dourado", "abater dourado", "cota dourado"],
    question: "Posso levar ou abater o peixe Dourado no Mato Grosso do Sul?",
    answer: "NÃO! É terminantemente proibido matar, abater ou transportar o Dourado em Mato Grosso do Sul. Pela Lei Estadual nº 6.390/2025 (prorrogada até março de 2027), a pesca do Dourado é permitida exclusivamente na modalidade 'Pesque e Solte'. Todo exemplar capturado deve ser devolvido com vida ao rio imediatamente.",
    category: "leis",
    actionLink: "#view-species",
    speciesId: "dourado"
  },
  {
    keywords: ["pintado", "tamanho pintado", "medida pintado", "posso levar pintado", "cota pintado"],
    question: "Qual o tamanho mínimo e máximo para levar o Pintado?",
    answer: "Para o Pintado (Pseudoplatystoma corruscans), a medida permitida é entre 85 cm (mínimo) e 125 cm (máximo). Peixes menores que 85 cm ou maiores que 125 cm devem ser soltos imediatamente. Você pode levar no máximo 1 exemplar por pescador licenciado.",
    category: "medidas",
    actionLink: "#view-calculator",
    speciesId: "pintado"
  },
  {
    keywords: ["cachara", "tamanho cachara", "medida cachara", "posso levar cachara"],
    question: "Qual a medida permitida para a Cachara?",
    answer: "Para a Cachara (Pseudoplatystoma reticulatum), o tamanho mínimo é 80 cm e o tamanho máximo é 120 cm. Apenas 1 exemplar nativo é permitido para transporte.",
    category: "medidas",
    actionLink: "#view-calculator",
    speciesId: "cachara"
  },
  {
    keywords: ["pacu", "tamanho pacu", "medida pacu", "posso levar pacu"],
    question: "Qual o tamanho mínimo e máximo do Pacu?",
    answer: "Para o Pacu (Piaractus mesopotamicus), o tamanho permitido é entre 45 cm (mínimo) e 65 cm (máximo). Abaixo de 45 cm ou acima de 65 cm é obrigatório soltar.",
    category: "medidas",
    actionLink: "#view-calculator",
    speciesId: "pacu"
  },
  {
    keywords: ["jau", "tamanho jau", "medida jau", "posso levar jau"],
    question: "Qual o tamanho do Jaú no MS?",
    answer: "O tamanho permitido do Jaú é entre 95 cm (mínimo) e 130 cm (máximo). Peixes maiores que 130 cm são matrizes centenárias que devem continuar no rio para desova.",
    category: "medidas",
    actionLink: "#view-calculator",
    speciesId: "jau"
  },
  {
    keywords: ["cota", "quantos peixes posso levar", "cota zero", "limite de peixe", "transporte"],
    question: "Quantos peixes posso transportar no Mato Grosso do Sul?",
    answer: "A cota estadual para o pescador amador licenciado é de 1 (um) exemplar de espécie nativa (respeitando rigorosamente os tamanhos mínimo e máximo) + até 5 exemplares de piranhas. Espécies exóticas (Tucunaré, Tilápia, Corvina) não possuem limite de cota.",
    category: "leis",
    actionLink: "#view-laws"
  },
  {
    keywords: ["piracema", "defeso", "quando comeca piracema", "quando termina defeso", "pesca proibida mes"],
    question: "Quando é o período de Defeso (Piracema) no MS?",
    answer: "A Piracema ocorre anualmente entre novembro e fevereiro. Na Bacia do Rio Paraguai, geralmente de 05 de novembro a 28 de fevereiro. Na Bacia do Rio Paraná, de 01 de novembro a 28 de fevereiro. Durante esse período, a pesca é vedada para a reprodução dos peixes.",
    category: "defeso",
    actionLink: "#view-defeso"
  },
  {
    keywords: ["tarrafa", "rede", "espinhel", "petrechos", "vara", "posso usar tarrafa"],
    question: "Posso usar tarrafa ou rede na pesca amadora?",
    answer: "NÃO! Para o pescador amador, o uso de redes de emalhar, tarrafas, espinhéis, covos, anzóis de galho e joão-bobo é CRIME AMBIENTAL com apreensão de equipamento e detenção. O amador só pode usar linha de mão, caniço simples, vara com molinete ou carretilha.",
    category: "leis",
    actionLink: "#view-laws"
  },
  {
    keywords: ["rio salobra", "posso pescar no rio salobra", "salobra", "bonito"],
    question: "Posso pescar no Rio Salobra ou nos rios de Bonito?",
    answer: "NÃO! O Rio Salobra em Miranda/Bodoquena é berçário ecológico com pesca totalmente proibida. Em Bonito e Jardim (Rios Formoso, da Prata, Sucuri, Peixe), a pesca também é permanentemente proibida para fins de preservação e ecoturismo.",
    category: "locais",
    actionLink: "#view-map"
  },
  {
    keywords: ["tucunare", "cota tucunare", "tamanho tucunare", "posso levar tucunare"],
    question: "Qual a cota e o tamanho do Tucunaré?",
    answer: "O Tucunaré é uma espécie exótica na Bacia do Rio Paraná (represas de Três Lagoas e região). Por ser exótico, NÃO HÁ TAMANHO MÍNIMO E NEM LIMITE DE COTA. Você pode capturar e transportar qualquer quantidade, o que auxilia no controle da espécie.",
    category: "especies",
    actionLink: "#view-species",
    speciesId: "tucunare_azul"
  },
  {
    keywords: ["licenca", "como tirar licenca", "imasul", "carteirinha de pesca"],
    question: "Como tirar a licença de pesca do Mato Grosso do Sul?",
    answer: "A Autorização Ambiental de Pesca Amadora deve ser emitida no site do IMASUL (sistema SIRGHA/Gepesca). Ela é gerada online após o pagamento da taxa estadual e tem validade de 1 ano.",
    category: "leis",
    actionLink: "#view-laws"
  },
  {
    keywords: ["arraia", "ferrao de arraia", "mordida piranha", "primeiros socorros", "socorro", "picada"],
    question: "O que fazer em caso de ferrão de arraia ou acidente no rio?",
    answer: "Em caso de ferretoada de arraia: mergulhe o local imediatamente em ÁGUA QUENTE (o mais quente que suportar sem queimar) por 30 a 90 minutos. O calor neutraliza a toxina termolábil. NUNCA coloque gelo ou faça torniquete. Procure atendimento médico urgente para limpeza cirúrgica e vacina antitetânica.",
    category: "seguranca",
    actionLink: "#view-safety"
  }
];
