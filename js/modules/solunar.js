/**
 * Motor Astronômico e Teoria Solunar 100% Offline
 * Calcula com precisão matemática:
 * - Fases da Lua (Nova, Crescente, Cheia, Minguante)
 * - Porcentagem de iluminação e idade da lua
 * - Nascer, trânsito e pôr do sol
 * - Períodos Maiores e Menores de alimentação dos peixes (Major/Minor Solunar Periods)
 * - Índice de atividade da pesca (Ruim, Regular, Bom, Excelente)
 */

// Mês sinódico lunar (duração média entre luas novas)
const SYNODIC_MONTH = 29.53058867;
// Época de referência conhecida para Lua Nova: 11 de janeiro de 2024, 11:57 UTC
const REFERENCE_NEW_MOON_EPOCH = Date.UTC(2024, 0, 11, 11, 57, 0);

// Coordenadas padrão para MS (se GPS estiver desligado)
const DEFAULT_LAT = -20.4428; // Campo Grande / Centro MS
const DEFAULT_LNG = -54.6464;

/**
 * Retorna as informações da fase da lua para uma data qualquer
 */
export function getMoonPhase(targetDate = new Date()) {
  const time = targetDate.getTime();
  const diffDays = (time - REFERENCE_NEW_MOON_EPOCH) / (1000 * 60 * 60 * 24);
  const cycle = ((diffDays % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  const age = cycle;
  const phaseFraction = cycle / SYNODIC_MONTH;

  // Iluminação percentual de 0% a 100%
  const illumination = Math.round(((1 - Math.cos(phaseFraction * 2 * Math.PI)) / 2) * 100);

  let phaseName = "";
  let phaseIcon = "🌑";
  let phaseCategory = "nova";

  if (age < 1.84) {
    phaseName = "Lua Nova";
    phaseIcon = "🌑";
    phaseCategory = "nova";
  } else if (age < 5.53) {
    phaseName = "Crescente Inicial";
    phaseIcon = "🌒";
    phaseCategory = "crescente";
  } else if (age < 9.22) {
    phaseName = "Quarto Crescente";
    phaseIcon = "🌓";
    phaseCategory = "quarto_crescente";
  } else if (age < 12.91) {
    phaseName = "Gibosa Crescente";
    phaseIcon = "🌔";
    phaseCategory = "crescente";
  } else if (age < 16.61) {
    phaseName = "Lua Cheia";
    phaseIcon = "🌕";
    phaseCategory = "cheia";
  } else if (age < 20.30) {
    phaseName = "Gibosa Minguante";
    phaseIcon = "🌖";
    phaseCategory = "minguante";
  } else if (age < 23.99) {
    phaseName = "Quarto Minguante";
    phaseIcon = "🌗";
    phaseCategory = "quarto_minguante";
  } else if (age < 27.68) {
    phaseName = "Minguante Final";
    phaseIcon = "🌘";
    phaseCategory = "minguante";
  } else {
    phaseName = "Lua Nova";
    phaseIcon = "🌑";
    phaseCategory = "nova";
  }

  return {
    name: phaseName,
    icon: phaseIcon,
    category: phaseCategory,
    illumination,
    age: Math.round(age * 10) / 10,
    fraction: phaseFraction
  };
}

/**
 * Cálculo matemático de Nascer e Pôr do Sol (Algoritmo Solar NOAA)
 */
export function getSunTimes(targetDate = new Date(), lat = DEFAULT_LAT, lng = DEFAULT_LNG) {
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;
  const day = targetDate.getDate();

  // Dia do ano
  const n1 = Math.floor(275 * month / 9);
  const n2 = Math.floor((month + 9) / 12);
  const n3 = (1 + Math.floor((year - 4 * Math.floor(year / 4) + 2) / 3));
  const dayOfYear = n1 - (n2 * n3) + day - 30;

  // Longitude em horas e aproximações de tempo
  const lngHour = lng / 15.0;

  function calcTime(isSunrise) {
    const t = isSunrise 
      ? dayOfYear + ((6 - lngHour) / 24)
      : dayOfYear + ((18 - lngHour) / 24);

    // Anomalia solar média
    const M = (0.9856 * t) - 3.289;

    // Longitude verdadeira do Sol
    let L = M + (1.916 * Math.sin(M * Math.PI / 180)) + (0.020 * Math.sin(2 * M * Math.PI / 180)) + 282.634;
    L = (L + 360) % 360;

    // Ascensão reta
    let RA = Math.atan(0.91764 * Math.tan(L * Math.PI / 180)) * 180 / Math.PI;
    RA = (RA + 360) % 360;

    const Lquadrant = Math.floor(L / 90) * 90;
    const RAquadrant = Math.floor(RA / 90) * 90;
    RA = (RA + (Lquadrant - RAquadrant)) / 15;

    // Declinação do Sol
    const sinDec = 0.39782 * Math.sin(L * Math.PI / 180);
    const cosDec = Math.cos(Math.asin(sinDec));

    // Ângulo zenital para nascer/pôr do sol oficial (90°50')
    const zenith = 90.8333;
    const cosH = (Math.cos(zenith * Math.PI / 180) - (sinDec * Math.sin(lat * Math.PI / 180))) / (cosDec * Math.cos(lat * Math.PI / 180));

    if (cosH > 1) return null; // Sempre noite
    if (cosH < -1) return null; // Sempre dia

    const H = isSunrise ? (360 - Math.acos(cosH) * 180 / Math.PI) : (Math.acos(cosH) * 180 / Math.PI);
    const Hhours = H / 15;

    // Tempo médio local em horas
    const T = Hhours + RA - (0.06571 * t) - 6.622;

    // Converter para UTC
    let UT = (T - lngHour + 24) % 24;

    // Fuso horário do Mato Grosso do Sul (UTC-4)
    const msOffset = -4;
    let localHours = (UT + msOffset + 24) % 24;

    const hours = Math.floor(localHours);
    const minutes = Math.floor((localHours - hours) * 60);

    return {
      hours,
      minutes,
      formatted: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    };
  }

  const sunrise = calcTime(true) || { formatted: "05:45", hours: 5, minutes: 45 };
  const sunset = calcTime(false) || { formatted: "18:05", hours: 18, minutes: 5 };

  // Meio-dia solar aproximado
  const solarNoonMinutes = Math.round(((sunrise.hours * 60 + sunrise.minutes) + (sunset.hours * 60 + sunset.minutes)) / 2);
  const noonH = Math.floor(solarNoonMinutes / 60);
  const noonM = solarNoonMinutes % 60;
  const solarNoon = {
    hours: noonH,
    minutes: noonM,
    formatted: `${String(noonH).padStart(2, '0')}:${String(noonM).padStart(2, '0')}`
  };

  return { sunrise, sunset, solarNoon };
}

/**
 * Calcula a Tábua Solunar completa:
 * - Períodos Maiores (Major Periods - Trânsito lunar direto e oposto ~2 horas)
 * - Períodos Menores (Minor Periods - Nascer e Pôr da Lua ~1 hora)
 * - Score Solunar de Atividade dos Peixes
 */
export function getSolunarDay(targetDate = new Date(), lat = DEFAULT_LAT, lng = DEFAULT_LNG) {
  const moon = getMoonPhase(targetDate);
  const sun = getSunTimes(targetDate, lat, lng);

  // Deslocamento médio lunar em relação ao sol: a lua se atrasa aprox. 50 minutos por dia
  // Baseando-se na idade da lua para estimar os horários de trânsito lunar
  const moonOffsetMinutes = (moon.age * (24 * 60 / SYNODIC_MONTH)) % (24 * 60);
  
  // Trânsito Superior (Overhead - Lua no zênite)
  // Na lua nova, transita ao meio-dia; na cheia, transita à meia-noite
  let transitOverheadMinutes = (sun.solarNoon.hours * 60 + sun.solarNoon.minutes + moonOffsetMinutes) % (24 * 60);
  // Trânsito Inferior (Underfoot - Lua do outro lado da terra, 12h depois)
  let transitUnderfootMinutes = (transitOverheadMinutes + 12 * 60) % (24 * 60);

  // Nascer da lua (~6h antes do overhead) e Pôr da lua (~6h depois do overhead)
  let moonRiseMinutes = (transitOverheadMinutes - 6 * 60 + 24 * 60) % (24 * 60);
  let moonSetMinutes = (transitOverheadMinutes + 6 * 60) % (24 * 60);

  function formatTimeWindow(centerMinutes, halfDurationMinutes) {
    const startM = (centerMinutes - halfDurationMinutes + 24 * 60) % (24 * 60);
    const endM = (centerMinutes + halfDurationMinutes) % (24 * 60);

    const sh = String(Math.floor(startM / 60)).padStart(2, '0');
    const sm = String(Math.floor(startM % 60)).padStart(2, '0');
    const eh = String(Math.floor(endM / 60)).padStart(2, '0');
    const em = String(Math.floor(endM % 60)).padStart(2, '0');

    return `${sh}:${sm} às ${eh}:${em}`;
  }

  const major1 = formatTimeWindow(transitOverheadMinutes, 60); // 2h de duração
  const major2 = formatTimeWindow(transitUnderfootMinutes, 60); // 2h de duração
  const minor1 = formatTimeWindow(moonRiseMinutes, 30); // 1h de duração
  const minor2 = formatTimeWindow(moonSetMinutes, 30); // 1h de duração

  // Cálculo da pontuação Solunar (1 a 5 estrelas)
  // Luas Cheias e Luas Novas têm maior força gravitacional (maré de sizígia) -> maior atividade
  let ratingScore = 2; // base
  if (moon.category === "cheia" || moon.category === "nova") {
    ratingScore += 2;
  } else if (moon.category === "quarto_crescente" || moon.category === "quarto_minguante") {
    ratingScore += 0;
  } else {
    ratingScore += 1;
  }

  let ratingLabel = "Regular";
  let ratingColor = "info";
  let ratingDescription = "Atividade moderada. Melhores chances durante os períodos de trânsito lunar e nascer/pôr do sol.";

  if (ratingScore >= 4) {
    ratingLabel = "Muito Bom / Excelente";
    ratingColor = "success";
    ratingDescription = "Forte atração gravitacional. Peixes em alta movimentação alimentar nas janelas solunares!";
  } else if (ratingScore === 3) {
    ratingLabel = "Bom";
    ratingColor = "primary";
    ratingDescription = "Boas condições gerais. Concentre os arremessos nos períodos maiores.";
  } else {
    ratingLabel = "Regular a Baixo";
    ratingColor = "warning";
    ratingDescription = "Peixes manhosos. Aposte em iscas naturais no fundo ou trabalhos lentos.";
  }

  return {
    date: targetDate,
    moon,
    sun,
    majorPeriods: [
      { name: "Período Maior 1 (Trânsito Superior)", window: major1, importance: "Muito Alta" },
      { name: "Período Maior 2 (Trânsito Inferior)", window: major2, importance: "Muito Alta" }
    ],
    minorPeriods: [
      { name: "Período Menor 1 (Nascer da Lua)", window: minor1, importance: "Média" },
      { name: "Período Menor 2 (Pôr da Lua)", window: minor2, importance: "Média" }
    ],
    rating: {
      score: ratingScore,
      stars: "⭐".repeat(ratingScore),
      label: ratingLabel,
      color: ratingColor,
      description: ratingDescription
    }
  };
}
