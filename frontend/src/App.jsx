import { useState } from "react";
import Logo from "./components/Logo.jsx";
import SearchBar from "./components/SearchBar.jsx";
import CurrentWeather from "./components/CurrentWeather.jsx";
import Forecast from "./components/Forecast.jsx";
import Extras from "./components/Extras.jsx";
import RecordsPanel from "./components/RecordsPanel.jsx";
import ExportPanel from "./components/ExportPanel.jsx";
import Footer from "./components/Footer.jsx";
import { lookupWeather } from "./api.js";

export default function App() {
  const [tab, setTab] = useState("search");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleModeChange() {
    setResult(null);
    setError(null);
  }

  async function handleSearch({ location, lat, lon, name, error: geoError }) {
    if (geoError) {
      setError(geoError);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await lookupWeather({ location, lat, lon, name });
      setResult(data);
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="horizon-arc" />
        <div className="brand-row">
          <Logo size={48} />
          <div>
            <h1>Weatherly</h1>
            <p>Check the weather anywhere, save it, and export it.</p>
          </div>
        </div>
      </header>

      <nav className="tabs">
        <button className={`tab-btn ${tab === "search" ? "active" : ""}`} onClick={() => setTab("search")}>
          Search weather
        </button>
        <button className={`tab-btn ${tab === "records" ? "active" : ""}`} onClick={() => setTab("records")}>
          Saved records &amp; export
        </button>
      </nav>

      {tab === "search" && (
        <>
          <div className="card">
            <SearchBar onSearch={handleSearch} onModeChange={handleModeChange} loading={loading} />
          </div>

          {error && <div className="error-banner">{error}</div>}

          {result && (
            <>
              <CurrentWeather location={result.location} current={result.weather.current} />
              <Forecast days={result.weather.forecast} />
              <Extras mapEmbedUrl={result.mapEmbedUrl} youtube={result.youtube} />
            </>
          )}
        </>
      )}

      {tab === "records" && (
        <>
          <RecordsPanel />
          <ExportPanel />
        </>
      )}

      <Footer />
    </div>
  );
}
