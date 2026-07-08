const BASE = "/api";

async function handle(response) {
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body.error) message = body.error;
    } catch (_) {
      /* response had no JSON body */
    }
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
}

export function lookupWeather({ location, lat, lon }) {
  const params = new URLSearchParams();
  if (location) params.set("location", location);
  if (lat !== undefined && lon !== undefined) {
    params.set("lat", lat);
    params.set("lon", lon);
  }
  return fetch(`${BASE}/weather/lookup?${params.toString()}`).then(handle);
}

export function listRecords() {
  return fetch(`${BASE}/records`).then(handle);
}

export function createRecord(payload) {
  return fetch(`${BASE}/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(handle);
}

export function updateRecord(id, payload) {
  return fetch(`${BASE}/records/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(handle);
}

export function deleteRecord(id) {
  return fetch(`${BASE}/records/${id}`, { method: "DELETE" }).then(handle);
}

export function exportUrl(format) {
  return `${BASE}/export?format=${format}`;
}
