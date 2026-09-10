/**
 * PescaMS - Controlador Central da Aplicação (PWA Offline-First)
 * Gerencia ciclo de vida, navegação, Service Worker, banco IndexedDB e todos os módulos.
 */

import { SPECIES_DATA } from "./data/species.js";
import { LAWS_DATA } from "./data/laws.js";
import { FAQ_QA_DATA } from "./data/faq-qa.js";
import { PescaMSMap } from "./modules/map.js";
import { FishCameraClassifier, getBreedingAndSexGuidelines } from "./modules/camera-classifier.js";
import { evaluateFishMeasurement } from "./modules/calculator.js";
import { getSolunarDay, getMoonPhase } from "./modules/solunar.js";
import { getCityWeather, MS_FISHING_CITIES, PANTANAL_WATER_SEASONS } from "./modules/weather.js";
import { checkDefesoStatus, getMonthCalendarData } from "./modules/calendar.js";
import { convertDecimalToDMS, generateSOSText, FIRST_AID_GUIDES } from "./modules/safety.js";
import { addCatchEntry, loadCatchDiary, removeCatchEntry } from "./modules/logbook.js";
import { performOfflineSearch } from "./modules/search.js";
import { deleteWaypoint } from "./db.js";

class PescaMSApp {
  constructor() {
    this.mapInstance = null;
    this.cameraClassifier = null;
    this.deferredInstallPrompt = null;
    this.currentUserLocation = null;
    this.activeView = "home";
    this.selectedBasin = "paraguai";
  }

  /**
   * Ponto de entrada do aplicativo
   */
  async init() {
    this.registerServiceWorker();
    this.setupNetworkStatusListener();
    this.setupNavigation();
    this.setupPWAInstall();
    this.setupContrastMode();
    this.setupGlobalSearch();

    // Inicializar visualizações
    this.initHomeDashboard();
    this.initCatalog();
    this.initCalculator();
    this.initDefesoView();
    this.initWeatherView();
    this.initLawsView();
    this.initSafetyView();
    this.initLogbookView();

    // Tratar hash inicial da URL se houver
    const initialHash = window.location.hash.replace("#", "");
    if (initialHash) {
      this.handleRouteHash(initialHash);
    }
  }

  // ==========================================
  // SERVICE WORKER & PWA
  // ==========================================

  registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js")
          .then((reg) => {
            console.log("[PWA] Service Worker registrado com sucesso:", reg.scope);
          })
          .catch((err) => {
            console.warn("[PWA] Falha no registro do Service Worker:", err);
          });
      });
    }
  }

  setupNetworkStatusListener() {
    const badge = document.getElementById("connection-status-badge");
    const text = document.getElementById("connection-text");

    const updateStatus = () => {
      if (navigator.onLine) {
        badge.className = "header-badge";
        badge.innerHTML = `<span class="status-dot">🟢</span> <span>Online</span>`;
      } else {
        badge.className = "header-badge offline";
        badge.innerHTML = `<span class="status-dot">📡</span> <span>Modo Offline</span>`;
        this.showToast("Modo Offline Ativo: Todo o conteúdo e mapas continuam disponíveis!", "info");
      }
    };

    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    updateStatus();
  }

  setupPWAInstall() {
    const installBtn = document.getElementById("btn-install-pwa");

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
      if (installBtn) installBtn.style.display = "flex";
    });

    if (installBtn) {
      installBtn.addEventListener("click", async () => {
        if (!this.deferredInstallPrompt) return;
        this.deferredInstallPrompt.prompt();
        const { outcome } = await this.deferredInstallPrompt.userChoice;
        if (outcome === "accepted") {
          this.showToast("PescaMS instalado com sucesso no seu dispositivo!", "success");
        }
        this.deferredInstallPrompt = null;
        installBtn.style.display = "none";
      });
    }
  }

  setupContrastMode() {
    const contrastBtn = document.getElementById("btn-toggle-contrast");
    const isSolarSaved = localStorage.getItem("pescams_solar_contrast") === "true";
    if (isSolarSaved) {
      document.body.classList.add("solar-contrast-mode");
    }

    if (contrastBtn) {
      contrastBtn.addEventListener("click", () => {
        const active = document.body.classList.toggle("solar-contrast-mode");
        localStorage.setItem("pescams_solar_contrast", active);
        contrastBtn.innerHTML = active ? "🌙" : "☀️";
        this.showToast(active ? "Modo Alto Contraste Solar Ativado" : "Modo Padrão Ativado", "info");
      });
    }
  }

  // ==========================================
  // NAVEGAÇÃO & ABAS
  // ==========================================

  setupNavigation() {
    const navButtons = document.querySelectorAll("#app-bottom-nav .nav-item");
    navButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const viewId = btn.dataset.view;
        this.navigateTo(viewId);
      });
    });

    window.addEventListener("hashchange", () => {
      const hash = window.location.hash.replace("#", "");
      this.handleRouteHash(hash);
    });
  }

  handleRouteHash(hash) {
    const mapHashToView = {
      "pescar": "home",
      "home": "home",
      "mapa": "map",
      "map": "map",
      "camera": "camera",
      "catalogo": "catalog",
      "peixes": "catalog",
      "calculadora": "calculator",
      "regras": "calculator",
      "defeso": "defeso",
      "tempo": "weather",
      "clima": "weather",
      "leis": "laws",
      "seguranca": "safety",
      "sos": "safety",
      "diario": "logbook"
    };

    const target = mapHashToView[hash] || "home";
    this.navigateTo(target, false);
  }

  navigateTo(viewId, updateHash = true) {
    const targetSection = document.getElementById(`view-${viewId}`);
    if (!targetSection) return;

    // Atualizar seções
    document.querySelectorAll(".app-view").forEach(view => view.classList.remove("active"));
    targetSection.classList.add("active");

    // Atualizar botões de navegação
    document.querySelectorAll("#app-bottom-nav .nav-item").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.view === viewId);
    });

    this.activeView = viewId;
    if (updateHash) {
      window.location.hash = viewId;
    }

    // Scroll para o topo
    document.getElementById("app-main").scrollTop = 0;

    // Ações específicas de entrada em views
    if (viewId === "map") {
      this.initMapIfNeeded();
    } else if (viewId === "camera") {
      this.initCameraIfNeeded();
    } else {
      // Parar câmera se sair da aba da câmera para economizar bateria
      if (this.cameraClassifier) {
        this.cameraClassifier.stopCamera();
      }
    }
  }

  // ==========================================
  // BUSCA GLOBAL OFFLINE
  // ==========================================

  setupGlobalSearch() {
    const searchInput = document.getElementById("global-search-input");
    const clearBtn = document.getElementById("btn-clear-search");
    const resultsContainer = document.getElementById("search-results-container");

    if (!searchInput) return;

    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.trim();
      clearBtn.style.display = q.length > 0 ? "block" : "none";

      if (q.length < 2) {
        resultsContainer.style.display = "none";
        resultsContainer.innerHTML = "";
        return;
      }

      const results = performOfflineSearch(q);
      this.renderSearchResults(results, resultsContainer);
    });

    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      clearBtn.style.display = "none";
      resultsContainer.style.display = "none";
      resultsContainer.innerHTML = "";
    });
  }

  renderSearchResults(results, container) {
    const hasResults = results.answers.length > 0 || results.species.length > 0 || results.places.length > 0 || results.laws.length > 0;

    if (!hasResults) {
      container.style.display = "block";
      container.innerHTML = `
        <div class="card" style="padding: 14px; text-align: center; color: var(--text-muted);">
          Nenhum resultado local encontrado para esta pesquisa.
        </div>
      `;
      return;
    }

    let html = `<div class="card" style="padding: 14px; border-color: var(--color-primary);">`;

    // Respostas diretas às perguntas (FAQs)
    if (results.answers.length > 0) {
      results.answers.forEach(ans => {
        html += `
          <div style="background: rgba(16, 185, 129, 0.12); border-left: 3px solid var(--color-primary); padding: 10px 12px; border-radius: 4px; margin-bottom: 10px;">
            <div style="font-weight: 800; font-size: 0.9rem; color: var(--color-primary-light); margin-bottom: 4px;">💬 ${ans.question}</div>
            <div style="font-size: 0.84rem; color: var(--text-primary); line-height: 1.4;">${ans.answer}</div>
          </div>
        `;
      });
    }

    // Peixes correspondentes
    if (results.species.length > 0) {
      html += `<div style="font-size: 0.78rem; font-weight: 700; color: var(--color-gold); margin: 8px 0 4px 0;">🐟 ESPÉCIES ENCONTRADAS:</div>`;
      results.species.forEach(sp => {
        html += `
          <div class="fish-card" style="margin-bottom: 8px; padding: 10px;" onclick="window.pescaApp.openSpeciesDetail('${sp.id}')">
            <div style="font-size: 1.8rem;">🐟</div>
            <div class="fish-info">
              <div class="fish-name">${sp.name} <small style="font-size: 0.72rem; color: var(--text-muted);">(${sp.scientificName})</small></div>
              <div style="font-size: 0.75rem; color: var(--text-secondary);">${sp.possessionBadge}</div>
            </div>
          </div>
        `;
      });
    }

    // Rios e Locais
    if (results.places.length > 0) {
      html += `<div style="font-size: 0.78rem; font-weight: 700; color: var(--color-accent); margin: 8px 0 4px 0;">📍 RIOS E PONTOS:</div>`;
      results.places.forEach(pl => {
        html += `
          <div style="padding: 6px 0; border-bottom: 1px solid var(--border-subtle); font-size: 0.82rem;">
            <strong>${pl.type}: ${pl.title}</strong> - <span style="color: var(--text-secondary);">${pl.description.substr(0, 90)}...</span>
          </div>
        `;
      });
    }

    html += `</div>`;
    container.style.display = "block";
    container.innerHTML = html;
  }

  // ==========================================
  // DASHBOARD PRINCIPAL (HOME)
  // ==========================================

  initHomeDashboard() {
    // 1. Defeso Banner
    const defeso = checkDefesoStatus(new Date(), "paraguai");
    const bannerEl = document.getElementById("home-defeso-banner");
    const titleEl = document.getElementById("defeso-banner-title");
    const descEl = document.getElementById("defeso-banner-desc");

    if (defeso.isActive) {
      bannerEl.className = "defeso-banner";
      titleEl.innerText = "🔴 PIRACEMA EM ANDAMENTO";
      descEl.innerText = defeso.statusMessage;
    } else {
      bannerEl.className = "defeso-banner open-season";
      titleEl.innerText = "🟢 PESCA ABERTA NO MS";
      descEl.innerText = defeso.statusMessage;
    }

    // 2. Solunar do Dia
    const solunar = getSolunarDay(new Date());
    document.getElementById("home-moon-icon").innerText = solunar.moon.icon;
    document.getElementById("home-moon-name").innerText = solunar.moon.name;
    document.getElementById("home-moon-illum").innerText = `${solunar.moon.illumination}% Iluminação`;
    document.getElementById("home-sun-rise").innerText = solunar.sun.sunrise.formatted;
    document.getElementById("home-sun-set").innerText = solunar.sun.sunset.formatted;
    document.getElementById("home-best-window").innerText = solunar.majorPeriods[0].window;

    const solunarBadge = document.getElementById("home-solunar-badge");
    solunarBadge.innerText = `Solunar: ${solunar.rating.label}`;
    solunarBadge.className = `badge badge-${solunar.rating.color}`;

    // 3. Previsão de Corumbá em cache ou padrão
    getCityWeather("corumba").then(w => {
      document.getElementById("home-weather-temp").innerText = `${w.temperature}°C`;
      document.getElementById("home-weather-icon").innerText = w.icon;
    });
  }

  // ==========================================
  // MAPA INTERATIVO
  // ==========================================

  async initMapIfNeeded() {
    if (!this.mapInstance) {
      this.mapInstance = new PescaMSMap("map-view-canvas");
      await this.mapInstance.init();

      // Configurar Filtros
      const filterChips = document.querySelectorAll(".map-filter-chip");
      filterChips.forEach(chip => {
        chip.addEventListener("click", () => {
          filterChips.forEach(c => c.classList.remove("active"));
          chip.classList.add("active");
          this.mapInstance.setFilter(chip.dataset.filter);
        });
      });

      // Botão Centralizar GPS
      document.getElementById("btn-center-user-gps").addEventListener("click", () => {
        this.mapInstance.centerOnUser();
      });

      // Botão Marcar Base / Ponto de Partida
      document.getElementById("btn-mark-camp").addEventListener("click", async () => {
        try {
          const wp = await this.mapInstance.setAsStartingPoint();
          this.showToast("Ponto de Partida salvo! A bússola guiará você de volta.", "success");
        } catch (err) {
          this.showToast(err.message, "warning");
        }
      });

      // Iniciar Rastreamento GPS
      this.mapInstance.startGPSTracking((data) => {
        this.currentUserLocation = data.userLocation;
        this.updateMapHUD(data);
        this.updateSafetyCoords(data.userLocation);
      });
    }

    setTimeout(() => {
      if (this.mapInstance && this.mapInstance.map) {
        this.mapInstance.map.invalidateSize();
      }
    }, 200);
  }

  updateMapHUD(data) {
    const coordsEl = document.getElementById("hud-coords-text");
    const statusEl = document.getElementById("hud-status-title");
    const returnInfoEl = document.getElementById("hud-return-info");
    const needleEl = document.getElementById("compass-needle-arrow");

    if (data.userLocation) {
      statusEl.innerText = "GPS Conectado (Satelital)";
      coordsEl.innerText = `${data.userLocation.lat.toFixed(5)}, ${data.userLocation.lng.toFixed(5)}`;
    }

    if (data.returnNav && data.startingPoint) {
      returnInfoEl.innerText = `Rumo à Base: ${data.returnNav.distanceFormatted} (${data.returnNav.cardinalDirection} - ${data.returnNav.bearingDeg}°)`;
      needleEl.style.transform = `rotate(${data.returnNav.bearingDeg}deg)`;
    } else {
      returnInfoEl.innerText = "Toque em 'Marcar Base' para registrar este ponto";
    }
  }

  async deleteUserWaypoint(id) {
    await deleteWaypoint(id);
    if (this.mapInstance) {
      await this.mapInstance.renderUserWaypoints();
      this.mapInstance.startingPoint = null;
    }
    this.showToast("Ponto removido com sucesso.", "info");
  }

  // ==========================================
  // CÂMERA E IA OFFLINE
  // ==========================================

  async initCameraIfNeeded() {
    if (!this.cameraClassifier) {
      const video = document.getElementById("camera-video-feed");
      const canvas = document.getElementById("camera-snapshot-canvas");
      const container = document.getElementById("camera-ai-result");
      this.cameraClassifier = new FishCameraClassifier(video, canvas, container);

      // Botão Abrir Câmera
      document.getElementById("btn-start-camera").addEventListener("click", async () => {
        const ok = await this.cameraClassifier.startCamera();
        if (!ok) {
          this.showToast("Não foi possível acessar a câmera. Você pode selecionar uma foto da galeria.", "warning");
        }
      });

      // Botão Disparador (Tirar Foto)
      document.getElementById("btn-take-photo").addEventListener("click", () => {
        const result = this.cameraClassifier.captureCurrentFrame();
        if (result) {
          this.displayClassifierResult(result);
        } else {
          this.showToast("Abra a câmera primeiro ou selecione uma foto da galeria.", "info");
        }
      });

      // Upload de Arquivo / Galeria
      document.getElementById("camera-upload-input").addEventListener("change", async (e) => {
        if (e.target.files && e.target.files[0]) {
          const result = await this.cameraClassifier.processUploadedFile(e.target.files[0]);
          this.displayClassifierResult(result);
        }
      });

      // Botão Ir para Calculadora
      document.getElementById("btn-ai-to-calculator").addEventListener("click", () => {
        if (this.currentClassifiedSpecies) {
          document.getElementById("calc-species-select").value = this.currentClassifiedSpecies.id;
          this.navigateTo("calculator");
          this.updateCalculation();
        }
      });

      // Botão Salvar no Diário
      document.getElementById("btn-ai-to-logbook").addEventListener("click", () => {
        if (this.currentClassifiedSpecies) {
          this.openAddCatchModal(this.currentClassifiedSpecies.id);
        }
      });
    }

    // Iniciar câmera automaticamente se suportado
    this.cameraClassifier.startCamera();
  }

  displayClassifierResult(result) {
    const top = result.topMatch;
    this.currentClassifiedSpecies = top.species;

    const resultBox = document.getElementById("camera-ai-result");
    document.getElementById("ai-species-name").innerText = top.species.name;
    document.getElementById("ai-scientific-name").innerText = top.species.scientificName;
    document.getElementById("ai-confidence-badge").innerText = `${top.confidence}% Similaridade`;
    document.getElementById("ai-confidence-fill").style.width = `${top.confidence}%`;

    // Avaliação Legal
    const defeso = checkDefesoStatus(new Date(), "paraguai");
    const evaluation = evaluateFishMeasurement(top.species.id, top.species.minSize || 50, defeso.isActive);

    const verdictEl = document.getElementById("ai-legal-verdict");
    const iconEl = document.getElementById("ai-verdict-icon");
    const titleEl = document.getElementById("ai-verdict-title");
    const msgEl = document.getElementById("ai-verdict-message");

    titleEl.innerText = evaluation.title;
    msgEl.innerText = evaluation.message;
    verdictEl.className = `defeso-banner ${evaluation.canKeep ? 'open-season' : ''}`;
    iconEl.innerText = evaluation.canKeep ? "🟢" : "🔴";

    // Dimorfismo & Ética
    const guidelines = getBreedingAndSexGuidelines(top.species);
    document.getElementById("ai-dimorphism-text").innerHTML = `
      ${guidelines.dimorphismText}<br><br>
      <strong class="text-gold">${guidelines.ethicalWarning}</strong>
    `;

    resultBox.style.display = "block";
    resultBox.scrollIntoView({ behavior: "smooth" });
  }

  // ==========================================
  // CATÁLOGO DE ESPÉCIES
  // ==========================================

  initCatalog() {
    const grid = document.getElementById("fish-catalog-grid");
    if (!grid) return;

    this.renderCatalogGrid(SPECIES_DATA);

    // Filtros de Categoria
    const filterButtons = document.querySelectorAll("[data-cat-filter]");
    filterButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        filterButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const filter = btn.dataset.catFilter;
        if (filter === "all") {
          this.renderCatalogGrid(SPECIES_DATA);
        } else if (filter === "Nativa" || filter === "Exótica / Alóctone") {
          this.renderCatalogGrid(SPECIES_DATA.filter(s => s.type === filter));
        } else if (filter === "Escama" || filter === "Couro") {
          this.renderCatalogGrid(SPECIES_DATA.filter(s => s.skin === filter));
        }
      });
    });
  }

  renderCatalogGrid(speciesList) {
    const grid = document.getElementById("fish-catalog-grid");
    grid.innerHTML = "";

    speciesList.forEach(sp => {
      const card = document.createElement("div");
      card.className = "fish-card";
      card.innerHTML = `
        <div class="fish-thumb">🐟</div>
        <div class="fish-info">
          <div class="fish-name">${sp.name}</div>
          <div class="fish-scientific">${sp.scientificName}</div>
          <div class="fish-limits">
            <span class="badge badge-${sp.statusColor}">${sp.possessionBadge}</span>
            <span class="badge badge-info">${sp.skin}</span>
          </div>
        </div>
      `;
      card.addEventListener("click", () => this.openSpeciesDetail(sp.id));
      grid.appendChild(card);
    });
  }

  openSpeciesDetail(speciesId) {
    const sp = SPECIES_DATA.find(s => s.id === speciesId);
    if (!sp) return;

    document.getElementById("modal-species-title").innerText = `${sp.name} (${sp.scientificName})`;
    document.getElementById("modal-species-body").innerHTML = `
      <div style="background: rgba(16, 185, 129, 0.1); padding: 12px; border-radius: var(--radius-md); border-left: 3px solid var(--color-primary); margin-bottom: 14px;">
        <h4 style="color: var(--color-primary-light); font-size: 0.95rem; margin-bottom: 4px;">⚖️ Situação Legal em Mato Grosso do Sul:</h4>
        <p style="font-size: 0.82rem; margin-bottom: 0;">${sp.legalSummary}</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; font-size: 0.82rem;">
        <div><strong>Tipo:</strong> ${sp.type}</div>
        <div><strong>Pele:</strong> ${sp.skin}</div>
        <div><strong>Tamanho Mínimo:</strong> ${sp.minSize ? sp.minSize + ' cm' : 'Sem restrição'}</div>
        <div><strong>Tamanho Máximo:</strong> ${sp.maxSize ? sp.maxSize + ' cm' : 'Sem limite'}</div>
      </div>

      <h4 style="font-size: 0.9rem; margin-bottom: 4px;">🌊 Habitat e Comportamento:</h4>
      <p style="font-size: 0.82rem;">${sp.habitat}</p>

      <h4 style="font-size: 0.9rem; margin-bottom: 4px;">🪱 Melhores Iscas:</h4>
      <p style="font-size: 0.82rem;">${sp.bestBaits.join(", ")}</p>

      <h4 style="font-size: 0.9rem; margin-bottom: 4px;">📅 Época de Maior Atividade:</h4>
      <p style="font-size: 0.82rem;">${sp.bestSeason}</p>

      <div class="dimorphism-ethics-box" style="margin-top: 10px;">
        <div class="ethics-header">⚠️ Dimorfismo e Preservação Reprodutiva:</div>
        <p class="ethics-text">${sp.sexualDimorphism}</p>
      </div>

      <div style="margin-top: 16px; display: flex; gap: 8px;">
        <button class="btn btn-primary btn-block btn-sm" onclick="window.pescaApp.openInCalculator('${sp.id}')">Testar Tamanho</button>
        <button class="btn btn-outline btn-block btn-sm" onclick="window.pescaApp.openAddCatchModal('${sp.id}')">Adicionar ao Diário</button>
      </div>
    `;

    document.getElementById("species-detail-modal").classList.add("active");
  }

  openInCalculator(speciesId) {
    this.closeModal("species-detail-modal");
    document.getElementById("calc-species-select").value = speciesId;
    this.navigateTo("calculator");
    this.updateCalculation();
  }

  // ==========================================
  // CALCULADORA "POSSO LEVAR?"
  // ==========================================

  initCalculator() {
    const select = document.getElementById("calc-species-select");
    const slider = document.getElementById("calc-length-slider");
    const numDisplay = document.getElementById("calc-length-val");

    if (!select) return;

    select.innerHTML = "";
    SPECIES_DATA.forEach(sp => {
      const opt = document.createElement("option");
      opt.value = sp.id;
      opt.innerText = `${sp.name} - ${sp.possessionBadge}`;
      select.appendChild(opt);
    });

    select.addEventListener("change", () => this.updateCalculation());
    slider.addEventListener("input", (e) => {
      numDisplay.innerText = e.target.value;
      this.updateCalculation();
    });

    document.getElementById("btn-save-measurement-to-diary").addEventListener("click", () => {
      const speciesId = select.value;
      const length = slider.value;
      this.openAddCatchModal(speciesId, length);
    });

    this.updateCalculation();
  }

  updateCalculation() {
    const speciesId = document.getElementById("calc-species-select").value;
    const length = parseFloat(document.getElementById("calc-length-slider").value);
    const defeso = checkDefesoStatus(new Date(), this.selectedBasin);

    const verdict = evaluateFishMeasurement(speciesId, length, defeso.isActive);

    const card = document.getElementById("calc-verdict-card");
    const icon = document.getElementById("calc-verdict-icon");
    const title = document.getElementById("calc-verdict-title");
    const desc = document.getElementById("calc-verdict-desc");

    title.innerText = verdict.title;
    desc.innerText = verdict.message;

    if (verdict.canKeep) {
      card.className = "defeso-banner open-season";
      icon.innerText = "🟢";
    } else {
      card.className = "defeso-banner";
      icon.innerText = verdict.status === "prohibited_species" ? "🟡" : "🔴";
    }
  }

  // ==========================================
  // CALENDÁRIO DE DEFESO
  // ==========================================

  initDefesoView() {
    const basinSelect = document.getElementById("defeso-basin-select");
    if (!basinSelect) return;

    basinSelect.addEventListener("change", (e) => {
      this.selectedBasin = e.target.value;
      this.renderDefesoView();
    });

    this.renderDefesoView();
  }

  renderDefesoView() {
    const defeso = checkDefesoStatus(new Date(), this.selectedBasin);
    const titleEl = document.getElementById("defeso-status-headline");
    const detailEl = document.getElementById("defeso-status-detail");

    titleEl.innerText = defeso.isActive ? "🔴 PIRACEMA EM ANDAMENTO" : "🟢 PESCA LIBERADA (FORA DA PIRACEMA)";
    detailEl.innerText = defeso.statusMessage;

    // Renderizar Calendário do Mês Atual
    const now = new Date();
    const calData = getMonthCalendarData(now.getFullYear(), now.getMonth(), this.selectedBasin);
    document.getElementById("calendar-month-label").innerText = `${calData.monthName} de ${calData.year}`;

    const container = document.getElementById("calendar-grid-container");
    let html = `
      <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; font-size: 0.75rem; font-weight: 700; margin-bottom: 8px;">
        <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;">
    `;

    calData.days.forEach(d => {
      if (d.blank) {
        html += `<div></div>`;
      } else {
        const bg = d.isDefeso ? "rgba(239, 68, 68, 0.25)" : "rgba(16, 185, 129, 0.15)";
        const border = d.isToday ? "2px solid var(--color-gold)" : "1px solid var(--border-subtle)";
        html += `
          <div style="background: ${bg}; border: ${border}; border-radius: 6px; padding: 8px 4px; text-align: center; font-size: 0.85rem; font-weight: ${d.isToday ? '800' : '500'};">
            ${d.day}
          </div>
        `;
      }
    });

    html += `</div>`;
    container.innerHTML = html;
  }

  // ==========================================
  // CLIMA, LUA & SOLUNAR
  // ==========================================

  initWeatherView() {
    const citySelect = document.getElementById("weather-city-select");
    if (!citySelect) return;

    citySelect.innerHTML = "";
    MS_FISHING_CITIES.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.innerText = c.name;
      citySelect.appendChild(opt);
    });

    citySelect.addEventListener("change", () => {
      this.loadWeatherForCity(citySelect.value);
    });

    document.getElementById("btn-sync-weather").addEventListener("click", () => {
      this.loadWeatherForCity(citySelect.value, true);
    });

    this.loadWeatherForCity("corumba");
  }

  async loadWeatherForCity(cityId, forceRefresh = false) {
    const w = await getCityWeather(cityId, forceRefresh);
    const solunar = getSolunarDay(new Date(), w.city.lat, w.city.lng);

    document.getElementById("weather-last-sync").innerText = `Última atualização: ${w.cachedAt} (${w.source === 'live' ? 'Sincronizado Online' : 'Cache Offline'})`;
    document.getElementById("weather-temp-main").innerText = `${w.temperature}°C`;
    document.getElementById("weather-condition-text").innerText = w.condition;
    document.getElementById("weather-condition-icon").innerText = w.icon;
    document.getElementById("weather-temp-min").innerText = w.tempMin;
    document.getElementById("weather-temp-max").innerText = w.tempMax;

    document.getElementById("weather-pressure-val").innerText = `${w.pressure} hPa`;
    document.getElementById("weather-pressure-desc").innerText = w.pressureAnalysis;
    document.getElementById("weather-pressure-desc").className = `text-${w.pressureColor}`;

    document.getElementById("weather-wind-val").innerText = `${w.windSpeedKmh} km/h`;
    document.getElementById("weather-wind-desc").innerText = w.windStatus;

    // Tábua Solunar
    const list = document.getElementById("solunar-periods-list");
    let solunarHtml = `
      <div style="background: rgba(255,255,255,0.03); border-radius: var(--radius-md); padding: 10px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 700; color: var(--text-primary);">Fase da Lua: ${solunar.moon.icon} ${solunar.moon.name} (${solunar.moon.illumination}%)</span>
          <span class="badge badge-${solunar.rating.color}">${solunar.rating.label}</span>
        </div>
        <p style="font-size: 0.78rem; margin: 4px 0 0 0; color: var(--text-secondary);">${solunar.rating.description}</p>
      </div>
    `;

    solunar.majorPeriods.forEach(p => {
      solunarHtml += `
        <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: rgba(16, 185, 129, 0.1); border-radius: 6px; margin-bottom: 6px; font-size: 0.82rem;">
          <span><strong>🔥 ${p.name}</strong></span>
          <span class="text-gold" style="font-weight: 800;">${p.window}</span>
        </div>
      `;
    });

    solunar.minorPeriods.forEach(p => {
      solunarHtml += `
        <div style="display: flex; justify-content: space-between; padding: 6px 12px; background: rgba(255, 255, 255, 0.03); border-radius: 6px; margin-bottom: 6px; font-size: 0.8rem;">
          <span>⚡ ${p.name}</span>
          <span style="color: var(--color-accent); font-weight: 700;">${p.window}</span>
        </div>
      `;
    });

    list.innerHTML = solunarHtml;

    // Ciclo das Águas
    const month = new Date().getMonth();
    let seasonKey = "seca";
    if (month >= 0 && month <= 2) seasonKey = "cheia";
    else if (month >= 3 && month <= 6) seasonKey = "vazante";
    else if (month >= 7 && month <= 9) seasonKey = "seca";
    else seasonKey = "enchente";

    const s = PANTANAL_WATER_SEASONS[seasonKey];
    document.getElementById("water-season-summary").innerHTML = `
      <strong>Estação Atual: ${s.name}</strong><br>
      ${s.fishingAdvice}<br>
      <em>Visibilidade da água: ${s.waterClarity}</em>
    `;
  }

  // ==========================================
  // LEIS E REGRAS
  // ==========================================

  initLawsView() {
    const container = document.getElementById("laws-container");
    if (!container) return;

    let html = "";
    LAWS_DATA.coreRules.forEach(rule => {
      html += `
        <div class="card" style="border-left: 4px solid var(--color-${rule.status === 'critical' ? 'danger' : (rule.status === 'warning' ? 'warning' : 'primary')});">
          <div class="card-header">
            <h3 style="font-size: 1.05rem;">${rule.title}</h3>
            <span class="badge badge-${rule.status === 'critical' ? 'danger' : 'warning'}">${rule.badge}</span>
          </div>
          <p style="font-weight: 600; color: var(--text-primary); font-size: 0.88rem;">${rule.summary}</p>
          <p style="font-size: 0.82rem;">${rule.details || ''}</p>
          ${rule.allowed ? `
            <div style="margin-top: 8px;">
              <strong class="text-success">Permitidos para Amadores:</strong>
              <ul style="padding-left: 18px; font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">
                ${rule.allowed.map(a => `<li>${a}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${rule.forbidden ? `
            <div style="margin-top: 8px;">
              <strong class="text-danger">Proibidos (Crime Ambiental):</strong>
              <ul style="padding-left: 18px; font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">
                ${rule.forbidden.map(f => `<li>${f}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${rule.penalty ? `<div style="background: rgba(239, 68, 68, 0.1); padding: 8px 12px; border-radius: 6px; font-size: 0.78rem; color: #fca5a5; margin-top: 10px;"><strong>Penalidade:</strong> ${rule.penalty}</div>` : ''}
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // ==========================================
  // SEGURANÇA E SOS
  // ==========================================

  initSafetyView() {
    const copyBtn = document.getElementById("btn-copy-sos-coords");
    const smsBtn = document.getElementById("btn-sms-sos");

    copyBtn.addEventListener("click", () => {
      if (!this.currentUserLocation) {
        this.showToast("Aguardando sinal GPS do aparelho.", "warning");
        return;
      }
      const text = generateSOSText(this.currentUserLocation.lat, this.currentUserLocation.lng);
      navigator.clipboard.writeText(text).then(() => {
        this.showToast("Coordenadas de socorro copiadas para a área de transferência!", "success");
      });
    });

    smsBtn.addEventListener("click", () => {
      if (!this.currentUserLocation) {
        this.showToast("Aguardando coordenadas GPS.", "warning");
        return;
      }
      const text = encodeURIComponent(generateSOSText(this.currentUserLocation.lat, this.currentUserLocation.lng));
      window.location.href = `sms:?body=${text}`;
    });

    // Guias de Primeiros Socorros
    const accordion = document.getElementById("first-aid-accordion");
    if (!accordion) return;

    let html = "";
    FIRST_AID_GUIDES.forEach(g => {
      html += `
        <div class="card" style="padding: 14px; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <div style="font-weight: 800; font-size: 0.95rem; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
              <span>${g.icon}</span> <span>${g.title}</span>
            </div>
            <span class="badge badge-warning" style="font-size: 0.7rem;">${g.severity}</span>
          </div>
          <p style="font-size: 0.8rem; font-weight: 600; color: var(--color-gold); margin-bottom: 6px;">${g.summary}</p>
          <ul style="padding-left: 18px; font-size: 0.78rem; color: var(--text-secondary); line-height: 1.5;">
            ${g.steps.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>
      `;
    });
    accordion.innerHTML = html;
  }

  updateSafetyCoords(location) {
    if (!location) return;
    const dms = convertDecimalToDMS(location.lat, location.lng);
    const decEl = document.getElementById("sos-decimal-coords");
    const dmsEl = document.getElementById("sos-dms-coords");
    if (decEl) decEl.innerText = dms.decimal;
    if (dmsEl) dmsEl.innerText = dms.fullDMS;
  }

  // ==========================================
  // DIÁRIO DE CAPTURAS
  // ==========================================

  initLogbookView() {
    const addBtn = document.getElementById("btn-open-add-catch-modal");
    const form = document.getElementById("form-add-catch");

    addBtn.addEventListener("click", () => this.openAddCatchModal());

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const speciesId = document.getElementById("log-species-select").value;
      const lengthCm = document.getElementById("log-length-input").value;
      const weightKg = document.getElementById("log-weight-input").value;
      const bait = document.getElementById("log-bait-input").value;
      const released = document.getElementById("log-released-input").checked;
      const notes = document.getElementById("log-notes-input").value;

      await addCatchEntry({
        speciesId,
        lengthCm,
        weightKg,
        bait,
        released,
        notes,
        lat: this.currentUserLocation ? this.currentUserLocation.lat : null,
        lng: this.currentUserLocation ? this.currentUserLocation.lng : null
      });

      this.closeModal("add-catch-modal");
      this.showToast("Captura registrada no seu diário com sucesso!", "success");
      this.renderLogbookList();
      form.reset();
    });

    this.renderLogbookList();
  }

  openAddCatchModal(preselectedSpeciesId = null, prefilledLength = null) {
    const select = document.getElementById("log-species-select");
    select.innerHTML = "";
    SPECIES_DATA.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.innerText = s.name;
      select.appendChild(opt);
    });

    if (preselectedSpeciesId) {
      select.value = preselectedSpeciesId;
    }
    if (prefilledLength) {
      document.getElementById("log-length-input").value = prefilledLength;
    }

    document.getElementById("add-catch-modal").classList.add("active");
  }

  async renderLogbookList() {
    const container = document.getElementById("logbook-entries-list");
    if (!container) return;

    const catches = await loadCatchDiary();
    if (catches.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 30px; color: var(--text-muted);">
          <div style="font-size: 3rem; margin-bottom: 8px;">🎣</div>
          <p>Nenhuma captura registrada ainda.</p>
          <p style="font-size: 0.8rem;">Use o botão "➕ Novo Registro" ou meça um peixe na calculadora para registrar sua pescaria.</p>
        </div>
      `;
      return;
    }

    let html = "";
    catches.forEach(c => {
      html += `
        <div class="card" style="margin-bottom: 12px;">
          <div class="card-header">
            <div class="card-title">🐟 ${c.speciesName}</div>
            <span class="badge ${c.released ? 'badge-success' : 'badge-gold'}">
              ${c.released ? 'Pesque e Solte' : 'Mantido'}
            </span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.82rem; margin-bottom: 8px;">
            <div><strong>Comprimento:</strong> ${c.lengthCm ? c.lengthCm + ' cm' : 'Não informado'}</div>
            <div><strong>Peso:</strong> ${c.weightKg ? c.weightKg + ' kg' : 'Não informado'}</div>
            <div><strong>Isca:</strong> ${c.bait || 'Não informada'}</div>
            <div><strong>Data:</strong> ${new Date(c.date).toLocaleDateString('pt-BR')}</div>
          </div>
          ${c.notes ? `<p style="font-size: 0.8rem; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px;">${c.notes}</p>` : ''}
          <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
            <button class="btn btn-sm btn-outline" style="color: var(--color-danger); border-color: rgba(239,68,68,0.3);" onclick="window.pescaApp.deleteCatchRecord('${c.id}')">Excluir</button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  async deleteCatchRecord(id) {
    await removeCatchEntry(id);
    this.renderLogbookList();
    this.showToast("Registro excluído.", "info");
  }

  // ==========================================
  // UTILITÁRIOS: MODAIS E TOASTS
  // ==========================================

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("active");
  }

  showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast`;
    
    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    if (type === "warning") icon = "⚠️";
    if (type === "danger") icon = "🚨";

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-10px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

// Instanciar e disponibilizar globalmente
window.pescaApp = new PescaMSApp();
window.addEventListener("DOMContentLoaded", () => {
  window.pescaApp.init();
});
