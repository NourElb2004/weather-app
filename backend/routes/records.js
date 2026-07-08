import { Router } from "express";
import db from "../db.js";
import { geocodeLocation, AppGeocodeError } from "../services/geocode.js";
import { getDailyRange, AppWeatherError } from "../services/weather.js";
import { handleError } from "./weather.js";

const router = Router();
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function validateDateRange(startDate, endDate) {
  if (!DATE_REGEX.test(startDate) || !DATE_REGEX.test(endDate)) {
    return "Dates must be in YYYY-MM-DD format.";
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start) || isNaN(end)) {
    return "One of the dates is not a valid calendar date.";
  }
  if (start > end) {
    return "Start date must be on or before end date.";
  }
  const spanDays = (end - start) / (1000 * 60 * 60 * 24);
  if (spanDays > 366) {
    return "Please keep date ranges to 366 days or fewer.";
  }
  return null;
}

// CREATE
router.post("/", async (req, res) => {
  try {
    const { location, startDate, endDate, notes } = req.body;

    if (!location || !location.trim()) {
      return res.status(400).json({ error: "Location is required." });
    }
    const dateError = validateDateRange(startDate, endDate);
    if (dateError) {
      return res.status(400).json({ error: dateError });
    }

    // Validates the location really exists (geocoding throws a friendly
    // 404-style error if it can't find/fuzzy-match anything).
    const coords = await geocodeLocation(location);
    const dailyData = await getDailyRange(coords.latitude, coords.longitude, startDate, endDate);

    const stmt = db.prepare(`
      INSERT INTO weather_records
        (query_input, resolved_name, latitude, longitude, start_date, end_date, daily_data, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      location,
      coords.resolvedName,
      coords.latitude,
      coords.longitude,
      startDate,
      endDate,
      JSON.stringify(dailyData),
      notes || ""
    );

    const record = db.prepare("SELECT * FROM weather_records WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json(deserialize(record));
  } catch (err) {
    handleError(err, res);
  }
});

// READ (all)
router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM weather_records ORDER BY created_at DESC").all();
  res.json(rows.map(deserialize));
});

// READ (one)
router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM weather_records WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Record not found." });
  res.json(deserialize(row));
});

// UPDATE
router.put("/:id", async (req, res) => {
  try {
    const existing = db.prepare("SELECT * FROM weather_records WHERE id = ?").get(req.params.id);
    if (!existing) return res.status(404).json({ error: "Record not found." });

    const location = req.body.location ?? existing.query_input;
    const startDate = req.body.startDate ?? existing.start_date;
    const endDate = req.body.endDate ?? existing.end_date;
    const notes = req.body.notes ?? existing.notes;

    const dateError = validateDateRange(startDate, endDate);
    if (dateError) return res.status(400).json({ error: dateError });

    let coords = { latitude: existing.latitude, longitude: existing.longitude, resolvedName: existing.resolved_name };
    let dailyData = JSON.parse(existing.daily_data);

    // Only re-fetch weather if location or dates actually changed, so a
    // notes-only edit doesn't burn an extra API call.
    const locationChanged = location !== existing.query_input;
    const datesChanged = startDate !== existing.start_date || endDate !== existing.end_date;
    if (locationChanged || datesChanged) {
      coords = await geocodeLocation(location);
      dailyData = await getDailyRange(coords.latitude, coords.longitude, startDate, endDate);
    }

    db.prepare(`
      UPDATE weather_records
      SET query_input = ?, resolved_name = ?, latitude = ?, longitude = ?,
          start_date = ?, end_date = ?, daily_data = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      location,
      coords.resolvedName,
      coords.latitude,
      coords.longitude,
      startDate,
      endDate,
      JSON.stringify(dailyData),
      notes,
      req.params.id
    );

    const updated = db.prepare("SELECT * FROM weather_records WHERE id = ?").get(req.params.id);
    res.json(deserialize(updated));
  } catch (err) {
    handleError(err, res);
  }
});

// DELETE
router.delete("/:id", (req, res) => {
  const info = db.prepare("DELETE FROM weather_records WHERE id = ?").run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "Record not found." });
  res.status(204).send();
});

function deserialize(row) {
  return { ...row, daily_data: JSON.parse(row.daily_data) };
}

export default router;
