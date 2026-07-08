import { Router } from "express";
import { geocodeLocation, AppGeocodeError } from "../services/geocode.js";
import { getCurrentAndForecast, AppWeatherError } from "../services/weather.js";
import { searchLocationVideos } from "../services/youtube.js";

const router = Router();

// GET /api/weather/lookup?location=<anything>&lat=&lon=
// Resolves a location string (or raw lat/lon from browser geolocation) to
// coordinates, then returns current weather + 5-day forecast + bonus extras.
router.get("/lookup", async (req, res) => {
  try {
    const { location, lat, lon } = req.query;

    let coords;
    if (lat !== undefined && lon !== undefined) {
      coords = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        resolvedName: "Your current location",
      };
    } else {
      coords = await geocodeLocation(location);
    }

    const [weather, extras] = await Promise.all([
      getCurrentAndForecast(coords.latitude, coords.longitude),
      searchLocationVideos(coords.resolvedName).catch(() => ({ enabled: false, videos: [] })),
    ]);

    res.json({
      location: {
        input: location || "current location",
        resolvedName: coords.resolvedName,
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
      weather,
      youtube: extras,
      mapEmbedUrl: buildMapEmbedUrl(coords.latitude, coords.longitude),
    });
  } catch (err) {
    handleError(err, res);
  }
});

function buildMapEmbedUrl(lat, lon) {
  // Free OpenStreetMap embed - no API key required.
  const delta = 0.05;
  const bbox = `${lon - delta}%2C${lat - delta}%2C${lon + delta}%2C${lat + delta}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&marker=${lat}%2C${lon}`;
}

export function handleError(err, res) {
  if (err instanceof AppGeocodeError || err instanceof AppWeatherError) {
    return res.status(err.statusCode || 400).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "Something unexpected went wrong on the server." });
}

export default router;
