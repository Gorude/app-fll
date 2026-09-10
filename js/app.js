/**
 * PescaMS - Controlador Central da Aplicação (Design System CRP)
 * Arquitetura baseada nas pranchetas do Sketch crp-app-design-concepts:
 * Toolbar superior com botão de marca branco, menu drawer lateral, e seletor de bacia.
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
    this.activeCaptureTab = "camera";
    this.activeGuideTab = "species";
    this.selectedBasin = "paraguai";
    this.currentClassifiedSpecies = null;
  }

  async init() {
    this.registerServiceWorker();
    this.setupNetworkStatusListener();
    this.setupNavigation();
    this.setupDrawerMenu();
    this.setupStudyAreaChooser();
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
        badge.className = "crp-tag tag-blue";
        text.innerText = "Online";
      } else {
        badge.className = "crp-tag tag-gold";
        text.innerText = "Offline";
        this.showToast("Modo Offline: cartas e IA operando no aparelho.", "warning");
      }
    };

    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    updateStatus();
  }

  setupDrawerMenu() {
    const btnToggle = document.getElementById("btn-toggle-drawer");
    const overlay = document.getElementById("crp-drawer-overlay");
    const menu = document.getElementById("crp-drawer-menu");

    if (btnToggle && overlay) {
      btnToggle.addEventListener("click", () => {
        overlay.classList.toggle("active");
      });

      overlay.addEventListener("click", (e) => {
        if (!menu.contains(e.target) || e.target === overlay) {
          overlay.classList.remove("active");
        }
      });

      const drawerButtons = document.querySelectorAll(".crp-drawer-item");
      drawerButtons.forEach(btn => {
        btn.addEventListener("click", () => {
          const navTarget = btn.dataset.nav;
          overlay.classList.remove("active");
          this.navigateTo(navTarget);
        });
      });
    }
  }

  setupStudyAreaChooser() {
    const btn = document.getElementById("btn-select-study-area");
    if (btn) {
      btn.addEventListener("click", () => {
        document.getElementById("study-area-modal").classList.add("active");
      });
    }
  }

  setStudyArea(basinId, label) {
    this.selectedBasin = basinId.includes("parana") ? "parana" : "paraguai";
    const labelEl = document.getElementById("current-study-area-label");
    if (labelEl) labelEl.innerText = label;

    this.closeModal("study-area-modal");
    this.renderDefesoView();

    // Sincroniza cidade padrão
    let city = "corumba";
    if (basinId === "parana") city = "tres_lagoas";
    else if (basinId === "pantanal_sul") city = "porto_murtinho";
    else if (basinId === "bodoquena") city = "bonito";

    const citySelect = document.getElementById("weather-city-select");
    if (citySelect) {
      citySelect.value = city;
      this.loadWeatherForCity(city);
    }

    this.showToast(`Região alterada para: ${label}`, "info");
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
      "pescar": { view: "home" },
      "home": { view: "home" },
      "mapa": { view: "map" },
      "map": { view: "map" },
      "capture": { view: "capture", sub: "camera" },
      "camera": { view: "capture", sub: "camera" },
      "calculadora": { view: "capture", sub: "ruler" },
      "regua": { view: "capture", sub: "ruler" },
      "guide": { view: "guide", sub: "species" },
      "catalogo": { view: "guide", sub: "species" },
      "peixes": { view: "guide", sub: "species" },
      "defeso": { view: "guide", sub: "defeso" },
      "piracema": { view: "guide", sub: "defeso" },
      "leis": { view: "guide", sub: "laws" },
      "regras": { view: "guide", sub: "laws" },
      "seguranca": { view: "safety" },
      "sos": { view: "safety" },
      "tempo": { view: "weather" },
      "clima": { view: "weather" },
      "diario": { view: "logbook" },
      "logbook": { view: "logbook" }
    };

    const target = mapHashToView[hash] || { view: "home" };
    this.navigateTo(target.view, false, target.sub);
  }

  navigateTo(viewId, updateHash = true, subTab = null) {
    const targetSection = document.getElementById(`view-${viewId}`);
    if (!targetSection) return;

    document.querySelectorAll(".app-view").forEach(view => view.classList.remove("active"));
    targetSection.classList.add("active");

    // Sincroniza barra inferior
    document.querySelectorAll("#app-bottom-nav .nav-item").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.view === viewId);
    });

    // Sincroniza menu lateral
    document.querySelectorAll(".crp-drawer-item").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.nav === viewId);
    });

    this.activeView = viewId;
    if (updateHash) {
      window.location.hash = viewId;
    }

    document.getElementById("app-main").scrollTop = 0;

    // Ações de ativação
    if (viewId === "map") {
      this.initMapIfNeeded();
    } else if (viewId === "capture") {
      if (subTab) {
        this.switchCaptureTab(subTab);
      } else {
        this.switchCaptureTab(this.activeCaptureTab || "camera");
      }
    } else if (viewId === "guide") {
      if (subTab) {
        this.switchGuideTab(subTab);
      }
    }

    // Economia de bateria da câmera fora do modo scanner
    if (viewId !== "capture" || this.activeCaptureTab !== "camera") {
      if (this.cameraClassifier) {
        this.cameraClassifier.stopCamera();
      }
    }
  }

  switchCaptureTab(tab) {
    this.activeCaptureTab = tab;
    const btnCamera = document.getElementById("tab-btn-camera");
    const btnRuler = document.getElementById("tab-btn-ruler");
    const panelCamera = document.getElementById("capture-panel-camera");
    const panelRuler = document.getElementById("capture-panel-ruler");

    if (tab === "camera") {
      btnCamera.className = "segmented-btn active theme-blue";
      btnRuler.className = "segmented-btn";
      panelCamera.style.display = "block";
      panelRuler.style.display = "none";
      this.initCameraIfNeeded();
    } else {
      btnRuler.className = "segmented-btn active theme-blue";
      btnCamera.className = "segmented-btn";
      panelCamera.style.display = "none";
      panelRuler.style.display = "block";
      if (this.cameraClassifier) {
        this.cameraClassifier.stopCamera();
      }
    }
  }

  switchGuideTab(tab) {
    this.activeGuideTab = tab;
    const btnSpecies = document.getElementById("tab-guide-species");
    const btnDefeso = document.getElementById("tab-guide-defeso");
    const btnLaws = document.getElementById("tab-guide-laws");

    const panelSpecies = document.getElementById("guide-panel-species");
    const panelDefeso = document.getElementById("guide-panel-defeso");
    const panelLaws = document.getElementById("guide-panel-laws");

    btnSpecies.className = "segmented-btn";
    btnDefeso.className = "segmented-btn";
    btnLaws.className = "segmented-btn";

    panelSpecies.style.display = "none";
    panelDefeso.style.display = "none";
    panelLaws.style.display = "none";

    if (tab === "species") {
      btnSpecies.className = "segmented-btn active theme-blue";
      panelSpecies.style.display = "block";
    } else if (tab === "defeso") {
      btnDefeso.className = "segmented-btn active theme-blue";
      panelDefeso.style.display = "block";
    } else if (tab === "laws") {
      btnLaws.className = "segmented-btn active theme-blue";
      panelLaws.style.display = "block";
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

  quickSearch(term) {
    const input = document.getElementById("global-search-input");
    if (!input) return;
    input.value = term;
    const clearBtn = document.getElementById("btn-clear-search");
    if (clearBtn) clearBtn.style.display = "flex";
    const resultsContainer = document.getElementById("search-results-container");
    const results = performOfflineSearch(term);
    this.renderSearchResults(results, resultsContainer);
    input.scrollIntoView({ behavior: "smooth" });
  }

  renderSearchResults(results, container) {
    const hasResults = results.answers.length > 0 || results.species.length > 0 || results.places.length > 0 || results.laws.length > 0;

    if (!hasResults) {
      container.style.display = "block";
      container.innerHTML = `
        <div class="card" style="padding: 14px; text-align: center; color: var(--crp-dark-soft); font-size: 0.85rem;">
          Nenhum resultado local encontrado para esta pesquisa.
        </div>
      `;
      return;
    }

    let html = `<div class="card" style="padding: 14px; border-color: var(--crp-blue-primary);">`;

    if (results.answers.length > 0) {
      results.answers.forEach(ans => {
        html += `
          <div style="background: var(--crp-blue-tint); border-left: 3px solid var(--crp-blue-primary); padding: 10px 12px; border-radius: 4px; margin-bottom: 8px;">
            <div style="font-weight: 600; font-size: 0.88rem; color: var(--crp-dark); margin-bottom: 2px;">${ans.question}</div>
            <div style="font-size: 0.82rem; color: var(--crp-dark-soft); line-height: 1.4;">${ans.answer}</div>
          </div>
        `;
      });
    }

    if (results.species.length > 0) {
      html += `<div style="font-size: 0.72rem; font-weight: 700; color: var(--crp-dark-soft); letter-spacing: 0.08em; margin: 8px 0 6px 0;">ESPÉCIES ENCONTRADAS:</div>`;
      results.species.forEach(sp => {
        html += `
          <div class="fish-card" style="margin-bottom: 6px; padding: 10px;" onclick="window.pescaApp.openSpeciesDetail('${sp.id}')">
            <div class="fish-thumb-box">${getIcon("fish", 20)}</div>
            <div class="fish-info">
              <div class="fish-name">${sp.name} <small style="font-size: 0.72rem; color: var(--crp-dark-soft);">(${sp.scientificName})</small></div>
              <div style="font-size: 0.74rem; color: var(--crp-dark-soft);">${sp.possessionBadge}</div>
            </div>
          </div>
        `;
      });
    }

    if (results.places.length > 0) {
      html += `<div style="font-size: 0.72rem; font-weight: 700; color: var(--crp-dark-soft); letter-spacing: 0.08em; margin: 8px 0 6px 0;">RIOS E PONTOS:</div>`;
      results.places.forEach(pl => {
        html += `
          <div style="padding: 6px 0; border-bottom: 1px solid var(--crp-grey-6); font-size: 0.8rem;">
            <strong>${pl.type}: ${pl.title}</strong> - <span style="color: var(--crp-dark-soft);">${pl.description.substr(0, 90)}...</span>
          </div>
        `;
      });
    }

    html += `</div>`;
    container.style.display = "block";
    container.innerHTML = html;
  }

  initHomeDashboard() {
    const defeso = checkDefesoStatus(new Date(), this.selectedBasin);
    const titleEl = document.getElementById("defeso-banner-title");
    const descEl = document.getElementById("defeso-banner-desc");

    if (defeso.isActive) {
      titleEl.innerText = "Período de Defeso (Piracema) Ativo";
      descEl.innerText = defeso.statusMessage.replace(/🔴|🟢|⚠️/g, '');
    } else {
      titleEl.innerText = "Temporada de Pesca Aberta no MS";
      descEl.innerText = defeso.statusMessage.replace(/🔴|🟢|⚠️/g, '');
    }

    const solunar = getSolunarDay(new Date());
    const moonNameEl = document.getElementById("home-moon-name");
    const moonIllumEl = document.getElementById("home-moon-illum");
    const sunRiseEl = document.getElementById("home-sun-rise");
    const sunSetEl = document.getElementById("home-sun-set");
    const bestWindowEl = document.getElementById("home-best-window");
    const solunarBadgeEl = document.getElementById("home-solunar-badge");

    if (moonNameEl) moonNameEl.innerText = solunar.moon.name;
    if (moonIllumEl) moonIllumEl.innerText = `${solunar.moon.illumination}% Iluminação`;
    if (sunRiseEl) sunRiseEl.innerText = solunar.sun.sunrise.formatted;
    if (sunSetEl) sunSetEl.innerText = solunar.sun.sunset.formatted;
    if (bestWindowEl) bestWindowEl.innerText = solunar.majorPeriods[0].window;
    if (solunarBadgeEl) solunarBadgeEl.innerText = `Atividade: ${solunar.rating.label}`;

    getCityWeather("corumba").then(w => {
      const tempEl = document.getElementById("home-weather-temp");
      if (tempEl) tempEl.innerText = `${w.temperature}°C`;
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
          this.showToast("Ponto Base salvo no GPS do aparelho.", "success");
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
          this.switchCaptureTab("ruler");
          this.updateCalculation();
          this.showToast(`Espécie '${this.currentClassifiedSpecies.name}' selecionada na régua.`, "success");
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

    const defeso = checkDefesoStatus(new Date(), this.selectedBasin);
    const evaluation = evaluateFishMeasurement(top.species.id, top.species.minSize || 50, defeso.isActive);

    const titleEl = document.getElementById("ai-verdict-title");
    const msgEl = document.getElementById("ai-verdict-message");

    titleEl.innerText = evaluation.title.replace(/^[^\s]+\s/, '');
    msgEl.innerText = evaluation.message;

    const guidelines = getBreedingAndSexGuidelines(top.species);
    document.getElementById("ai-dimorphism-text").innerHTML = `
      ${guidelines.dimorphismText}<br><br>
      <strong style="color: var(--crp-dark);">${guidelines.ethicalWarning}</strong>
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
        <div class="fish-thumb-box">${getIcon("fish", 20)}</div>
        <div class="fish-info">
          <div class="fish-name">${sp.name}</div>
          <div class="fish-scientific">${sp.scientificName}</div>
          <div class="fish-limits">
            <span class="crp-tag tag-blue">${sp.possessionBadge.replace(/^[^\s]+\s/, '')}</span>
            <span class="crp-tag" style="background: var(--crp-grey-6); color: var(--crp-dark);">${sp.skin}</span>
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
      <div style="background: var(--crp-blue-tint); padding: 12px; border-radius: var(--radius-xs); border-left: 3px solid var(--crp-blue-primary); margin-bottom: 12px;">
        <h4 style="font-family: var(--font-heading); font-size: 0.88rem; margin-bottom: 4px; color: var(--crp-dark);">Legislação Vigente no MS:</h4>
        <p style="font-size: 0.82rem; margin-bottom: 0; color: var(--crp-dark-soft);">${sp.legalSummary}</p>
      </div>

      <div class="crp-metric-grid" style="margin-bottom: 14px;">
        <div class="crp-metric-item">
          <span class="crp-metric-label">Tipo</span>
          <span class="crp-metric-value" style="font-size: 0.95rem;">${sp.type}</span>
        </div>
        <div class="crp-metric-item">
          <span class="crp-metric-label">Pele</span>
          <span class="crp-metric-value" style="font-size: 0.95rem;">${sp.skin}</span>
        </div>
        <div class="crp-metric-item">
          <span class="crp-metric-label">Mínimo Legal</span>
          <span class="crp-metric-value" style="font-size: 0.95rem; color: var(--crp-blue-primary);">${sp.minSize ? sp.minSize + ' cm' : 'Sem limite'}</span>
        </div>
        <div class="crp-metric-item">
          <span class="crp-metric-label">Máximo Legal</span>
          <span class="crp-metric-value" style="font-size: 0.95rem; color: var(--crp-danger);">${sp.maxSize ? sp.maxSize + ' cm' : 'Sem limite'}</span>
        </div>
      </div>

      <h4 style="font-family: var(--font-heading); font-size: 0.88rem; margin-bottom: 4px; color: var(--crp-dark);">Habitat no Pantanal:</h4>
      <p style="font-size: 0.82rem; color: var(--crp-dark-soft); margin-bottom: 10px;">${sp.habitat}</p>

      <h4 style="font-family: var(--font-heading); font-size: 0.88rem; margin-bottom: 4px; color: var(--crp-dark);">Iscas Recomendadas:</h4>
      <p style="font-size: 0.82rem; color: var(--crp-dark-soft); margin-bottom: 12px;">${sp.bestBaits.join(", ")}</p>

      <div class="dimorphism-ethics-box">
        <div class="ethics-header">Preservação de Matrizes e Reprodução:</div>
        <p class="ethics-text">${sp.sexualDimorphism}</p>
      </div>

      <div style="margin-top: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <button class="btn btn-primary btn-sm" onclick="window.pescaApp.openInCalculator('${sp.id}')">Validar na Régua</button>
        <button class="btn btn-select btn-sm" onclick="window.pescaApp.openAddCatchModal('${sp.id}')">Registrar Captura</button>
      </div>
    `;

    document.getElementById("species-detail-modal").classList.add("active");
  }

  openInCalculator(speciesId) {
    this.closeModal("species-detail-modal");
    document.getElementById("calc-species-select").value = speciesId;
    this.navigateTo("capture", true, "ruler");
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

    const card = document.getElementById("calc-verdict-card");
    const title = document.getElementById("calc-verdict-title");
    const desc = document.getElementById("calc-verdict-desc");

    title.innerText = verdict.title.replace(/^[^\s]+\s/, '');
    desc.innerText = verdict.message;

    if (speciesId === "dourado" || verdict.status === "under_minimum" || verdict.status === "over_maximum" || verdict.status === "defeso_active") {
      card.className = "technical-status-card status-danger";
    } else {
      card.className = "technical-status-card";
    }
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
      <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; font-size: 0.72rem; font-weight: 700; color: var(--crp-dark-soft); margin-bottom: 8px;">
        <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;">
    `;

    calData.days.forEach(d => {
      if (d.blank) {
        html += `<div></div>`;
      } else {
        const bg = d.isDefeso ? "var(--crp-danger-tint)" : "var(--bg-canvas)";
        const border = d.isToday ? "2px solid var(--crp-blue-primary)" : "1px solid var(--crp-grey-6)";
        const textColor = d.isDefeso ? "var(--crp-danger-dark)" : "var(--crp-dark)";
        html += `
          <div style="background: ${bg}; border: ${border}; border-radius: var(--radius-xs); padding: 8px 4px; text-align: center; font-size: 0.82rem; font-family: var(--font-heading); color: ${textColor}; font-weight: ${d.isToday ? '700' : '500'};">
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
      <div style="background: var(--crp-blue-ice); border: 1px solid var(--crp-grey-5); border-radius: var(--radius-xs); padding: 12px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-family: var(--font-heading); font-weight: 500; font-size: 0.9rem; color: var(--crp-dark);">${solunar.moon.name} (${solunar.moon.illumination}% Luz)</span>
          <span class="crp-tag tag-blue">${solunar.rating.label}</span>
        </div>
        <p style="font-size: 0.78rem; margin: 4px 0 0 0; color: var(--crp-dark-soft);">${solunar.rating.description}</p>
      </div>
    `;

    solunar.majorPeriods.forEach(p => {
      solunarHtml += `
        <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: #ffffff; border: 1px solid var(--crp-grey-6); border-radius: var(--radius-xs); margin-bottom: 6px; font-size: 0.82rem;">
          <span style="font-weight: 600; color: var(--crp-dark);">${p.name}</span>
          <span class="text-mono" style="font-weight: 700; color: var(--crp-blue-primary);">${p.window}</span>
        </div>
      `;
    });

    solunar.minorPeriods.forEach(p => {
      solunarHtml += `
        <div style="display: flex; justify-content: space-between; padding: 6px 12px; background: var(--bg-canvas); border-radius: var(--radius-xs); margin-bottom: 4px; font-size: 0.78rem;">
          <span style="color: var(--crp-dark-soft);">${p.name}</span>
          <span class="text-mono" style="color: var(--crp-dark-soft);">${p.window}</span>
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
      const isDanger = rule.badge && rule.badge.toLowerCase().includes("proibido");
      html += `
        <div class="card" style="border-left: 4px solid ${isDanger ? 'var(--crp-danger)' : 'var(--crp-blue-primary)'};">
          <div class="card-header">
            <h3 style="font-size: 0.95rem;">${rule.title}</h3>
            <span class="crp-tag ${isDanger ? 'tag-danger' : 'tag-blue'}">${rule.badge}</span>
          </div>
          <p style="font-weight: 600; color: var(--crp-dark); font-size: 0.85rem;">${rule.summary}</p>
          <p style="font-size: 0.8rem; color: var(--crp-dark-soft);">${rule.details || ''}</p>
          ${rule.allowed ? `
            <div style="margin-top: 8px;">
              <strong style="font-size: 0.8rem; color: var(--crp-dark);">Permitidos para Pesca Amadora:</strong>
              <ul style="padding-left: 18px; font-size: 0.78rem; color: var(--crp-dark-soft); margin-top: 4px; line-height: 1.5;">
                ${rule.allowed.map(a => `<li>${a}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${rule.forbidden ? `
            <div style="margin-top: 8px;">
              <strong style="font-size: 0.8rem; color: var(--crp-danger);">Proibições Estritas (Infração Ambiental):</strong>
              <ul style="padding-left: 18px; font-size: 0.78rem; color: var(--crp-dark-soft); margin-top: 4px; line-height: 1.5;">
                ${rule.forbidden.map(f => `<li>${f}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${rule.penalty ? `<div style="background: var(--bg-canvas); border: 1px solid var(--crp-grey-6); padding: 8px 12px; border-radius: var(--radius-xs); font-size: 0.75rem; color: var(--crp-dark-soft); margin-top: 10px;"><strong>Penalidade:</strong> ${rule.penalty}</div>` : ''}
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
        this.showToast("Aguardando telemetria do sinal GPS.", "warning");
        return;
      }
      const text = generateSOSText(this.currentUserLocation.lat, this.currentUserLocation.lng);
      navigator.clipboard.writeText(text).then(() => {
        this.showToast("Coordenadas copiadas para transmissão.", "success");
      });
    });

    smsBtn.addEventListener("click", () => {
      if (!this.currentUserLocation) {
        this.showToast("Aguardando sinal satelital.", "warning");
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
        <div class="card" style="padding: 12px; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <div style="font-family: var(--font-heading); font-weight: 500; font-size: 0.9rem; color: var(--crp-dark);">
              ${g.title}
            </div>
            <span class="crp-tag tag-blue" style="font-size: 0.68rem;">${g.severity}</span>
          </div>
          <p style="font-size: 0.8rem; color: var(--crp-dark-soft); margin-bottom: 6px;">${g.summary}</p>
          <ul style="padding-left: 18px; font-size: 0.78rem; color: var(--crp-dark-soft); line-height: 1.5;">
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
        <div class="card" style="text-align: center; padding: 28px; color: var(--crp-dark-soft); font-size: 0.85rem;">
          <div style="margin-bottom: 8px; color: var(--crp-blue-primary);">${getIcon("bookOpen", 28)}</div>
          <p style="font-weight: 500; color: var(--crp-dark);">Nenhuma captura registrada no diário.</p>
          <p style="font-size: 0.78rem;">Toque em "Novo Registro" para salvar suas capturas.</p>
        </div>
      `;
      return;
    }

    let html = "";
    catches.forEach(c => {
      html += `
        <div class="card" style="margin-bottom: 10px; border-left: 4px solid ${c.released ? 'var(--crp-green-accent)' : 'var(--crp-blue-primary)'};">
          <div class="card-header">
            <div class="card-title">${c.speciesName}</div>
            <span class="crp-tag ${c.released ? '' : 'tag-blue'}">
              ${c.released ? 'Pesque e Solte' : 'Mantido'}
            </span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 0.8rem; margin-bottom: 8px;">
            <div><strong>Comprimento:</strong> ${c.lengthCm ? c.lengthCm + ' cm' : 'N/A'}</div>
            <div><strong>Peso:</strong> ${c.weightKg ? c.weightKg + ' kg' : 'N/A'}</div>
            <div><strong>Isca:</strong> ${c.bait || 'N/A'}</div>
            <div><strong>Data:</strong> ${new Date(c.date).toLocaleDateString('pt-BR')}</div>
          </div>
          ${c.notes ? `<p style="font-size: 0.78rem; background: var(--bg-canvas); padding: 8px; border-radius: var(--radius-xs); border: 1px solid var(--crp-grey-6); color: var(--crp-dark-soft);">${c.notes}</p>` : ''}
          <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
            <button class="btn btn-sm btn-outline" onclick="window.pescaApp.deleteCatchRecord('${c.id}')">Excluir</button>
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
    toast.className = `toast ${type === 'warning' ? 'toast-warning' : (type === 'success' ? 'toast-success' : '')}`;
    const icon = type === "success" ? getIcon("check", 16) : (type === "warning" ? getIcon("danger", 16) : getIcon("compass", 16));
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-6px)";
      toast.style.transition = "all 0.2s ease";
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }
}

window.pescaApp = new PescaMSApp();
window.addEventListener("DOMContentLoaded", () => {
  window.pescaApp.init();
});
