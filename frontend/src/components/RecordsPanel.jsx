import { Fragment, useEffect, useState } from "react";
import { listRecords, createRecord, updateRecord, deleteRecord } from "../api.js";

const emptyForm = { location: "", startDate: "", endDate: "", notes: "" };

export default function RecordsPanel() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    listRecords().then(setRecords).catch((e) => setError(e.message));
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    if (!form.location || !form.startDate || !form.endDate) {
      setError("Location, start date, and end date are all required.");
      return;
    }
    setBusy(true);
    try {
      if (editingId) {
        await updateRecord(editingId, form);
      } else {
        await createRecord(form);
      }
      setForm(emptyForm);
      setEditingId(null);
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function startEdit(record) {
    setEditingId(record.id);
    setForm({
      location: record.query_input,
      startDate: record.start_date,
      endDate: record.end_date,
      notes: record.notes,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function toggleExpand(id) {
    setExpandedId((current) => (current === id ? null : id));
  }

  async function remove(id) {
    if (!confirm("Delete this record?")) return;
    try {
      await deleteRecord(id);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="card">
        {editingId && <h3 style={{ marginBottom: 10, fontSize: "1rem" }}>Edit saved record</h3>}
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-grid">
            <div>
              <label>Location</label>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Alexandria, EG"
              />
            </div>
            <div>
              <label>Start date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <label>End date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
            <div>
              <label>Notes (optional)</label>
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Trip notes..."
              />
            </div>
          </div>
          <div className="row-actions">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Saving..." : editingId ? "Save changes" : "Save record"}
            </button>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 10, fontSize: "1rem" }}>Saved records ({records.length})</h3>
        {records.length === 0 && <p className="muted-note">No records yet — save one above.</p>}
        {records.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Range</th>
                  <th>Days</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <Fragment key={r.id}>
                    <tr>
                      <td>{r.resolved_name}</td>
                      <td>
                        {r.start_date} → {r.end_date}
                      </td>
                      <td>
                        <button className="btn-secondary" onClick={() => toggleExpand(r.id)}>
                          {expandedId === r.id ? "Hide" : "View"} ({r.daily_data.length})
                        </button>
                      </td>
                      <td>{r.notes || "—"}</td>
                      <td>
                        <div className="row-actions">
                          <button className="btn-secondary" onClick={() => startEdit(r)}>
                            Edit
                          </button>
                          <button className="btn-danger" onClick={() => remove(r.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === r.id && (
                      <tr key={`${r.id}-detail`}>
                        <td colSpan={5}>
                          <div className="forecast-grid">
                            {r.daily_data.map((d) => (
                              <div className="forecast-card" key={d.date}>
                                <div className="day-label">{d.date}</div>
                                <div className="icon">{d.icon}</div>
                                <div className="range">
                                  <span className="max">{Math.round(d.tempMax)}°</span>{" "}
                                  <span className="min">{Math.round(d.tempMin)}°</span>
                                </div>
                                <div className="muted-note" style={{ marginTop: 4 }}>
                                  {d.description} · {d.precipitation}mm
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
