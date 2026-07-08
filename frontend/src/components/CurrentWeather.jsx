export default function CurrentWeather({ location, current }) {
  return (
    <div className="card">
      <h2 style={{ fontSize: "1.1rem", marginBottom: 10 }}>{location.resolvedName}</h2>
      <div className="current-weather">
        <div className="icon">{current.icon}</div>
        <div>
          <div className="temp">{Math.round(current.temperature)}°C</div>
          <div className="muted-note">{current.description}</div>
        </div>
        <div className="stat-strip">
          <div>Feels like <strong>{Math.round(current.feelsLike)}°C</strong></div>
          <div>Humidity <strong>{current.humidity}%</strong></div>
          <div>Wind <strong>{current.windSpeed} km/h</strong></div>
        </div>
      </div>
    </div>
  );
}
