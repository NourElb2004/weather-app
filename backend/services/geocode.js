const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const PHOTON_URL = "https://photon.komoot.io/api/";
const COORD_REGEX = /^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/;

const NOMINATIM_HEADERS = { "User-Agent": "PMA-WeatherApp-TechAssessment/1.0 (educational project)" };

function photonLabel(props) {
  const primary = props.name || props.street || props.osm_value;
  const bits = [primary];
  if (props.city && props.city !== primary) bits.push(props.city);
  if (props.state && props.state !== primary) bits.push(props.state);
  if (props.country) bits.push(props.country);
  return bits.filter(Boolean).join(", ");
}

export async function geocodeLocation(rawInput) {
  const input = (rawInput || "").trim();
  if (!input) {
    throw new AppGeocodeError("Please enter a location.");
  }

  const coordMatch = input.match(COORD_REGEX);
  if (coordMatch) {
    const latitude = parseFloat(coordMatch[1]);
    const longitude = parseFloat(coordMatch[3]);
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new AppGeocodeError("Those coordinates are out of range.");
    }
    return {
      latitude,
      longitude,
      resolvedName: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    };
  }

  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(input)}&format=json&limit=1&addressdetails=1`;

  let response;
  try {
    response = await fetch(url, { headers: NOMINATIM_HEADERS });
  } catch (err) {
    throw new AppGeocodeError("Could not reach the geocoding service. Check your internet connection.");
  }

  if (!response.ok) {
    throw new AppGeocodeError("The geocoding service returned an error. Please try again.");
  }

  const results = await response.json();
  if (!results || results.length === 0) {
    throw new AppGeocodeError(`We couldn't find a location matching "${input}". Try a different spelling or a nearby city.`);
  }

  const best = results[0];
  return {
    latitude: parseFloat(best.lat),
    longitude: parseFloat(best.lon),
    resolvedName: best.display_name,
  };
}

export async function suggestLocations(rawInput) {
  const input = (rawInput || "").trim();
  if (input.length < 3 || COORD_REGEX.test(input)) {
    return [];
  }

  const url = `${PHOTON_URL}?q=${encodeURIComponent(input)}&limit=5`;

  let response;
  try {
    response = await fetch(url);
  } catch (err) {
    return [];
  }
  if (!response.ok) return [];

  const data = await response.json();
  const seen = new Set();
  const suggestions = [];
  for (const feature of data.features || []) {
    const [longitude, latitude] = feature.geometry.coordinates;
    const label = photonLabel(feature.properties);
    if (!label || seen.has(label)) continue;
    seen.add(label);
    suggestions.push({ label, latitude, longitude });
  }
  return suggestions;
}

export class AppGeocodeError extends Error {
  constructor(message) {
    super(message);
    this.name = "AppGeocodeError";
    this.statusCode = 404;
  }
}
