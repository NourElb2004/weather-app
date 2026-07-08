import "dotenv/config";
import express from "express";
import cors from "cors";
import weatherRoutes from "./routes/weather.js";
import recordsRoutes from "./routes/records.js";
import exportRoutes from "./routes/export.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/weather", weatherRoutes);
app.use("/api/records", recordsRoutes);
app.use("/api/export", exportRoutes);

// Catch-all error handler for anything that slips past route-level try/catch.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Unexpected server error." });
});

app.listen(PORT, () => {
  console.log(`Weather app backend running on http://localhost:${PORT}`);
});
