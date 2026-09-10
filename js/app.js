/**
 * PescaMS - Controlador Central da Aplicação (PWA Offline-First Monocromático)
 * Integração completa com sistema de ícones vetoriais SVG e sem emojis.
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
import { ICONS, getIcon } from "./icons.js";

class PescaMSApp {
  constructor() {
    this.mapInstance = null;
    this.cameraClassifier = null;
    this.deferredInstallPrompt = null;
    this.currentUserLocation = null;
    this.activeView = "home";
    this.selectedBasin = "paraguai";
  }

  async init() {
    this.registerServiceWorker();
    this.setupNetworkStatusListener();
    this.setupNavigation();
    this.setupPWAInstall();
    this.setupContrastMode();
    this.setupGlobalSearch();

    this.initHomeDashboard();
    this.initCatalog();
    this.initCalculator();
    this.initDefesoView();
    this.initWeatherView();
    this.initLawsView();
    this.initSafetyView();
    this.initLogbookView();

    const initialHash = window.location.hash.replace("#", "");
    if (initialHash) {
      this.handleRouteHash(initialHash);
    }
  }

  registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js")
          .then((reg) => {
            console.log("[PWA] Service Worker ativo:", reg.scope);
          })
          .catch((err) => {
            console.warn("[PWA] Falha no Service Worker:", err);
          });
      });
    }
  }

  setupNetworkStatusListener() {
    const badge = document.getElementById("connection-status-badge");
    const text = document.getElementById("connection-text");

    const updateStatus = () => {
      if (navigator.onLine) {
        badge.className = "header-status-pill";
        text.innerText = "Online";
      } else {
        badge.className = "header-status-pill offline";
        text.innerText = "Offline";
        this.showToast("Modo Offline Ativo: dados locais em operação.", "info");
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
          this.showToast("Aplicativo instalado com sucesso no seu dispositivo.", "success");
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
        this.showToast(active ? "Modo Alto Contraste Solar Ativado" : "Modo Padrão Ativado", "info");
      });
    }
  }

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

    document.querySelectorAll(".app-view").forEach(view => view.classList.remove("active"));
    targetSection.classList.add("active");

    document.querySelectorAll("#app-bottom-nav .nav-item").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.view === viewId);
    });

    this.activeView = viewId;
    if (updateHash) {
      window.location.hash = viewId;
    }

    document.getElementById("app-main").scrollTop = 0;

    if (viewId === "map") {
      this.initMapIfNeeded();
    } else if (viewId === "camera") {
      this.initCameraIfNeeded();
    } else {
      if (this.cameraClassifier) {
        this.cameraClassifier.stopCamera();
      }
    }
  }

  setupGlobalSearch() {
    const searchInput = document.getElementById("global-search-input");
    const clearBtn = document.getElementById("btn-clear-search");
    const resultsContainer = document.getElementById("search-results-container");

    if (!searchInput) return;

    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.trim();
      clearBtn.style.display = q.length > 0 ? "flex" : "none";

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
        <div class="card" style="padding: 14px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
          Nenhum resultado local encontrado para esta pesquisa.
        </div>
      `;
      return;
    }

    let html = `<div class="card" style="padding: 14px; border-color: var(--border-active);">`;

    if (results.answers.length > 0) {
      results.answers.forEach(ans => {
        html += `
          <div style="background: var(--bg-elevated); border-left: 2px solid #ffffff; padding: 10px 12px; border-radius: 4px; margin-bottom: 10px;">
            <div style="font-weight: 700; font-size: 0.88rem; color: #ffffff; margin-bottom: 4px;">${ans.question}</div>
            <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45;">${ans.answer}</div>
          </div>
        `;
      });
    }

    if (results.species.length > 0) {
      html += `<div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); letter-spacing: 0.08em; margin: 8px 0 6px 0;">ESPÉCIES ENCONTRADAS:</div>`;
      results.species.forEach(sp => {
        html += `
          <div class="fish-card" style="margin-bottom: 8px; padding: 10px;" onclick="window.pescaApp.openSpeciesDetail('${sp.id}')">
            <div class="fish-thumb-box">${getIcon("fish", 20)}</div>
            <div class="fish-info">
              <div class="fish-name">${sp.name} <small style="font-size: 0.72rem; color: var(--text-muted);">(${sp.scientificName})</small></div>
              <div style="font-size: 0.74rem; color: var(--text-secondary);">${sp.possessionBadge}</div>
            </div>
          </div>
        `;
      });
    }

    if (results.places.length > 0) {
      html += `<div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); letter-spacing: 0.08em; margin: 8px 0 6px 0;">RIOS E PONTOS:</div>`;
      results.places.forEach(pl => {
        html += `
          <div style="padding: 6px 0; border-bottom: 1px solid var(--border-subtle); font-size: 0.8rem;">
            <strong>${pl.type}: ${pl.title}</strong> - <span style="color: var(--text-secondary);">${pl.description.substr(0, 90)}...</span>
          </div>
        `;
      });
    }

    html += `</div>`;
    container.style.display = "block";
    container.innerHTML = html;
  }

  initHomeDashboard() {
    const defeso = checkDefesoStatus(new Date(), "paraguai");
    const titleEl = document.getElementById("defeso-banner-title");
    const descEl = document.getElementById("defeso-banner-desc");

    if (defeso.isActive) {
      titleEl.innerText = "Período de Defeso (Piracema) Ativo";
      descEl.innerText = defeso.statusMessage.replace(/🔴|🟢|⚠️/g, '');
    } else {
      titleEl.innerText = "Temporada de Pesca Regular Aberta";
      descEl.innerText = defeso.statusMessage.replace(/🔴|🟢|⚠️/g, '');
    }

    const solunar = getSolunarDay(new Date());
    document.getElementById("home-moon-name").innerText = solunar.moon.name;
    document.getElementById("home-moon-illum").innerText = `${solunar.moon.illumination}% Iluminação`;
    document.getElementById("home-sun-rise").innerText = solunar.sun.sunrise.formatted;
    document.getElementById("home-sun-set").innerText = solunar.sun.sunset.formatted;
    document.getElementById("home-best-window").innerText = solunar.majorPeriods[0].window;

    const solunarBadge = document.getElementById("home-solunar-badge");
    solunarBadge.innerText = `Atividade: ${solunar.rating.label}`;

    getCityWeather("corumba").then(w => {
      document.getElementById("home-weather-temp").innerText = `${w.temperature}°C`;
    });
  }

  async initMapIfNeeded() {
    if (!this.mapInstance) {
      this.mapInstance = new PescaMSMap("map-view-canvas");
      await this.mapInstance.init();

      const filterChips = document.querySelectorAll(".map-filter-chip");
      filterChips.forEach(chip => {
        chip.addEventListener("click", () => {
          filterChips.forEach(c => c.classList.remove("active"));
          chip.classList.add("active");
          this.mapInstance.setFilter(chip.dataset.filter);
        });
      });

      document.getElementById("btn-center-user-gps").addEventListener("click", () => {
        this.mapInstance.centerOnUser();
      });

      document.getElementById("btn-mark-camp").addEventListener("click", async () => {
        try {
          await this.mapInstance.setAsStartingPoint();
          this.showToast("Ponto de partida salvo no GPS interno.", "success");
        } catch (err) {
          this.showToast(err.message, "warning");
        }
      });

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
      statusEl.innerText = "GPS Satelital Ativo";
      coordsEl.innerText = `${data.userLocation.lat.toFixed(5)}, ${data.userLocation.lng.toFixed(5)}`;
    }

    if (data.returnNav && data.startingPoint) {
      returnInfoEl.innerText = `Rumo Base: ${data.returnNav.distanceFormatted} (${data.returnNav.cardinalDirection} - ${data.returnNav.bearingDeg}°)`;
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

  async initCameraIfNeeded() {
    if (!this.cameraClassifier) {
      const video = document.getElementById("camera-video-feed");
      const canvas = document.getElementById("camera-snapshot-canvas");
      const container = document.getElementById("camera-ai-result");
      this.cameraClassifier = new FishCameraClassifier(video, canvas, container);

      document.getElementById("btn-start-camera").addEventListener("click", async () => {
        const ok = await this.cameraClassifier.startCamera();
        if (!ok) {
          this.showToast("Câmera indisponível. Selecione uma foto da galeria.", "warning");
        }
      });

      document.getElementById("btn-take-photo").addEventListener("click", () => {
        const result = this.cameraClassifier.captureCurrentFrame();
        if (result) {
          this.displayClassifierResult(result);
        } else {
          this.showToast("Inicie a câmera ou escolha uma foto da galeria.", "info");
        }
      });

      document.getElementById("camera-upload-input").addEventListener("change", async (e) => {
        if (e.target.files && e.target.files[0]) {
          const result = await this.cameraClassifier.processUploadedFile(e.target.files[0]);
          this.displayClassifierResult(result);
        }
      });

      document.getElementById("btn-ai-to-calculator").addEventListener("click", () => {
        if (this.currentClassifiedSpecies) {
          document.getElementById("calc-species-select").value = this.currentClassifiedSpecies.id;
          this.navigateTo("calculator");
          this.updateCalculation();
        }
      });

      document.getElementById("btn-ai-to-logbook").addEventListener("click", () => {
        if (this.currentClassifiedSpecies) {
          this.openAddCatchModal(this.currentClassifiedSpecies.id);
        }
      });
    }

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

    const defeso = checkDefesoStatus(new Date(), "paraguai");
    const evaluation = evaluateFishMeasurement(top.species.id, top.species.minSize || 50, defeso.isActive);

    const titleEl = document.getElementById("ai-verdict-title");
    const msgEl = document.getElementById("ai-verdict-message");

    titleEl.innerText = evaluation.title.replace(/^[^\s]+\s/, '');
    msgEl.innerText = evaluation.message;

    const guidelines = getBreedingAndSexGuidelines(top.species);
    document.getElementById("ai-dimorphism-text").innerHTML = `
      ${guidelines.dimorphismText}<br><br>
      <strong>${guidelines.ethicalWarning}</strong>
    `;

    resultBox.style.display = "block";
    resultBox.scrollIntoView({ behavior: "smooth" });
  }

  initCatalog() {
    const grid = document.getElementById("fish-catalog-grid");
    if (!grid) return;

    this.renderCatalogGrid(SPECIES_DATA);

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
        <div class="fish-thumb-box">${getIcon("fish", 22)}</div>
        <div class="fish-info">
          <div class="fish-name">${sp.name}</div>
          <div class="fish-scientific">${sp.scientificName}</div>
          <div class="fish-limits">
            <span class="badge">${sp.possessionBadge.replace(/^[^\s]+\s/, '')}</span>
            <span class="badge badge-outline">${sp.skin}</span>
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
      <div style="background: var(--bg-elevated); padding: 12px; border-radius: var(--radius-sm); border-left: 2px solid #ffffff; margin-bottom: 14px;">
        <h4 style="font-size: 0.88rem; margin-bottom: 4px;">Legislação Vigente no MS:</h4>
        <p style="font-size: 0.8rem; margin-bottom: 0;">${sp.legalSummary}</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; font-size: 0.8rem;">
        <div><strong>Tipo:</strong> ${sp.type}</div>
        <div><strong>Pele:</strong> ${sp.skin}</div>
        <div><strong>Mínimo:</strong> ${sp.minSize ? sp.minSize + ' cm' : 'Sem limite'}</div>
        <div><strong>Máximo:</strong> ${sp.maxSize ? sp.maxSize + ' cm' : 'Sem limite'}</div>
      </div>

      <h4 style="font-size: 0.85rem; margin-bottom: 4px;">Habitat Natural:</h4>
      <p style="font-size: 0.8rem;">${sp.habitat}</p>

      <h4 style="font-size: 0.85rem; margin-bottom: 4px;">Iscas Recomendadas:</h4>
      <p style="font-size: 0.8rem;">${sp.bestBaits.join(", ")}</p>

      <div class="dimorphism-ethics-box" style="margin-top: 10px;">
        <div class="ethics-header">Preservação de Matrizes e Reprodução:</div>
        <p class="ethics-text">${sp.sexualDimorphism}</p>
      </div>

      <div style="margin-top: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <button class="btn btn-primary btn-sm" onclick="window.pescaApp.openInCalculator('${sp.id}')">Aferir Tamanho</button>
        <button class="btn btn-outline btn-sm" onclick="window.pescaApp.openAddCatchModal('${sp.id}')">Registrar Captura</button>
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

  initCalculator() {
    const select = document.getElementById("calc-species-select");
    const slider = document.getElementById("calc-length-slider");
    const numDisplay = document.getElementById("calc-length-val");

    if (!select) return;

    select.innerHTML = "";
    SPECIES_DATA.forEach(sp => {
      const opt = document.createElement("option");
      opt.value = sp.id;
      opt.innerText = `${sp.name} (${sp.possessionBadge.replace(/^[^\s]+\s/, '')})`;
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

    const title = document.getElementById("calc-verdict-title");
    const desc = document.getElementById("calc-verdict-desc");

    title.innerText = verdict.title.replace(/^[^\s]+\s/, '');
    desc.innerText = verdict.message;
  }

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

    titleEl.innerText = defeso.isActive ? "Piracema em Andamento" : "Pesca Aberta (Temporada Regular)";
    detailEl.innerText = defeso.statusMessage.replace(/🔴|🟢|⚠️/g, '');

    const now = new Date();
    const calData = getMonthCalendarData(now.getFullYear(), now.getMonth(), this.selectedBasin);
    document.getElementById("calendar-month-label").innerText = `${calData.monthName} de ${calData.year}`;

    const container = document.getElementById("calendar-grid-container");
    let html = `
      <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); margin-bottom: 8px;">
        <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;">
    `;

    calData.days.forEach(d => {
      if (d.blank) {
        html += `<div></div>`;
      } else {
        const bg = d.isDefeso ? "var(--bg-elevated)" : "var(--bg-surface)";
        const border = d.isToday ? "1.5px solid #ffffff" : "1px solid var(--border-subtle)";
        const textColor = d.isDefeso ? "var(--text-muted)" : "var(--text-primary)";
        html += `
          <div style="background: ${bg}; border: ${border}; border-radius: 4px; padding: 8px 4px; text-align: center; font-size: 0.8rem; font-family: var(--font-mono); color: ${textColor}; font-weight: ${d.isToday ? '800' : '400'};">
            ${d.day}
          </div>
        `;
      }
    });

    html += `</div>`;
    container.innerHTML = html;
  }

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

    document.getElementById("weather-last-sync").innerText = `Atualizado: ${w.cachedAt}`;
    document.getElementById("weather-temp-main").innerText = `${w.temperature}°C`;
    document.getElementById("weather-condition-text").innerText = w.condition.replace(/⚠️/g, '');
    document.getElementById("weather-temp-min").innerText = w.tempMin;
    document.getElementById("weather-temp-max").innerText = w.tempMax;

    document.getElementById("weather-pressure-val").innerText = `${w.pressure} hPa`;
    document.getElementById("weather-pressure-desc").innerText = w.pressureAnalysis.replace(/⚠️/g, '');
    document.getElementById("weather-wind-val").innerText = `${w.windSpeedKmh} km/h`;
    document.getElementById("weather-wind-desc").innerText = w.windStatus.replace(/⚠️/g, '');

    const list = document.getElementById("solunar-periods-list");
    let solunarHtml = `
      <div style="background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 700; font-size: 0.85rem;">${solunar.moon.name} (${solunar.moon.illumination}%)</span>
          <span class="badge badge-inverse">${solunar.rating.label}</span>
        </div>
        <p style="font-size: 0.76rem; margin: 4px 0 0 0; color: var(--text-secondary);">${solunar.rating.description}</p>
      </div>
    `;

    solunar.majorPeriods.forEach(p => {
      solunarHtml += `
        <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 4px; margin-bottom: 6px; font-size: 0.8rem;">
          <span><strong>${p.name}</strong></span>
          <span class="text-mono" style="font-weight: 700; color: #ffffff;">${p.window}</span>
        </div>
      `;
    });

    solunar.minorPeriods.forEach(p => {
      solunarHtml += `
        <div style="display: flex; justify-content: space-between; padding: 6px 12px; background: var(--bg-elevated); border-radius: 4px; margin-bottom: 6px; font-size: 0.78rem;">
          <span style="color: var(--text-secondary);">${p.name}</span>
          <span class="text-mono" style="color: var(--text-muted);">${p.window}</span>
        </div>
      `;
    });

    list.innerHTML = solunarHtml;

    const month = new Date().getMonth();
    let seasonKey = "seca";
    if (month >= 0 && month <= 2) seasonKey = "cheia";
    else if (month >= 3 && month <= 6) seasonKey = "vazante";
    else if (month >= 7 && month <= 9) seasonKey = "seca";
    else seasonKey = "enchente";

    const s = PANTANAL_WATER_SEASONS[seasonKey];
    document.getElementById("water-season-summary").innerHTML = `
      <strong>${s.name}</strong><br>
      ${s.fishingAdvice}<br>
      <em>Visibilidade da água: ${s.waterClarity}</em>
    `;
  }

  initLawsView() {
    const container = document.getElementById("laws-container");
    if (!container) return;

    let html = "";
    LAWS_DATA.coreRules.forEach(rule => {
      html += `
        <div class="card" style="border-left: 2px solid #ffffff;">
          <div class="card-header">
            <h3 style="font-size: 0.95rem;">${rule.title}</h3>
            <span class="badge badge-outline">${rule.badge}</span>
          </div>
          <p style="font-weight: 600; color: var(--text-primary); font-size: 0.85rem;">${rule.summary}</p>
          <p style="font-size: 0.8rem;">${rule.details || ''}</p>
          ${rule.allowed ? `
            <div style="margin-top: 8px;">
              <strong style="font-size: 0.8rem; color: #ffffff;">Permitidos para Amadores:</strong>
              <ul style="padding-left: 18px; font-size: 0.78rem; color: var(--text-secondary); margin-top: 4px; line-height: 1.5;">
                ${rule.allowed.map(a => `<li>${a}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${rule.forbidden ? `
            <div style="margin-top: 8px;">
              <strong style="font-size: 0.8rem; color: var(--text-muted);">Proibidos (Infração Ambiental):</strong>
              <ul style="padding-left: 18px; font-size: 0.78rem; color: var(--text-secondary); margin-top: 4px; line-height: 1.5;">
                ${rule.forbidden.map(f => `<li>${f}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${rule.penalty ? `<div style="background: var(--bg-elevated); border: 1px solid var(--border-subtle); padding: 8px 12px; border-radius: 4px; font-size: 0.75rem; color: var(--text-secondary); margin-top: 10px;"><strong>Penalidade:</strong> ${rule.penalty}</div>` : ''}
        </div>
      `;
    });

    container.innerHTML = html;
  }

  initSafetyView() {
    const copyBtn = document.getElementById("btn-copy-sos-coords");
    const smsBtn = document.getElementById("btn-sms-sos");

    copyBtn.addEventListener("click", () => {
      if (!this.currentUserLocation) {
        this.showToast("Aguardando coordenadas GPS.", "warning");
        return;
      }
      const text = generateSOSText(this.currentUserLocation.lat, this.currentUserLocation.lng);
      navigator.clipboard.writeText(text).then(() => {
        this.showToast("Coordenadas de socorro copiadas.", "success");
      });
    });

    smsBtn.addEventListener("click", () => {
      if (!this.currentUserLocation) {
        this.showToast("Aguardando telemetria GPS.", "warning");
        return;
      }
      const text = encodeURIComponent(generateSOSText(this.currentUserLocation.lat, this.currentUserLocation.lng));
      window.location.href = `sms:?body=${text}`;
    });

    const accordion = document.getElementById("first-aid-accordion");
    if (!accordion) return;

    let html = "";
    FIRST_AID_GUIDES.forEach(g => {
      html += `
        <div class="card" style="padding: 14px; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <div style="font-weight: 700; font-size: 0.9rem; color: #ffffff;">
              ${g.title}
            </div>
            <span class="badge badge-outline" style="font-size: 0.68rem;">${g.severity}</span>
          </div>
          <p style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 6px;">${g.summary}</p>
          <ul style="padding-left: 18px; font-size: 0.76rem; color: var(--text-muted); line-height: 1.5;">
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
      this.showToast("Captura registrada com sucesso.", "success");
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
        <div class="card" style="text-align: center; padding: 28px; color: var(--text-muted); font-size: 0.85rem;">
          <div style="margin-bottom: 8px;">${getIcon("bookOpen", 28)}</div>
          <p>Nenhuma captura registrada no diário.</p>
          <p style="font-size: 0.78rem;">Toque em "Novo Registro" para salvar suas capturas.</p>
        </div>
      `;
      return;
    }

    let html = "";
    catches.forEach(c => {
      html += `
        <div class="card" style="margin-bottom: 10px;">
          <div class="card-header">
            <div class="card-title">${c.speciesName}</div>
            <span class="badge ${c.released ? 'badge-inverse' : 'badge-outline'}">
              ${c.released ? 'Pesque e Solte' : 'Mantido'}
            </span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 0.8rem; margin-bottom: 8px;">
            <div><strong>Comprimento:</strong> ${c.lengthCm ? c.lengthCm + ' cm' : 'N/A'}</div>
            <div><strong>Peso:</strong> ${c.weightKg ? c.weightKg + ' kg' : 'N/A'}</div>
            <div><strong>Isca:</strong> ${c.bait || 'N/A'}</div>
            <div><strong>Data:</strong> ${new Date(c.date).toLocaleDateString('pt-BR')}</div>
          </div>
          ${c.notes ? `<p style="font-size: 0.78rem; background: var(--bg-elevated); padding: 8px; border-radius: 4px; border: 1px solid var(--border-subtle);">${c.notes}</p>` : ''}
          <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
            <button class="btn btn-sm btn-outline" style="border-color: #444444;" onclick="window.pescaApp.deleteCatchRecord('${c.id}')">Excluir</button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  async deleteCatchRecord(id) {
    await removeCatchEntry(id);
    this.renderLogbookList();
    this.showToast("Registro removido.", "info");
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("active");
  }

  showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast`;
    const icon = type === "success" ? getIcon("check", 16) : (type === "warning" ? getIcon("danger", 16) : getIcon("compass", 16));
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-8px)";
      toast.style.transition = "all 0.2s ease";
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }
}

window.pescaApp = new PescaMSApp();
window.addEventListener("DOMContentLoaded", () => {
  window.pescaApp.init();
});
