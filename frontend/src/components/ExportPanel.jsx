import { exportUrl } from "../api.js";

const FORMATS = [
  { key: "json", label: "JSON" },
  { key: "csv", label: "CSV" },
  { key: "xml", label: "XML" },
  { key: "markdown", label: "Markdown" },
  { key: "pdf", label: "PDF" },
];

export default function ExportPanel() {
  return (
    <div className="card">
      <h3 style={{ marginBottom: 10, fontSize: "1rem" }}>Export saved records</h3>
      <p className="muted-note" style={{ marginBottom: 10 }}>
        Downloads every saved record in the format you pick.
      </p>
      <div className="export-row">
        {FORMATS.map((f) => (
          <a key={f.key} className="btn btn-amber" href={exportUrl(f.key)}>
            Download {f.label}
          </a>
        ))}
      </div>
    </div>
  );
}
