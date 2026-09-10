/**
 * Módulo de Mapa Interativo e Navegação Monocromática do Mato Grosso do Sul
 * Utiliza Leaflet.js empacotado localmente com marcadores SVG vetoriais de precisão.
 */

import { MS_GEO_BOUNDS, FISHING_ZONES, POINTS_OF_INTEREST, MS_RIVERS_GEO } from "../data/rivers-zones.js";
import { saveWaypoint, getAllWaypoints, getStartingPoint, deleteWaypoint } from "../db.js";
import { ICONS, getIcon } from "../icons.js";

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

  async init() {
    if (this.map) return;

    if (typeof L === "undefined") {
      console.error("Leaflet não carregado.");
      return;
    }

    this.map = L.map(this.containerId, {
      center: MS_GEO_BOUNDS.center,
      zoom: MS_GEO_BOUNDS.zoom,
      minZoom: MS_GEO_BOUNDS.minZoom,
      maxZoom: MS_GEO_BOUNDS.maxZoom,
      zoomControl: false
    });

    L.control.zoom({ position: "topright" }).addTo(this.map);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "© OpenStreetMap contributors"
    }).addTo(this.map);

    this.layers.rivers = L.layerGroup().addTo(this.map);
    this.layers.zones = L.layerGroup().addTo(this.map);
    this.layers.pois = L.layerGroup().addTo(this.map);
    this.layers.userWaypoints = L.layerGroup().addTo(this.map);

    this.renderRivers();
    this.renderZones();
    this.renderPOIs();
    await this.renderUserWaypoints();

    this.startingPoint = await getStartingPoint();
  }

  renderRivers() {
    this.layers.rivers.clearLayers();

    MS_RIVERS_GEO.forEach(river => {
      const polyline = L.polyline(river.coordinates, {
        color: "#ffffff",
        weight: 3,
        opacity: 0.75,
        smoothFactor: 1
      });

      polyline.bindPopup(`
        <div class="map-popup">
          <h4>${river.name}</h4>
          <p><strong>Bacia:</strong> ${river.basin}</p>
          <p><strong>Extensão:</strong> ${river.lengthKm}</p>
          <p>${river.description}</p>
        </div>
      `);

      this.layers.rivers.addLayer(polyline);
    });
  }

  renderZones() {
    this.layers.zones.clearLayers();

    FISHING_ZONES.forEach(zone => {
      if (this.activeFilter !== "all" && this.activeFilter !== zone.category) {
        return;
      }

      let color = "#ffffff";
      let fillColor = "#ffffff";
      let dashArray = null;

      if (zone.category === "prohibited") {
        color = "#ffffff";
        fillColor = "#888888";
        dashArray = "4, 4";
      } else if (zone.category === "restricted") {
        color = "#cccccc";
        fillColor = "#555555";
        dashArray = "8, 4";
      }

      let shape;
      if (zone.coordinates) {
        shape = L.polygon(zone.coordinates, {
          color,
          weight: 1.5,
          fillColor,
          fillOpacity: 0.2,
          dashArray
        });
      } else if (zone.center && zone.radiusKm) {
        shape = L.circle(zone.center, {
          radius: zone.radiusKm * 1000,
          color,
          weight: 1.5,
          fillColor,
          fillOpacity: 0.2,
          dashArray
        });
      }

      if (shape) {
        shape.bindPopup(`
          <div class="map-popup">
            <h4>${zone.name}</h4>
            <p><strong>Tipo:</strong> ${zone.type.replace(/^[^\s]+\s/, '')}</p>
            <p>${zone.description}</p>
            ${zone.legalBasis ? `<small><strong>Base Legal:</strong> ${zone.legalBasis}</small>` : ""}
          </div>
        `);
        this.layers.zones.addLayer(shape);
      }
    });
  }

  renderPOIs() {
    this.layers.pois.clearLayers();

    POINTS_OF_INTEREST.forEach(poi => {
      if (this.activeFilter !== "all") {
        if (this.activeFilter === "prohibited" || this.activeFilter === "permitted" || this.activeFilter === "restricted") {
          return;
        }
        if (this.activeFilter === "danger" && poi.category !== "danger") return;
        if (this.activeFilter === "access" && poi.category !== "access" && poi.category !== "camping") return;
        if (this.activeFilter === "safety" && poi.category !== "hospital" && poi.category !== "police") return;
        if (this.activeFilter === "fish_spot" && poi.category !== "fish_spot") return;
      }

      const svgIcon = this.getPOISvgIcon(poi.category);
      const customIcon = L.divIcon({
        className: "custom-map-icon",
        html: `<div class="marker-pin-svg ${poi.category}">${svgIcon}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -30]
      });

      const marker = L.marker([poi.lat, poi.lng], { icon: customIcon });

      marker.bindPopup(`
        <div class="map-popup">
          <h4>${poi.name}</h4>
          <p><strong>Categoria:</strong> ${poi.type.replace(/^[^\s]+\s/, '')}</p>
          <p>${poi.description}</p>
          ${poi.phone ? `<p><strong>Contato:</strong> <a href="tel:${poi.phone.replace(/[^0-9]/g, '')}">${poi.phone}</a></p>` : ""}
          ${poi.address ? `<p><strong>Endereço:</strong> ${poi.address}</p>` : ""}
          ${poi.species ? `<p><strong>Espécies Frequentes:</strong> ${poi.species.join(", ")}</p>` : ""}
          <div class="popup-coords">GPS: ${poi.lat.toFixed(5)}, ${poi.lng.toFixed(5)}</div>
        </div>
      `);

      this.layers.pois.addLayer(marker);
    });
  }

  async renderUserWaypoints() {
    this.layers.userWaypoints.clearLayers();
    const waypoints = await getAllWaypoints();

    waypoints.forEach(wp => {
      const isCamp = wp.type === "camp";
      const svgIcon = isCamp ? getIcon("camp", 16) : getIcon("location", 16);

      const icon = L.divIcon({
        className: "custom-map-icon",
        html: `<div class="marker-pin-svg ${isCamp ? 'camp-start' : 'user-wp'}">${svgIcon}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -32]
      });

      const marker = L.marker([wp.lat, wp.lng], { icon });
      marker.bindPopup(`
        <div class="map-popup">
          <h4>${wp.name}</h4>
          <p><strong>Tipo:</strong> ${isCamp ? 'Ponto de Partida (Base)' : 'Ponto Marcado'}</p>
          <p><small>${new Date(wp.createdAt).toLocaleString('pt-BR')}</small></p>
          <div class="popup-coords">GPS: ${wp.lat.toFixed(5)}, ${wp.lng.toFixed(5)}</div>
          <button class="btn btn-sm btn-outline mt-2" onclick="window.pescaApp.deleteUserWaypoint('${wp.id}')">Excluir Ponto</button>
        </div>
      `);

      this.layers.userWaypoints.addLayer(marker);
    });
  }

  getPOISvgIcon(category) {
    switch (category) {
      case "danger": return getIcon("danger", 16);
      case "police": return getIcon("shield", 16);
      case "hospital": return getIcon("cross", 16);
      case "access": return getIcon("anchor", 16);
      case "camping": return getIcon("camp", 16);
      case "fish_spot": return getIcon("fish", 16);
      default: return getIcon("location", 16);
    }
  }

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

      if (!this.userMarker) {
        const userIcon = L.divIcon({
          className: "user-gps-marker",
          html: `<div class="gps-pulse"></div><div class="gps-dot">${getIcon("compass", 16)}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        this.userMarker = L.marker([latitude, longitude], { icon: userIcon, zIndexOffset: 1000 }).addTo(this.map);
      } else {
        this.userMarker.setLatLng([latitude, longitude]);
      }

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

  async setAsStartingPoint(name = "Meu Acampamento / Base") {
    if (!this.userLocation) {
      throw new Error("Localização GPS ainda não detectada. Aguarde o sinal de satélite.");
    }

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

  calculateReturnHeading(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceMeters = Math.round(R * c);

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
