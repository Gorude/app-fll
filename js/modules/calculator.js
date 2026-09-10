/**
 * Calculadora Legal e Régua Digital: "Posso Levar Este Peixe?"
 * Validação rigorosa dos tamanhos mínimos e máximos da legislação de Mato Grosso do Sul.
 */

import { SPECIES_DATA, COTA_GENERAL_RULES } from "../data/species.js";

export function evaluateFishMeasurement(speciesId, lengthCm, isDefesoActive = false) {
  const species = SPECIES_DATA.find(s => s.id === speciesId);
  if (!species) {
    return {
      status: "unknown",
      title: "Espécie Desconhecida",
      badge: "Indeterminado",
      message: "Selecione uma espécie para calcular a legalidade da posse.",
      color: "secondary"
    };
  }

  const length = parseFloat(lengthCm);

  // 1. Dourado: Proibição legal absoluta de abate (Lei nº 6.390/2025)
  if (species.id === "dourado") {
    return {
      status: "prohibited_species",
      species,
      title: "🟡 DEVE SOLTAR (Pesque e Solte Obrigatório)",
      badge: "Proibido Abater",
      color: "warning",
      message: "Pela Lei Estadual nº 6.390/2025 (prorrogada até 2027), é terminantemente PROIBIDO o abate ou transporte de Dourados no MS. Todo exemplar capturado deve ser devolvido vivo ao rio, independentemente do tamanho.",
      canKeep: false,
      quotaInfo: "Cota: 0 (Zero) exemplares para abate."
    };
  }

  // 2. Piracema / Período de Defeso ativo
  if (isDefesoActive && species.type === "Nativa") {
    return {
      status: "defeso_active",
      species,
      title: "🔴 PERÍODO DE DEFESO ATIVO (Piracema)",
      badge: "Pesca Fechada",
      color: "danger",
      message: "Durante a Piracema (reprodução anual), a captura e retenção de peixes nativos é proibida em quase toda a bacia hidrográfica do MS.",
      canKeep: false,
      quotaInfo: "Defeso ativo. Permitido apenas Pesque e Solte em trechos expressamente autorizados."
    };
  }

  // 3. Espécies Exóticas (Tucunaré, Tilápia, Corvina, etc.)
  if (species.type === "Exótica / Alóctone") {
    return {
      status: "allowed_exotic",
      species,
      title: "🟢 PODE LEVAR (Espécie Exótica)",
      badge: "Sem Limite de Cota",
      color: "success",
      message: `${species.name} é uma espécie exótica introduzida. Não possui tamanho mínimo e nem limite de quantidade para transporte. A retirada auxilia o equilíbrio ecológico dos rios nativos.`,
      canKeep: true,
      quotaInfo: "Ilimitado (Sem cota máxima)"
    };
  }

  // 4. Piranha (Cota especial de 5 exemplares)
  if (species.id === "piranha_caju") {
    return {
      status: "allowed_piranha",
      species,
      title: "🟢 PODE LEVAR (Respeitando a Cota)",
      badge: "Até 5 exemplares",
      color: "success",
      message: "Permitido o transporte de até 5 (cinco) piranhas por pescador licenciado, sem exigência de tamanho mínimo.",
      canKeep: true,
      quotaInfo: "Cota máxima: 5 exemplares"
    };
  }

  // 5. Verificação de Tamanho para Espécies Nativas
  if (!length || isNaN(length) || length <= 0) {
    return {
      status: "missing_length",
      species,
      title: "Informe o Comprimento",
      badge: "Aguardando Medida",
      color: "info",
      message: `Tamanho legal para ${species.name}: Mínimo ${species.minSize} cm${species.maxSize ? ` e Máximo ${species.maxSize} cm` : ''}. Insira o valor medido.`,
      canKeep: false,
      quotaInfo: COTA_GENERAL_RULES.nativeSpeciesQuota
    };
  }

  // Abaixo do mínimo legal
  if (species.minSize && length < species.minSize) {
    const diff = (species.minSize - length).toFixed(1);
    return {
      status: "under_minimum",
      species,
      title: "🔴 NÃO PODE LEVAR (Abaixo do Mínimo)",
      badge: "Submedida - Soltura Obrigatória",
      color: "danger",
      message: `O exemplar tem ${length} cm e está ${diff} cm ABAIXO do tamanho mínimo permitido (${species.minSize} cm). É obrigatório soltar o peixe imediatamente para permitir seu crescimento e maturação sexual.`,
      canKeep: false,
      quotaInfo: `Mínimo legal: ${species.minSize} cm`
    };
  }

  // Acima do máximo legal (Matriz reprodutora protegida)
  if (species.maxSize && length > species.maxSize) {
    const diff = (length - species.maxSize).toFixed(1);
    return {
      status: "over_maximum",
      species,
      title: "🔴 NÃO PODE LEVAR (Matriz Acima do Máximo)",
      badge: "Matriz Reprodutora Protegida",
      color: "danger",
      message: `O exemplar tem ${length} cm e está ${diff} cm ACIMA do limite máximo permitido (${species.maxSize} cm). Grandes matrizes são fundamentais para a reposição natural do rio e são protegidas por lei em Mato Grosso do Sul. Devolva com vida à água!`,
      canKeep: false,
      quotaInfo: `Máximo legal: ${species.maxSize} cm`
    };
  }

  // Dentro do tamanho permitido!
  return {
    status: "allowed_native",
    species,
    title: "🟢 PODE LEVAR (Dentro da Medida Legal)",
    badge: "Tamanho Aprovado",
    color: "success",
    message: `Medida de ${length} cm APROVADA! Está dentro do intervalo legal (${species.minSize} a ${species.maxSize || '∞'} cm).`,
    canKeep: true,
    quotaInfo: "Atenção: A cota máxima de transporte é de apenas 1 (UM) exemplar de espécie nativa por pescador devidamente licenciado pelo IMASUL com lacre."
  };
}
