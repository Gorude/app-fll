/**
 * Módulo de Caderno de Capturas (Diário de Bordo do Pescador)
 * Permite registrar capturas com foto, espécies, tamanho, GPS e se foi solto.
 * Armazenamento 100% local e privado via IndexedDB.
 */

import { saveCatch, getAllCatches, deleteCatch } from "../db.js";
import { SPECIES_DATA } from "../data/species.js";

export async function addCatchEntry({ speciesId, lengthCm, weightKg, bait, released, photo, notes, lat, lng, locationName }) {
  const species = SPECIES_DATA.find(s => s.id === speciesId);
  const speciesName = species ? species.name : "Espécie Não Informada";

  const entry = {
    speciesId,
    speciesName,
    lengthCm: parseFloat(lengthCm) || null,
    weightKg: parseFloat(weightKg) || null,
    bait: bait || "",
    released: released === true,
    photo: photo || null,
    notes: notes || "",
    lat: lat || null,
    lng: lng || null,
    locationName: locationName || "Local de Pesca MS",
    date: new Date().toISOString()
  };

  return await saveCatch(entry);
}

export async function loadCatchDiary() {
  return await getAllCatches();
}

export async function removeCatchEntry(id) {
  return await deleteCatch(id);
}
