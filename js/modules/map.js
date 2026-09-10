/**
 * Módulo de Mapa Interativo e Navegação Offline do Mato Grosso do Sul
 * Utiliza Leaflet.js empacotado localmente.
 * Suporta:
 * - Camada vetorial de rios e zonas georreferenciadas (🟢, 🔴, 🟡, ⚠️, 🛶, 🏕️, 🏥, 👮, 🐟)
 * - Rastreamento GPS do pescador em tempo real (sem precisar de internet)
 * - Bússola e HUD "Retorno ao Ponto de Partida" (Distância + Rumo em graus)
 * - Filtros rápidos por categoria
 */

import { MS_GEO_BOUNDS, FISHING_ZONES, POINTS_OF_INTEREST, MS_RIVERS_GEO } from "../data/rivers-zones.js";
import { saveWaypoint, getAllWaypoints, getStartingPoint, deleteWaypoint } from "../db.js";

export class PescaMSMap {
  constructor(mapContainerId) {
    this.containerId = mapContainerId;
    this.map = null;
    this.userMarker = null;
    this.userLocation = null;
    this.startingPoint = null;
    this.watchId = null;
    this.layers = {
      rivers: null,
      zones: null,
      pois: null,
      userWaypoints: null
    };
    this.activeFilter = "all";
  }

  /**
   * Inicializa o mapa com Leaflet local
   */
  async init() {
    if (this.map) return;

    // Verificar se L (Leaflet) está disponível
    if (typeof L === "undefined") {
      console.error("Leaflet não carregado.");
      return;
    }

    // Criar instância do mapa centralizado no Mato Grosso do Sul
    this.map = L.map(this.containerId, {
      center: MS_GEO_BOUNDS.center,
      zoom: MS_GEO_BOUNDS.zoom,
      minZoom: MS_GEO_BOUNDS.minZoom,
      maxZoom: MS_GEO_BOUNDS.maxZoom,
      zoomControl: false // Criaremos controle customizado
    });

    // Adicionar controle de zoom na direita superior
    L.control.zoom({ position: "topright" }).addTo(this.map);

    // Tentar adicionar camada de OpenStreetMap (quando online ou do cache do SW)
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "© OpenStreetMap contributors"
    }).addTo(this.map);

    // Inicializar grupos de camadas
    this.layers.rivers = L.layerGroup().addTo(this.map);
    this.layers.zones = L.layerGroup().addTo(this.map);
    this.layers.pois = L.layerGroup().addTo(this.map);
    this.layers.userWaypoints = L.layerGroup().addTo(this.map);

    // Renderizar dados no mapa
    this.renderRivers();
    this.renderZones();
    this.renderPOIs();
    await this.renderUserWaypoints();

    // Carregar ponto de partida se existir
    this.startingPoint = await getStartingPoint();
  }

  /**
   * Renderiza as calhas principais dos rios
   */
  renderRivers() {
    this.layers.rivers.clearLayers();

    MS_RIVERS_GEO.forEach(river => {
      const polyline = L.polyline(river.coordinates, {
        color: "#0284c7",
        weight: 4,
        opacity: 0.85,
        smoothFactor: 1
      });

      polyline.bindPopup(`
        <div class="map-popup">
          <h4>🌊 ${river.name}</h4>
          <p><strong>Bacia:</strong> ${river.basin}</p>
          <p><strong>Extensão:</strong> ${river.lengthKm}</p>
          <p>${river.description}</p>
        </div>
      `);

      this.layers.rivers.addLayer(polyline);
    });
  }

  /**
   * Renderiza as zonas delimitadas de pesca (🟢, 🔴, 🟡)
   */
  renderZones() {
    this.layers.zones.clearLayers();

    FISHING_ZONES.forEach(zone => {
      if (this.activeFilter !== "all" && this.activeFilter !== zone.category) {
        return;
      }

      let color = "#10b981"; // permitted
      let fillColor = "#10b981";
      if (zone.category === "prohibited") {
        color = "#ef4444";
        fillColor = "#ef4444";
      } else if (zone.category === "restricted") {
        color = "#f59e0b";
        fillColor = "#f59e0b";
      }

      let shape;
      if (zone.coordinates) {
        shape = L.polygon(zone.coordinates, {
          color,
          weight: 2,
          fillColor,
          fillOpacity: 0.25
        });
      } else if (zone.center && zone.radiusKm) {
        shape = L.circle(zone.center, {
          radius: zone.radiusKm * 1000,
          color,
          weight: 2,
          fillColor,
          fillOpacity: 0.25
        });
      }

      if (shape) {
        shape.bindPopup(`
          <div class="map-popup">
            <h4>${zone.type}</h4>
            <p><strong>${zone.name}</strong></p>
            <p>${zone.description}</p>
            ${zone.legalBasis ? `<small><strong>Base Legal:</strong> ${zone.legalBasis}</small>` : ""}
          </div>
        `);
        this.layers.zones.addLayer(shape);
      }
    });
  }

  /**
   * Renderiza os pontos de interesse (PMA, Rampas, Hospitais, Perigos, Hotspots)
   */
  renderPOIs() {
    this.layers.pois.clearLayers();

    POINTS_OF_INTEREST.forEach(poi => {
      // Filtragem
      if (this.activeFilter !== "all") {
        if (this.activeFilter === "prohibited" || this.activeFilter === "permitted" || this.activeFilter === "restricted") {
          return; // Estes são polígonos
        }
        if (this.activeFilter === "danger" && poi.category !== "danger") return;
        if (this.activeFilter === "access" && poi.category !== "access" && poi.category !== "camping") return;
        if (this.activeFilter === "safety" && poi.category !== "hospital" && poi.category !== "police") return;
        if (this.activeFilter === "fish_spot" && poi.category !== "fish_spot") return;
      }

      // Criar ícone visual com SVG baseado na categoria
      const iconConfig = this.getMarkerIcon(poi.category);
      const customIcon = L.divIcon({
        className: "custom-map-icon",
        html: `<div class="marker-pin ${poi.category}">${iconConfig.emoji}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -32]
      });

      const marker = L.marker([poi.lat, poi.lng], { icon: customIcon });

      marker.bindPopup(`
        <div class="map-popup">
          <div class="popup-badge ${poi.category}">${poi.type}</div>
          <h4>${poi.name}</h4>
          <p>${poi.description}</p>
          ${poi.phone ? `<p><strong>📞 Contato:</strong> <a href="tel:${poi.phone.replace(/[^0-9]/g, '')}">${poi.phone}</a></p>` : ""}
          ${poi.address ? `<p><strong>📍 Endereço:</strong> ${poi.address}</p>` : ""}
          ${poi.species ? `<p><strong>🐟 Espécies comuns:</strong> ${poi.species.join(", ")}</p>` : ""}
          <div class="popup-coords">GPS: ${poi.lat.toFixed(5)}, ${poi.lng.toFixed(5)}</div>
        </div>
      `);

      this.layers.pois.addLayer(marker);
    });
  }

  /**
   * Renderiza waypoints personalizados do pescador (inclusive Ponto de Partida)
   */
  async renderUserWaypoints() {
    this.layers.userWaypoints.clearLayers();
    const waypoints = await getAllWaypoints();

    waypoints.forEach(wp => {
      const isCamp = wp.type === "camp";
      const icon = L.divIcon({
        className: "custom-map-icon",
        html: `<div class="marker-pin ${isCamp ? 'camp-start' : 'user-wp'}">${isCamp ? '🏕️' : '📍'}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -34]
      });

      const marker = L.marker([wp.lat, wp.lng], { icon });
      marker.bindPopup(`
        <div class="map-popup">
          <div class="popup-badge success">${isCamp ? '⛺ PONTO DE PARTIDA (BASE)' : 'MEU PONTO DE PESCA'}</div>
          <h4>${wp.name}</h4>
          <p><small>Criado em: ${new Date(wp.createdAt).toLocaleString('pt-BR')}</small></p>
          <div class="popup-coords">GPS: ${wp.lat.toFixed(5)}, ${wp.lng.toFixed(5)}</div>
          <button class="btn btn-sm btn-outline-danger mt-2" onclick="window.pescaApp.deleteUserWaypoint('${wp.id}')">Excluir Ponto</button>
        </div>
      `);

      this.layers.userWaypoints.addLayer(marker);
    });
  }

  getMarkerIcon(category) {
    switch (category) {
      case "danger": return { emoji: "⚠️" };
      case "police": return { emoji: "👮" };
      case "access": return { emoji: "🛶" };
      case "camping": return { emoji: "🏕️" };
      case "hospital": return { emoji: "🏥" };
      case "fish_spot": return { emoji: "🐟" };
      default: return { emoji: "📍" };
    }
  }

  /**
   * Inicia o rastreamento por GPS em tempo real (funciona sem sinal de internet)
   */
  startGPSTracking(onLocationUpdate) {
    if (!navigator.geolocation) {
      console.warn("Geolocalização não suportada.");
      return;
    }

    const options = {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000
    };

    const handleSuccess = (position) => {
      const { latitude, longitude, heading, speed, accuracy } = position.coords;
      this.userLocation = { lat: latitude, lng: longitude, heading, speed, accuracy };

      // Atualizar ou criar marcador do usuário
      if (!this.userMarker) {
        const userIcon = L.divIcon({
          className: "user-gps-marker",
          html: `<div class="gps-pulse"></div><div class="gps-dot">🚤</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });
        this.userMarker = L.marker([latitude, longitude], { icon: userIcon, zIndexOffset: 1000 }).addTo(this.map);
      } else {
        this.userMarker.setLatLng([latitude, longitude]);
      }

      // Calcular navegação de retorno se houver ponto de partida
      let returnNav = null;
      if (this.startingPoint) {
        returnNav = this.calculateReturnHeading(latitude, longitude, this.startingPoint.lat, this.startingPoint.lng);
      }

      if (onLocationUpdate) {
        onLocationUpdate({
          userLocation: this.userLocation,
          returnNav,
          startingPoint: this.startingPoint
        });
      }
    };

    const handleError = (err) => {
      console.warn("GPS watch error:", err.message);
    };

    this.watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
  }

  stopGPSTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  centerOnUser() {
    if (this.userLocation && this.map) {
      this.map.setView([this.userLocation.lat, this.userLocation.lng], 14);
    }
  }

  /**
   * Marca o local atual como "Ponto de Partida" (Acampamento / Rampa)
   */
  async setAsStartingPoint(name = "Meu Acampamento / Carreta") {
    if (!this.userLocation) {
      throw new Error("Localização GPS ainda não detectada. Aguarde o sinal do GPS do aparelho.");
    }

    // Salvar no banco
    const wp = await saveWaypoint({
      id: "camp_start_point",
      name,
      type: "camp",
      lat: this.userLocation.lat,
      lng: this.userLocation.lng
    });

    this.startingPoint = wp;
    await this.renderUserWaypoints();
    return wp;
  }

  /**
   * Calcula distância (haversine) e azimute (rumo) até o ponto de partida
   */
  calculateReturnHeading(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // raio da Terra em metros
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    // Distância Haversine
    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceMeters = Math.round(R * c);

    // Azimute (Bearing)
    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) -
              Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
    let bearingDeg = (Math.atan2(y, x) * 180) / Math.PI;
    bearingDeg = (bearingDeg + 360) % 360;

    let distanceFormatted = `${distanceMeters} m`;
    if (distanceMeters >= 1000) {
      distanceFormatted = `${(distanceMeters / 1000).toFixed(2)} km`;
    }

    return {
      distanceMeters,
      distanceFormatted,
      bearingDeg: Math.round(bearingDeg),
      cardinalDirection: this.bearingToCardinal(bearingDeg)
    };
  }

  bearingToCardinal(deg) {
    const directions = ["N", "NNE", "NE", "ENE", "L", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"];
    const idx = Math.round(deg / 22.5) % 16;
    return directions[idx];
  }

  setFilter(filterCategory) {
    this.activeFilter = filterCategory;
    this.renderZones();
    this.renderPOIs();
  }
}
