/**
 * Motor de Busca Inteligente Offline
 * Responde perguntas em linguagem natural e busca em todas as bases locais
 * (Espécies, Rios, Leis, Zonas e FAQs) sem necessidade de internet.
 */

import { SPECIES_DATA } from "../data/species.js";
import { FAQ_QA_DATA } from "../data/faq-qa.js";
import { MS_RIVERS_GEO, FISHING_ZONES, POINTS_OF_INTEREST } from "../data/rivers-zones.js";
import { LAWS_DATA } from "../data/laws.js";

function normalizeText(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9\s]/g, " ")
    .trim();
}

export function performOfflineSearch(query) {
  const norm = normalizeText(query);
  if (!norm || norm.length < 2) {
    return {
      answers: [],
      species: [],
      places: [],
      laws: []
    };
  }

  const queryTokens = norm.split(/\s+/).filter(t => t.length > 1);

  // 1. Verificar Perguntas Frequentes (Q&A)
  const answers = [];
  FAQ_QA_DATA.forEach(item => {
    let matchScore = 0;
    const normQuestion = normalizeText(item.question);
    
    // Teste com palavras-chave cadastradas
    item.keywords.forEach(kw => {
      const normKw = normalizeText(kw);
      if (norm.includes(normKw) || normKw.includes(norm)) {
        matchScore += 10;
      }
    });

    // Teste com tokens da pergunta
    queryTokens.forEach(token => {
      if (normQuestion.includes(token)) {
        matchScore += 3;
      }
    });

    if (matchScore >= 6) {
      answers.push({
        ...item,
        score: matchScore
      });
    }
  });
  answers.sort((a, b) => b.score - a.score);

  // 2. Busca no Catálogo de Peixes
  const species = [];
  SPECIES_DATA.forEach(sp => {
    let score = 0;
    const normName = normalizeText(sp.name);
    const normSci = normalizeText(sp.scientificName);
    const normHab = normalizeText(sp.habitat);

    queryTokens.forEach(token => {
      if (normName.includes(token)) score += 10;
      if (normSci.includes(token)) score += 8;
      if (sp.aliases && sp.aliases.some(a => normalizeText(a).includes(token))) score += 7;
      if (normHab.includes(token)) score += 3;
    });

    if (score > 0) {
      species.push({
        item: sp,
        score
      });
    }
  });
  species.sort((a, b) => b.score - a.score);

  // 3. Busca em Rios, Zonas e Pontos de Apoio
  const places = [];
  // Rios
  MS_RIVERS_GEO.forEach(river => {
    let score = 0;
    const normRiver = normalizeText(river.name);
    queryTokens.forEach(token => {
      if (normRiver.includes(token)) score += 10;
    });
    if (score > 0) {
      places.push({
        type: "Rio",
        title: river.name,
        description: river.description,
        score
      });
    }
  });

  // Zonas de Pesca
  FISHING_ZONES.forEach(zone => {
    let score = 0;
    const normZone = normalizeText(zone.name);
    queryTokens.forEach(token => {
      if (normZone.includes(token)) score += 10;
    });
    if (score > 0) {
      places.push({
        type: zone.type,
        title: zone.name,
        description: zone.description,
        score
      });
    }
  });

  // Pontos de Apoio e Hospitais
  POINTS_OF_INTEREST.forEach(poi => {
    let score = 0;
    const normPoi = normalizeText(poi.name);
    queryTokens.forEach(token => {
      if (normPoi.includes(token)) score += 10;
    });
    if (score > 0) {
      places.push({
        type: poi.type,
        title: poi.name,
        description: poi.description,
        score
      });
    }
  });
  places.sort((a, b) => b.score - a.score);

  // 4. Busca nas Leis
  const laws = [];
  LAWS_DATA.coreRules.forEach(rule => {
    let score = 0;
    const normTitle = normalizeText(rule.title);
    const normSum = normalizeText(rule.summary);
    queryTokens.forEach(token => {
      if (normTitle.includes(token)) score += 8;
      if (normSum.includes(token)) score += 4;
    });
    if (score > 0) {
      laws.push({
        title: rule.title,
        summary: rule.summary,
        details: rule.details,
        score
      });
    }
  });
  laws.sort((a, b) => b.score - a.score);

  return {
    answers: answers.slice(0, 3),
    species: species.map(s => s.item).slice(0, 5),
    places: places.slice(0, 5),
    laws: laws.slice(0, 3)
  };
}
