/**
 * Módulo de Previsão do Tempo, Barômetro e Ciclo dos Rios do Pantanal
 * Funciona online com Open-Meteo API (sem chave) e armazena automaticamente em cache
 * para acesso 100% offline no barco ou acampamento.
 */

import { saveWeatherCache, getWeatherCache } from "../db.js";
import { getSunTimes } from "./solunar.js";

export const MS_FISHING_CITIES = [
  { id: "corumba", name: "Corumbá (Rio Paraguai)", lat: -19.0064, lng: -57.6534, basin: "Paraguai" },
  { id: "miranda", name: "Miranda (Passo do Lontra)", lat: -20.2415, lng: -56.3812, basin: "Paraguai" },
  { id: "aquidauana", name: "Aquidauana / Piraputanga", lat: -20.4612, lng: -55.5184, basin: "Paraguai" },
  { id: "coxim", name: "Coxim (Rio Taquari)", lat: -18.5089, lng: -54.7541, basin: "Paraguai" },
  { id: "porto_murtinho", name: "Porto Murtinho (Rio Apa)", lat: -21.6985, lng: -57.8842, basin: "Paraguai" },
  { id: "tres_lagoas", name: "Três Lagoas (Rio Paraná / Sucuriú)", lat: -20.7852, lng: -51.7089, basin: "Paraná" },
  { id: "bonito", name: "Bonito / Serra da Bodoquena", lat: -21.1278, lng: -56.4839, basin: "Paraguai" },
  { id: "campo_grande", name: "Campo Grande (Capital)", lat: -20.4428, lng: -54.6464, basin: "Central" }
];

export const PANTANAL_WATER_SEASONS = {
  cheia: {
    name: "Cheia Pantaneira (Janeiro a Março / Maio no Sul)",
    characteristics: "Planície inundada, peixes espalhados pelos campos de corixos e baías.",
    fishingAdvice: "Peixes dispersos e fartura de alimento natural. Mais difícil achar cardumes concentrados. Foco em saídas de corixos e balseiros de margem.",
    waterClarity: "Água barrenta ou leitosa no canal, mais limpa nas baías interiores."
  },
  vazante: {
    name: "Vazante (Abril a Julho)",
    characteristics: "As águas começam a recuar dos campos para o leito dos rios principais.",
    fishingAdvice: "Época de OURO da pesca esportiva no Pantanal! Os peixes descem dos campos concentrando-se nas bocas de corixos e canais. Ataques frenéticos de Dourados e Pintados.",
    waterClarity: "Excelente transparência gradual, águas limpas e correntes."
  },
  seca: {
    name: "Seca (Agosto a Outubro)",
    characteristics: "Rios encaixados em seus leitos, praias de areia expostas, lagoas isoladas.",
    fishingAdvice: "Ótima época para peixes de couro (Jaú, Pintado, Cachara) nos poços fundos e para arremesso de iscas artificiais de praia.",
    waterClarity: "Água translúcida a esverdeada, propícia para pesca visual."
  },
  enchente: {
    name: "Enchente / Piracema (Novembro a Dezembro)",
    characteristics: "Primeiras chuvas de primavera, rios sobem rapidamente.",
    fishingAdvice: "Peixes sobem o rio para reprodução (Piracema). Pesca fechada pelo período de defeso.",
    waterClarity: "Primeiras enxurradas turvam a água rapidamente."
  }
};

/**
 * Obtém a previsão meteorológica com estratégia Cache-First / Fallback offline
 */
export async function getCityWeather(cityId = "corumba", forceRefresh = false) {
  const city = MS_FISHING_CITIES.find(c => c.id === cityId) || MS_FISHING_CITIES[0];

  // 1. Tentar ler do cache offline primeiro se não for forceRefresh
  if (!forceRefresh) {
    const cached = await getWeatherCache(city.id);
    if (cached && (Date.now() - cached.timestamp < 3 * 60 * 60 * 1000)) { // 3 horas de validade
      return {
        ...cached.data,
        isOffline: false,
        cachedAt: new Date(cached.timestamp).toLocaleString("pt-BR"),
        source: "cache"
      };
    }
  }

  // 2. Se online, consultar Open-Meteo
  if (navigator.onLine) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,precipitation,weather_code&hourly=temperature_2m,precipitation_probability,surface_pressure&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=America%2FCuiaba`;
      
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        const processed = processWeatherData(city, data);
        
        // Salvar no banco IndexedDB
        await saveWeatherCache(city.id, processed);

        return {
          ...processed,
          isOffline: false,
          cachedAt: new Date().toLocaleString("pt-BR"),
          source: "live"
        };
      }
    } catch (e) {
      console.warn("Open-Meteo request failed, loading offline fallback:", e.message);
    }
  }

  // 3. Fallback Offline: Ler o último cache existente
  const lastCache = await getWeatherCache(city.id);
  if (lastCache) {
    return {
      ...lastCache.data,
      isOffline: true,
      cachedAt: new Date(lastCache.timestamp).toLocaleString("pt-BR"),
      source: "cached_offline"
    };
  }

  // 4. Se nunca sincronizou, gerar dados baseados na média histórica do MS e cálculo solar local
  return generateOfflineFallbackWeather(city);
}

function processWeatherData(city, raw) {
  const cur = raw.current;
  const daily = raw.daily;
  const sunTimes = getSunTimes(new Date(), city.lat, city.lng);

  const pressure = Math.round(cur.surface_pressure);
  // Análise da pressão barométrica para pesca
  let pressureAnalysis = "Estável (Condições normais)";
  let pressureColor = "info";
  if (pressure > 1014) {
    pressureAnalysis = "Pressão Alta / Subindo - Céu limpo, peixes ativos e caçando na superfície!";
    pressureColor = "success";
  } else if (pressure < 1008) {
    pressureAnalysis = "Pressão Baixa / Caindo - Possibilidade de temporal ou vento sul. Peixes manhosos no fundo.";
    pressureColor = "warning";
  }

  const windSpeedKmh = Math.round(cur.wind_speed_10m);
  let windStatus = "Vento Leve (Excelente para navegar)";
  if (windSpeedKmh > 25) {
    windStatus = "⚠️ Atenção: Ventania forte. Ondas perigosas no Rio Paraguai e represas.";
  } else if (windSpeedKmh > 15) {
    windStatus = "Vento Moderado (Marola leve)";
  }

  const weatherCodeInfo = getWeatherCodeDescription(cur.weather_code);

  return {
    city,
    temperature: Math.round(cur.temperature_2m),
    tempMin: Math.round(daily.temperature_2m_min[0] || 22),
    tempMax: Math.round(daily.temperature_2m_max[0] || 33),
    humidity: cur.relative_humidity_2m,
    precipitation: cur.precipitation,
    rainProbability: daily.precipitation_probability_max ? daily.precipitation_probability_max[0] : 15,
    pressure,
    pressureAnalysis,
    pressureColor,
    windSpeedKmh,
    windDirectionDeg: cur.wind_direction_10m,
    windStatus,
    condition: weatherCodeInfo.text,
    icon: weatherCodeInfo.icon,
    sunTimes
  };
}

function getWeatherCodeDescription(code) {
  if (code === 0) return { text: "Céu Limpo / Ensolarado", icon: "☀️" };
  if (code === 1 || code === 2) return { text: "Parcialmente Nublado", icon: "⛅" };
  if (code === 3) return { text: "Nublado", icon: "☁️" };
  if (code >= 51 && code <= 67) return { text: "Chuva / Garoa", icon: "🌧️" };
  if (code >= 80 && code <= 82) return { text: "Pancadas de Chuva", icon: "🌦️" };
  if (code >= 95) return { text: "Tempestade com Raios ⚠️", icon: "⛈️" };
  return { text: "Tempo Bom", icon: "🌤️" };
}

function generateOfflineFallbackWeather(city) {
  const sunTimes = getSunTimes(new Date(), city.lat, city.lng);
  return {
    city,
    temperature: 29,
    tempMin: 21,
    tempMax: 34,
    humidity: 65,
    precipitation: 0,
    rainProbability: 20,
    pressure: 1012,
    pressureAnalysis: "Pressão Estimada Estável (1012 hPa) - Conecte à internet para sincronizar barômetro em tempo real.",
    pressureColor: "info",
    windSpeedKmh: 12,
    windDirectionDeg: 90,
    windStatus: "Vento Médio Pantaneiro",
    condition: "Clima Pantaneiro Estimado",
    icon: "🌤️",
    sunTimes,
    isOffline: true,
    cachedAt: "Sem sincronização prévia (Estimativa)",
    source: "static_fallback"
  };
}
