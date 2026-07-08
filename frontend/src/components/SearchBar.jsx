import { useState } from "react";

export default function SearchBar({ onSearch, loading }) {
  const [value, setValue] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!value.trim()) return;
    onSearch({ location: value.trim() });
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      onSearch({ error: "Your browser doesn't support geolocation." });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => onSearch({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => onSearch({ error: "We couldn't get your location. Check your browser's location permission." })
    );
  }

  return (
    <form className="search-row" onSubmit={submit}>
      <input
        type="text"
        placeholder="Zip code, city, landmark, or 'lat, lon'..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Location"
      />
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Searching..." : "Get weather"}
      </button>
      <button type="button" className="btn btn-secondary" onClick={useMyLocation} disabled={loading}>
        Use my location
      </button>
    </form>
  );
}
