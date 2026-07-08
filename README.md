# Weatherly — Weather App
**Built by:** Nour Mohamed Elbarawi

## What it does

- Search weather by zip/postal code, city, town, landmark, or raw GPS coordinates
- "Use my location" via the browser's geolocation
- Current conditions + 5-day forecast
- CRUD: save a location + date range, read/list saved records, edit them, delete them
  (backed by SQLite; date ranges and locations are validated before saving)
- Export all saved records as JSON, CSV, XML, Markdown, or PDF
- Bonus API integrations: an embedded map (OpenStreetMap, no key needed) and optional
  YouTube videos about the searched location (needs a free YouTube Data API key)

## Tech stack

- **Frontend:** React + Vite (no CSS framework — hand-written CSS design system)
- **Backend:** Node.js + Express
- **Database:** SQLite (via `better-sqlite3`) — a single file, no server setup needed
- **Weather/geocoding data:** [Open-Meteo](https://open-meteo.com) for weather,
  [OpenStreetMap Nominatim](https://nominatim.org) for exact location lookup, and
  [Photon](https://photon.komoot.io) for the search bar's autocomplete — all free,
  **no API key required**, so you can run this immediately without waiting on any key approval.

## Requirements

- **Node.js 18+** and **npm** (that's the only thing you need installed globally —
  everything else below is pulled in automatically by `npm install`)

Packages installed via `npm install` in each folder (from each `package.json`,
Node's equivalent of a `requirements.txt`):

**Backend** (`backend/package.json`)
| Package | Purpose |
|---|---|
| `express` | HTTP server / routing |
| `better-sqlite3` | SQLite database driver |
| `cors` | Allow the frontend (different port) to call the API |
| `dotenv` | Loads `.env` config (port, optional API keys) |
| `json2csv` | CSV export |
| `pdfkit` | PDF export |

**Frontend** (`frontend/package.json`)
| Package | Purpose |
|---|---|
| `react`, `react-dom` | UI framework |
| `vite` | Dev server / build tool |
| `@vitejs/plugin-react` | React support for Vite |

No manual install of any of these is needed — `npm install` in `backend/` and
`npm install` in `frontend/` (see below) installs everything in the tables above.

## Running it locally

You need two terminals — one for the backend, one for the frontend.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm start
```

This starts the API server at `http://localhost:5050`. The SQLite database file is created
automatically at `backend/data/weather.db` the first time it runs.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

This starts the app at `http://localhost:5173`. Open that URL in your browser — the frontend
automatically proxies API requests to the backend (see `vite.config.js`).

### Optional: YouTube bonus feature

Get a free key at https://console.cloud.google.com/apis/library/youtube.googleapis.com,
then put it in `backend/.env`:

```
YOUTUBE_API_KEY=your_key_here
```

Restart the backend after adding it. Without a key, the app just skips this section gracefully.

## Project structure

```
weather-app/
  backend/
    server.js          # Express app entry point
    db.js               # SQLite schema/setup
    services/
      geocode.js         # location string -> lat/lon (Nominatim) + autocomplete (Photon)
      weather.js          # current/forecast/date-range weather (Open-Meteo)
      youtube.js           # optional bonus videos
    routes/
      weather.js          # GET /api/weather/lookup
      records.js          # CRUD  /api/records
      export.js            # GET /api/export?format=...
  frontend/
    src/
      App.jsx             # main layout / tabs
      api.js               # fetch wrapper for the backend
      components/          # Logo, SearchBar, CurrentWeather, Forecast, Extras,
                             # RecordsPanel, ExportPanel, Footer
```

## API endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/weather/lookup?location=` or `?lat=&lon=` | Current + 5-day forecast |
| GET | `/api/weather/suggest?q=` | Autocomplete suggestions for the search bar |
| GET | `/api/records` | List all saved records |
| GET | `/api/records/:id` | Get one record |
| POST | `/api/records` | Create (body: `location`, `startDate`, `endDate`, `notes`) |
| PUT | `/api/records/:id` | Update a record |
| DELETE | `/api/records/:id` | Delete a record |
| GET | `/api/export?format=json\|csv\|xml\|markdown\|pdf` | Export all records |

## About PM Accelerator

The Product Manager Accelerator Program is designed to support PM professionals through
every stage of their careers. From students looking for entry-level jobs to Directors
looking to take on a leadership role, the program has helped over hundreds of students
fulfill their career aspirations. More at
[their LinkedIn page](https://www.linkedin.com/school/pmaccelerator/about/?viewAsMember=true).
