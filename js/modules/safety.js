/**
 * Módulo de Segurança, SOS de Emergência e Primeiros Socorros Offline
 * Projetado para operações remotas nas bacias pantaneiras e do Paraná.
 */

export function convertDecimalToDMS(lat, lng) {
  function toDMS(coordinate, isLatitude) {
    const absolute = Math.abs(coordinate);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(1);

    let direction = "";
    if (isLatitude) {
      direction = coordinate >= 0 ? "N" : "S";
    } else {
      direction = coordinate >= 0 ? "L" : "O";
    }

    return `${degrees}°${String(minutes).padStart(2, '0')}'${String(seconds).padStart(4, '0')}"${direction}`;
  }

  return {
    latDMS: toDMS(lat, true),
    lngDMS: toDMS(lng, false),
    fullDMS: `${toDMS(lat, true)} ${toDMS(lng, false)}`,
    decimal: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  };
}

export function generateSOSText(lat, lng) {
  const dms = convertDecimalToDMS(lat, lng);
  const now = new Date().toLocaleString("pt-BR");
  return `EMERGÊNCIA DE PESCA MS: Preciso de socorro imediato no rio. Minhas coordenadas GPS são:
Decimal: ${dms.decimal}
GMS: ${dms.fullDMS}
Mapa: https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}
Data/Hora: ${now}`;
}

export const EMERGENCY_CONTACTS = [
  {
    name: "Polícia Militar Ambiental (PMA) / Emergência",
    number: "190",
    description: "Fiscalização, socorro em rios e ocorrências ambientais"
  },
  {
    name: "Corpo de Bombeiros Militar",
    number: "193",
    description: "Resgate de afogamento, busca náutica e acidentes graves"
  },
  {
    name: "SAMU (Atendimento Médico de Urgência)",
    number: "192",
    description: "Ambulância e orientação médica por rádio/telefone"
  },
  {
    name: "Marinha do Brasil (SALVAMAR / Emergência Marítima)",
    number: "185",
    description: "Capitania dos Portos do Pantanal (Corumbá e Ladário)"
  },
  {
    name: "PMA Corumbá (Base Pantanal Sul)",
    number: "(67) 3232-4876",
    description: "Atendimento direto da bacia do Rio Paraguai"
  },
  {
    name: "PMA Bonito (Serra da Bodoquena)",
    number: "(67) 3255-3220",
    description: "Atendimento na bacia do Rio Miranda e Formoso"
  },
  {
    name: "PMA Coxim (Pantanal Norte)",
    number: "(67) 3291-1025",
    description: "Atendimento nos rios Taquari e Coxim"
  }
];

export const FIRST_AID_GUIDES = [
  {
    id: "stingray",
    title: "Ferrão de Arraia de Rio",
    severity: "Alta Dor / Urgente",
    icon: "⚠️",
    summary: "A toxina do ferrão da arraia é extremamente termolábil (destruída pelo calor).",
    steps: [
      "1. IMERSÃO IMEDIATA EM ÁGUA QUENTE: Coloque o membro ferido em água o mais quente que a vítima suportar (em torno de 45°C a 50°C, sem queimar a pele) por no mínimo 30 a 90 minutos.",
      "2. O calor alivia a dor quase instantaneamente e desnatura as proteínas venenosas.",
      "3. NUNCA coloque gelo, álcool, café, urina ou querosene na ferida.",
      "4. NUNCA faça torniquete (garrote) no membro.",
      "5. Lave a ferida abundantemente com água e sabão neutro para remover muco tóxico.",
      "6. Procure o posto de saúde mais próximo para profilaxia de tétano e avaliação de espículas ósseas retidas."
    ]
  },
  {
    id: "piranha_bite",
    title: "Mordida de Piranha / Cortes Profundos",
    severity: "Hemorragia",
    icon: "🩸",
    summary: "As piranhas arrancam pedaços circulares de carne com dentes afiados causando sangramento intenso.",
    steps: [
      "1. CONTROLE DO SANGRAMENTO: Pressione firmemente o local com gaze esterilizada ou pano limpo.",
      "2. Mantenha o membro lesionado elevado acima do nível do coração.",
      "3. Lave vigorosamente com água limpa para prevenir infecções por bactérias aquáticas (Aeromonas).",
      "4. Faça um curativo compressivo e desloque-se para atendimento médico para sutura se necessário."
    ]
  },
  {
    id: "hook_embedded",
    title: "Anzol Cravado na Pele",
    severity: "Médio",
    icon: "🪝",
    summary: "Técnicas seguras para remoção de anzóis sem rasgar o tecido.",
    steps: [
      "1. Se o anzol estiver próximo aos olhos, pescoço, grandes artérias ou tendões, NÃO TENTE REMOVER. Imobilize e procure um médico.",
      "2. Se estiver na pele (mão/braço) e a farpa NÃO atravessou: use a 'Técnica do Barbante/Linha': amarre uma linha resistente na curva do anzol, pressione o olho do anzol contra a pele e dê um puxão seco e firme no sentido contrário à entrada.",
      "3. Se a ponta e a farpa já atravessaram a pele: avance o anzol até expor a farpa completamente, corte a farpa com um alicate de corte e recue o anzol pelo mesmo caminho de entrada.",
      "4. Desinfete imediatamente com antisséptico e tome vacina antitetânica."
    ]
  },
  {
    id: "snake_bite",
    title: "Picada de Cobra (Jararaca, Cascavel, Surucucu)",
    severity: "Gravíssimo / Emergência Vital",
    icon: "🐍",
    summary: "No Pantanal, picadas de jararaca (Bothrops) são comuns em áreas alagadas.",
    steps: [
      "1. Mantenha a vítima em repouso absoluto. Quanto menos ela se mover, mais devagar o veneno se espalha.",
      "2. Retire imediatamente anéis, sapatos e relógios (a área incha rapidamente).",
      "3. Mantenha o local da picada limpo e nivelado com o corpo.",
      "4. NUNCA faça torniquete, NUNCA corte o local da picada e NUNCA tente chupar o veneno.",
      "5. NÃO aplique substâncias estranhas (folhas, borra de café, álcool).",
      "6. Se for seguro, fotografe a cobra à distância para facilitar a identificação do soro antiofídico no hospital.",
      "7. Acione socorro urgente (193 / 190) ou transporte imediato para o hospital mais próximo."
    ]
  },
  {
    id: "storm_river",
    title: "Tempestade Repentina no Rio (Vento Sul Pantaneiro)",
    severity: "Perigo de Naufrágio",
    icon: "⛈️",
    summary: "Frentes frias chegam subitamente com rajadas de até 80 km/h formando ondas perigosas no Rio Paraguai e represas.",
    steps: [
      "1. Todos a bordo devem VESTIR COLETES SALVA-VIDAS homologados imediatamente.",
      "2. Navegue para a margem de barlavento (lado de onde o vento sopra) e procure remanso ou boca de corixo protegido.",
      "3. NUNCA enfrente ondas grandes de través (de lado). Mantenha a proa cortando as ondas em ângulo oblíquo de 45 graus com velocidade controlada.",
      "4. Se o barco começar a encher de água, esgote com baldes e procure abrigar-se na margem.",
      "5. Em caso de tempestade de raios, afaste-se de árvores isoladas muito altas na beirada e baixe as varas de pesca (carbono atrai descargas elétricas)."
    ]
  }
];
