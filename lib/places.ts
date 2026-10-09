// Known commercial areas with fixed coordinates. The Studio agent picks from this list by id,
// so map markers never depend on coordinates invented by the model.
export interface Place {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
}

export const BAKU_CENTER = { lat: 40.3893, lng: 49.8474 };

export const PLACES: Place[] = [
  { id: "nizami_street", name: "Nizami küçəsi (Tarqovı)", city: "Bakı", lat: 40.3725, lng: 49.837 },
  { id: "icherisheher", name: "İçərişəhər ətrafı", city: "Bakı", lat: 40.3663, lng: 49.8352 },
  { id: "bulvar", name: "Dənizkənarı bulvar", city: "Bakı", lat: 40.3593, lng: 49.8355 },
  { id: "28_may", name: "28 May ətrafı", city: "Bakı", lat: 40.3795, lng: 49.8486 },
  { id: "port_baku", name: "Port Baku / Ağ Şəhər", city: "Bakı", lat: 40.3745, lng: 49.8607 },
  { id: "xetai", name: "Xətai metrosu ətrafı", city: "Bakı", lat: 40.3832, lng: 49.872 },
  { id: "genclik", name: "Gənclik", city: "Bakı", lat: 40.4003, lng: 49.8514 },
  { id: "nerimanov", name: "Nərimanov metrosu ətrafı", city: "Bakı", lat: 40.4029, lng: 49.8707 },
  { id: "elmler", name: "Elmlər Akademiyası ətrafı", city: "Bakı", lat: 40.3752, lng: 49.8145 },
  { id: "yasamal", name: "Yasamal (İnşaatçılar)", city: "Bakı", lat: 40.3915, lng: 49.8027 },
  { id: "20_yanvar", name: "20 Yanvar ətrafı", city: "Bakı", lat: 40.4043, lng: 49.8081 },
  { id: "memar_ecemi", name: "Memar Əcəmi ətrafı", city: "Bakı", lat: 40.4117, lng: 49.8141 },
  { id: "koroglu", name: "Koroğlu metrosu ətrafı", city: "Bakı", lat: 40.4208, lng: 49.9179 },
  { id: "ehmedli", name: "Əhmədli", city: "Bakı", lat: 40.3852, lng: 49.954 },
  { id: "xirdalan", name: "Xırdalan", city: "Abşeron", lat: 40.4486, lng: 49.7553 },
  { id: "sumqayit", name: "Sumqayıt mərkəzi", city: "Sumqayıt", lat: 40.5897, lng: 49.6686 },
  { id: "gence", name: "Gəncə mərkəzi", city: "Gəncə", lat: 40.6828, lng: 46.3606 },
  { id: "mingecevir", name: "Mingəçevir mərkəzi", city: "Mingəçevir", lat: 40.7703, lng: 47.0496 },
  { id: "lenkeran", name: "Lənkəran mərkəzi", city: "Lənkəran", lat: 38.7543, lng: 48.8506 },
  { id: "sheki", name: "Şəki mərkəzi", city: "Şəki", lat: 41.1919, lng: 47.1706 },
  { id: "quba", name: "Quba mərkəzi", city: "Quba", lat: 41.3643, lng: 48.5126 },
  { id: "shirvan", name: "Şirvan mərkəzi", city: "Şirvan", lat: 39.9381, lng: 48.9206 },
  { id: "naxcivan", name: "Naxçıvan mərkəzi", city: "Naxçıvan", lat: 39.209, lng: 45.4122 },
];

const AZERBAIJAN_BOUNDS = { minLat: 38.3, maxLat: 41.95, minLng: 44.7, maxLng: 50.7 };

export function isInAzerbaijan(lat: number, lng: number) {
  return (
    lat >= AZERBAIJAN_BOUNDS.minLat &&
    lat <= AZERBAIJAN_BOUNDS.maxLat &&
    lng >= AZERBAIJAN_BOUNDS.minLng &&
    lng <= AZERBAIJAN_BOUNDS.maxLng
  );
}

// Resolves a model-suggested location to trustworthy coordinates.
export function resolveCoordinates(
  location: { place_id?: string | null; lat?: number | null; lng?: number | null },
  index: number,
  userCity: string | null,
) {
  const known = PLACES.find((place) => place.id === location.place_id);
  if (known) return { lat: known.lat, lng: known.lng };

  if (typeof location.lat === "number" && typeof location.lng === "number" && isInAzerbaijan(location.lat, location.lng)) {
    return { lat: location.lat, lng: location.lng };
  }

  // Last resort: the user's city centre (or Baku), nudged so three markers do not overlap.
  const cityCentre = PLACES.find((place) => userCity && userCity.includes(place.city) && place.city !== "Bakı");
  const base = cityCentre ?? BAKU_CENTER;
  return { lat: base.lat + index * 0.008, lng: base.lng + index * 0.01 };
}
