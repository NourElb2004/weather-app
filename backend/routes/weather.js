import { Router } from "express";
import { geocodeLocation, suggestLocations, AppGeocodeError } from "../services/geocode.js";
import { getCurrentAndForecast, AppWeatherError } from "../services/weather.js";
import { searchLocationVideos } from "../services/youtube.js";

const router = Router();

router.get("/suggest", async (req, res) => {
  const suggestions = await suggestLocations(req.query.q);
  res.json({ suggestions });
});

router.get("/lookup", async (req, res) => {
  try {
    const { location, lat, lon, name } = req.query;

    let coords;
    if (lat !== undefined && lon !== undefined) {
      coords = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        resolvedName: (name && name.trim()) || "Your current location",
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
