/**
 * Gerenciador de Banco de Dados Local (IndexedDB) para o PWA PescaMS
 * Permite armazenamento 100% offline de:
 * - Caderno de Capturas (fotos, medidas, espécies)
 * - Pontos do Pescador & Ponto de Partida (Acampamento)
 * - Cache de Previsão Meteorológica
 * - Preferências e Pacotes Baixados
 */

const DB_NAME = "PescaMS_OfflineDB";
const DB_VERSION = 1;

let dbPromise = null;

export function getDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Store: Diário de Capturas
      if (!db.objectStoreNames.contains("catches")) {
        const catchStore = db.createObjectStore("catches", { keyPath: "id" });
        catchStore.createIndex("date", "date", { unique: false });
        catchStore.createIndex("speciesId", "speciesId", { unique: false });
      }

      // Store: Pontos Marcados / Ponto de Partida
      if (!db.objectStoreNames.contains("waypoints")) {
        const wpStore = db.createObjectStore("waypoints", { keyPath: "id" });
        wpStore.createIndex("type", "type", { unique: false });
      }

      // Store: Cache do Clima
      if (!db.objectStoreNames.contains("weather_cache")) {
        db.createObjectStore("weather_cache", { keyPath: "cityId" });
      }

      // Store: Configurações Gerais e Status de Pacotes
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
      reject(event.target.error);
    };
  });

  return dbPromise;
}

// === CATCHES (DIÁRIO DE CAPTURAS) ===

export async function saveCatch(catchRecord) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("catches", "readwrite");
    const store = tx.objectStore("catches");
    const record = {
      id: catchRecord.id || "catch_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      speciesId: catchRecord.speciesId,
      speciesName: catchRecord.speciesName,
      lengthCm: parseFloat(catchRecord.lengthCm) || null,
      weightKg: parseFloat(catchRecord.weightKg) || null,
      date: catchRecord.date || new Date().toISOString(),
      lat: catchRecord.lat || null,
      lng: catchRecord.lng || null,
      locationName: catchRecord.locationName || "Local não informado",
      bait: catchRecord.bait || "",
      released: catchRecord.released !== false, // Default: solto
      photo: catchRecord.photo || null, // DataURL ou base64
      notes: catchRecord.notes || ""
    };
    const req = store.put(record);
    req.onsuccess = () => resolve(record);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllCatches() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("catches", "readonly");
    const store = tx.objectStore("catches");
    const req = store.getAll();
    req.onsuccess = () => {
      // Ordenar por data decrescente
      const results = (req.result || []).sort((a, b) => new Date(b.date) - new Date(a.date));
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteCatch(id) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("catches", "readwrite");
    const store = tx.objectStore("catches");
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

// === WAYPOINTS & PONTO DE PARTIDA ===

export async function saveWaypoint(waypoint) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("waypoints", "readwrite");
    const store = tx.objectStore("waypoints");
    const record = {
      id: waypoint.id || "wp_" + Date.now(),
      name: waypoint.name || "Ponto Marcado",
      type: waypoint.type || "custom", // 'camp', 'boat_ramp', 'spot', 'danger'
      lat: waypoint.lat,
      lng: waypoint.lng,
      createdAt: waypoint.createdAt || new Date().toISOString(),
      notes: waypoint.notes || ""
    };
    const req = store.put(record);
    req.onsuccess = () => resolve(record);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllWaypoints() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("waypoints", "readonly");
    const store = tx.objectStore("waypoints");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteWaypoint(id) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("waypoints", "readwrite");
    const store = tx.objectStore("waypoints");
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function getStartingPoint() {
  const waypoints = await getAllWaypoints();
  return waypoints.find(w => w.type === "camp") || null;
}

// === WEATHER CACHE ===

export async function saveWeatherCache(cityId, data) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("weather_cache", "readwrite");
    const store = tx.objectStore("weather_cache");
    const req = store.put({
      cityId,
      timestamp: Date.now(),
      data
    });
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function getWeatherCache(cityId) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("weather_cache", "readonly");
    const store = tx.objectStore("weather_cache");
    const req = store.get(cityId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

// === SETTINGS & CONFIGS ===

export async function setSetting(key, value) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("settings", "readwrite");
    const store = tx.objectStore("settings");
    const req = store.put({ key, value });
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function getSetting(key, defaultValue = null) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("settings", "readonly");
    const store = tx.objectStore("settings");
    const req = store.get(key);
    req.onsuccess = () => {
      if (req.result) resolve(req.result.value);
      else resolve(defaultValue);
    };
    req.onerror = () => reject(req.error);
  });
}
