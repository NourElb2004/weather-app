import { useEffect, useRef, useState } from "react";
import { suggestLocations } from "../api.js";

const MODES = [
  { key: "city", label: "City / Town", placeholder: "e.g. Cairo, Alexandria" },
  { key: "zip", label: "Zip / Postal Code", placeholder: "e.g. 90210 or SW1A 1AA" },
  { key: "landmark", label: "Landmark", placeholder: "e.g. Eiffel Tower, Great Pyramid of Giza" },
  { key: "coords", label: "GPS Coordinates" },
];

const SUGGEST_DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 3;

export default function SearchBar({ onSearch, onModeChange, loading }) {
  const [mode, setMode] = useState("city");
  const [value, setValue] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [formError, setFormError] = useState(null);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const suppressNextFetch = useRef(false);

  useEffect(() => {
    if (mode === "coords") {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    if (suppressNextFetch.current) {
      suppressNextFetch.current = false;
      return;
    }
    const query = value.trim();
    if (query.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      suggestLocations(query, controller.signal)
        .then((data) => {
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
          setActiveIndex(-1);
        })
        .catch(() => {
        });
    }, SUGGEST_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, mode]);

  function selectMode(key) {
    setMode(key);
    setFormError(null);
    setValue("");
    setLat("");
    setLon("");
    setSelectedCoords(null);
    setSuggestions([]);
    setShowSuggestions(false);
    onModeChange?.();
  }

  function handleValueChange(e) {
    const next = e.target.value;
    setValue(next);
    if (selectedCoords && next !== selectedCoords.label) {
      setSelectedCoords(null);
    }
  }

  function selectSuggestion(s) {
    suppressNextFetch.current = true;
    setValue(s.label);
    setSelectedCoords({ lat: s.latitude, lon: s.longitude, label: s.label });
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
  }

  function onInputKeyDown(e) {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  function onInputBlur() {
    window.setTimeout(() => setShowSuggestions(false), 120);
  }

  function onInputFocus() {
    if (suggestions.length > 0) setShowSuggestions(true);
  }

  function submit(e) {
    e.preventDefault();
    setFormError(null);

    if (mode === "coords") {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);
      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        setFormError("Enter both a latitude and a longitude.");
        return;
      }
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        setFormError("Latitude must be -90 to 90 and longitude -180 to 180.");
        return;
      }
      onSearch({ lat: latitude, lon: longitude });
      return;
    }

    const trimmed = value.trim();
    if (!trimmed) return;

    if (selectedCoords && selectedCoords.label === trimmed) {
      onSearch({ lat: selectedCoords.lat, lon: selectedCoords.lon, name: selectedCoords.label });
    } else {
      onSearch({ location: trimmed });
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      onSearch({ error: "Your browser doesn't support geolocation." });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMode("coords");
        setLat(String(pos.coords.latitude));
        setLon(String(pos.coords.longitude));
        onSearch({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => onSearch({ error: "We couldn't get your location. Check your browser's location permission." })
    );
  }

  return (
    <div>
      <div className="mode-tabs" role="tablist" aria-label="How to enter a location">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={mode === m.key}
            className={`mode-tab-btn ${mode === m.key ? "active" : ""}`}
            onClick={() => selectMode(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <form className="search-row" onSubmit={submit}>
        {mode === "coords" ? (
          <>
            <input
              type="number"
              step="any"
              placeholder="Latitude (-90 to 90)"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              aria-label="Latitude"
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude (-180 to 180)"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              aria-label="Longitude"
            />
          </>
        ) : (
          <div className="location-input-wrap">
            <input
              type="text"
              placeholder={MODES.find((m) => m.key === mode).placeholder}
              value={value}
              onChange={handleValueChange}
              onKeyDown={onInputKeyDown}
              onBlur={onInputBlur}
              onFocus={onInputFocus}
              aria-label="Location"
              role="combobox"
              aria-expanded={showSuggestions && suggestions.length > 0}
              aria-autocomplete="list"
              aria-controls="location-suggestions"
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="suggestions-dropdown" id="location-suggestions" role="listbox">
                {suggestions.map((s, i) => (
                  <li
                    key={`${s.latitude},${s.longitude}`}
                    role="option"
                    aria-selected={i === activeIndex}
                    className={`suggestion-item ${i === activeIndex ? "active" : ""}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectSuggestion(s)}
                  >
                    {s.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Searching..." : "Get weather"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={useMyLocation} disabled={loading}>
          Use my location
        </button>
      </form>
      {formError && <div className="error-banner">{formError}</div>}
    </div>
  );
}
