export default function Forecast({ days }) {
  return (
    <div className="card">
      <h3 style={{ fontSize: "0.95rem", marginBottom: 12, color: "var(--text-muted)" }}>5-DAY FORECAST</h3>
      <div className="forecast-grid">
        {days.map((d) => (
          <div className="forecast-card" key={d.date}>
            <div className="day-label">
              {new Date(d.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" })}
            </div>
            <div className="icon">{d.icon}</div>
            <div className="range">
              <span className="max">{Math.round(d.tempMax)}°</span>{" "}
              <span className="min">{Math.round(d.tempMin)}°</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
