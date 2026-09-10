/**
 * Módulo de Calendário de Pesca e Períodos de Defeso (Piracema) do MS
 * Gerencia datas oficiais da Bacia do Paraguai e Bacia do Paraná,
 * contagem regressiva, alertas automáticos e calendário interativo mensal.
 */

export const DEFESO_PERIODS = {
  paraguai: {
    name: "Bacia Hidrográfica do Rio Paraguai",
    startMonth: 10, // Novembro (0-indexed: 10)
    startDay: 5,
    endMonth: 1,    // Fevereiro (0-indexed: 1)
    endDay: 28,     // 28 ou 29 se bissexto
    earlyCatchReleaseAllowed: true,
    earlyCatchReleaseStart: "01 de Fevereiro (apenas no leito do Rio Paraguai)",
    description: "Compreende os rios Paraguai, Miranda, Aquidauana, Taquari, Negro, Apa e afluentes do Pantanal."
  },
  parana: {
    name: "Bacia Hidrográfica do Rio Paraná",
    startMonth: 10, // Novembro (0-indexed: 10)
    startDay: 1,
    endMonth: 1,    // Fevereiro (0-indexed: 1)
    endDay: 28,
    earlyCatchReleaseAllowed: false,
    earlyCatchReleaseStart: null,
    description: "Compreende a calha do Rio Paraná, Sucuriú, Rio Verde, Rio Claro e reservatórios de usinas hidrelétricas."
  }
};

/**
 * Verifica se uma data específica está dentro do período de defeso
 */
export function checkDefesoStatus(date = new Date(), basin = "paraguai") {
  const period = DEFESO_PERIODS[basin] || DEFESO_PERIODS.paraguai;
  const month = date.getMonth();
  const day = date.getDate();
  const year = date.getFullYear();

  // O defeso começa em Novembro e termina no final de Fevereiro do ano seguinte
  // Portanto, está ativo se:
  // (Mês == 10 e Dia >= startDay) OU (Mês == 11) OU (Mês == 0) OU (Mês == 1 e Dia <= endDay)
  const isStartMonth = (month === period.startMonth && day >= period.startDay);
  const isDecember = (month === 11);
  const isJanuary = (month === 0);
  const isEndMonth = (month === period.endMonth && day <= period.endDay);

  const isActive = isStartMonth || isDecember || isJanuary || isEndMonth;

  // Calcular dias restantes para início ou fim
  let daysRemaining = 0;
  let statusMessage = "";
  let badgeColor = "success";

  if (isActive) {
    // Calcular dias até o fim do defeso (final de fevereiro)
    const endYear = (month >= 10) ? year + 1 : year;
    const endDate = new Date(endYear, period.endMonth, period.endDay, 23, 59, 59);
    daysRemaining = Math.max(0, Math.ceil((endDate - date) / (1000 * 60 * 60 * 24)));
    statusMessage = `PIRACEMA ATIVA! Pesca de peixes nativos fechada por mais ${daysRemaining} dias (até ${period.endDay}/02).`;
    badgeColor = "danger";
  } else {
    // Calcular dias até o próximo defeso
    const startYear = (month <= 1) ? year : (month < period.startMonth ? year : year + 1);
    const startDate = new Date(startYear, period.startMonth, period.startDay, 0, 0, 0);
    daysRemaining = Math.max(0, Math.ceil((startDate - date) / (1000 * 60 * 60 * 24)));
    
    if (daysRemaining <= 30) {
      statusMessage = `ATENÇÃO: Faltam apenas ${daysRemaining} dias para o início da Piracema (${period.startDay}/11)! Planeje sua última pescaria.`;
      badgeColor = "warning";
    } else {
      statusMessage = `PESCA ABERTA! Temporada normal. Próxima Piracema em ${daysRemaining} dias.`;
      badgeColor = "success";
    }
  }

  return {
    isActive,
    basinName: period.name,
    daysRemaining,
    statusMessage,
    badgeColor,
    period
  };
}

/**
 * Gera os dados dos dias de um mês para renderização no calendário
 */
export function getMonthCalendarData(year, month, basin = "paraguai") {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const numDays = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Domingo

  const days = [];

  // Dias em branco antes do primeiro dia
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push({ blank: true });
  }

  // Dias do mês com status de defeso
  for (let d = 1; d <= numDays; d++) {
    const dayDate = new Date(year, month, d);
    const defeso = checkDefesoStatus(dayDate, basin);
    days.push({
      blank: false,
      day: d,
      date: dayDate,
      isDefeso: defeso.isActive,
      isToday: isSameDay(dayDate, new Date())
    });
  }

  return {
    year,
    month,
    monthName: dayDateToMonthName(month),
    days
  };
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

function dayDateToMonthName(monthIndex) {
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  return months[monthIndex];
}
