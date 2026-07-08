export default function Extras({ mapEmbedUrl, youtube }) {
  return (
    <div className="extras-grid">
      <div className="card">
        <h3 style={{ fontSize: "0.95rem", marginBottom: 10, color: "var(--text-muted)" }}>MAP</h3>
        <iframe className="map-embed" src={mapEmbedUrl} title="Location map" loading="lazy" />
      </div>
      <div className="card">
        <h3 style={{ fontSize: "0.95rem", marginBottom: 10, color: "var(--text-muted)" }}>VIDEOS ABOUT THIS PLACE</h3>
        {!youtube.enabled && (
          <p className="muted-note">
            Add a YOUTUBE_API_KEY in the backend .env to enable this bonus feature.
          </p>
        )}
        {youtube.enabled && youtube.videos.length === 0 && (
          <p className="muted-note">No videos found.</p>
        )}
        <div className="video-list">
          {youtube.videos.map((v) => (
            <a
              key={v.videoId}
              className="video-item"
              href={`https://www.youtube.com/watch?v=${v.videoId}`}
              target="_blank"
              rel="noreferrer"
            >
              {v.thumbnail && <img src={v.thumbnail} alt="" />}
              <span>{v.title}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
