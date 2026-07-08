import { Router } from "express";
import { Parser as CsvParser } from "json2csv";
import PDFDocument from "pdfkit";
import db from "../db.js";

const router = Router();

function getRecords() {
  return db.prepare("SELECT * FROM weather_records ORDER BY created_at DESC").all()
    .map((row) => ({ ...row, daily_data: JSON.parse(row.daily_data) }));
}

router.get("/", async (req, res) => {
  const format = (req.query.format || "json").toLowerCase();
  const records = getRecords();

  switch (format) {
    case "json":
      return sendFile(res, "weather-records.json", "application/json", JSON.stringify(records, null, 2));

    case "csv":
      return exportCsv(records, res);

    case "xml":
      return sendFile(res, "weather-records.xml", "application/xml", toXml(records));

    case "markdown":
    case "md":
      return sendFile(res, "weather-records.md", "text/markdown", toMarkdown(records));

    case "pdf":
      return exportPdf(records, res);

    default:
      return res.status(400).json({ error: "Unsupported format. Use json, csv, xml, markdown, or pdf." });
  }
});

function sendFile(res, filename, contentType, body) {
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Type", contentType);
  res.send(body);
}

function exportCsv(records, res) {
  const flatRows = records.flatMap((r) =>
    r.daily_data.map((d) => ({
      id: r.id,
      query_input: r.query_input,
      resolved_name: r.resolved_name,
      latitude: r.latitude,
      longitude: r.longitude,
      date: d.date,
      temp_max: d.tempMax,
      temp_min: d.tempMin,
      precipitation: d.precipitation,
      condition: d.description,
      notes: r.notes,
    }))
  );
  const parser = new CsvParser();
  const csv = flatRows.length ? parser.parse(flatRows) : "id,query_input,resolved_name,latitude,longitude,date,temp_max,temp_min,precipitation,condition,notes\n";
  sendFile(res, "weather-records.csv", "text/csv", csv);
}

function toXml(records) {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const rows = records
    .map(
      (r) => `
  <record id="${r.id}">
    <queryInput>${esc(r.query_input)}</queryInput>
    <resolvedName>${esc(r.resolved_name)}</resolvedName>
    <latitude>${r.latitude}</latitude>
    <longitude>${r.longitude}</longitude>
    <startDate>${r.start_date}</startDate>
    <endDate>${r.end_date}</endDate>
    <notes>${esc(r.notes)}</notes>
    <dailyData>
      ${r.daily_data
        .map(
          (d) => `<day date="${d.date}" tempMax="${d.tempMax}" tempMin="${d.tempMin}" precipitation="${d.precipitation}" condition="${esc(d.description)}"/>`
        )
        .join("\n      ")}
    </dailyData>
  </record>`
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<weatherRecords>${rows}\n</weatherRecords>`;
}

function toMarkdown(records) {
  let md = `# Weather Records Export\n\nGenerated: ${new Date().toISOString()}\n\n`;
  if (records.length === 0) md += "_No records saved yet._\n";
  for (const r of records) {
    md += `## ${r.resolved_name}\n\n`;
    md += `- **Searched as:** ${r.query_input}\n`;
    md += `- **Coordinates:** ${r.latitude}, ${r.longitude}\n`;
    md += `- **Date range:** ${r.start_date} to ${r.end_date}\n`;
    if (r.notes) md += `- **Notes:** ${r.notes}\n`;
    md += `\n| Date | High | Low | Precipitation | Condition |\n|---|---|---|---|---|\n`;
    for (const d of r.daily_data) {
      md += `| ${d.date} | ${d.tempMax}°C | ${d.tempMin}°C | ${d.precipitation}mm | ${d.description} |\n`;
    }
    md += `\n`;
  }
  return md;
}

function exportPdf(records, res) {
  res.setHeader("Content-Disposition", `attachment; filename="weather-records.pdf"`);
  res.setHeader("Content-Type", "application/pdf");

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);

  doc.fontSize(18).text("Weather Records Export", { align: "center" });
  doc.moveDown();
  doc.fontSize(10).fillColor("gray").text(`Generated: ${new Date().toISOString()}`, { align: "center" });
  doc.moveDown(1.5);
  doc.fillColor("black");

  if (records.length === 0) {
    doc.fontSize(12).text("No records saved yet.");
  }

  for (const r of records) {
    doc.fontSize(14).text(r.resolved_name, { underline: true });
    doc.fontSize(10).text(`Searched as: ${r.query_input}`);
    doc.text(`Coordinates: ${r.latitude}, ${r.longitude}`);
    doc.text(`Date range: ${r.start_date} to ${r.end_date}`);
    if (r.notes) doc.text(`Notes: ${r.notes}`);
    doc.moveDown(0.5);

    for (const d of r.daily_data) {
      doc.text(`${d.date}: High ${d.tempMax}°C / Low ${d.tempMin}°C, ${d.precipitation}mm precip, ${d.description}`);
    }
    doc.moveDown();
  }

  doc.end();
}

export default router;
