// Turns whatever the user typed - zip code, city, landmark, "lat,lon" - into
// coordinates + a human-readable name. Uses OpenStreetMap's free Nominatim
// service, so no API key / signup is required to run this project.

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const COORD_REGEX = /^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/;

export async function geocodeLocation(rawInput) {
  const input = (rawInput || "").trim();
  if (!input) {
    throw new AppGeocodeError("Please enter a location.");
  }

  // 1. GPS coordinates entered directly, e.g. "31.2, 29.9"
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

  // 2. Everything else (zip/postal code, city, town, landmark) goes through
  //    Nominatim's free-form search, which handles all of these reasonably well.
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(input)}&format=json&limit=1&addressdetails=1`;

  let response;
  try {
    response = await fetch(url, {
      headers: {
        // Nominatim's usage policy requires a descriptive User-Agent.
        "User-Agent": "PMA-WeatherApp-TechAssessment/1.0 (educational project)",
      },
    });
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

export class AppGeocodeError extends Error {
  constructor(message) {
    super(message);
    this.name = "AppGeocodeError";
    this.statusCode = 404;
  }
}
