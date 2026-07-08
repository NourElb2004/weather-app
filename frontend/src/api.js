const BASE = "/api";

async function handle(response) {
  if (!response.ok) {
    let message = "Something went wrong talking to the server. Please try again.";
    try {
      const body = await response.json();
      if (body.error) message = body.error;
    } catch (_) {
    }
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
}

async function request(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (err) {
    throw new Error("Could not reach the server. Check your connection and try again.");
  }
  return handle(response);
}

export function lookupWeather({ location, lat, lon, name }) {
  const params = new URLSearchParams();
  if (location) params.set("location", location);
  if (lat !== undefined && lon !== undefined) {
    params.set("lat", lat);
    params.set("lon", lon);
    if (name) params.set("name", name);
  }
  return request(`${BASE}/weather/lookup?${params.toString()}`);
}

export function suggestLocations(query, signal) {
  return request(`${BASE}/weather/suggest?q=${encodeURIComponent(query)}`, { signal });
}

export function listRecords() {
  return request(`${BASE}/records`);
}

export function createRecord(payload) {
  return request(`${BASE}/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateRecord(id, payload) {
  return request(`${BASE}/records/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteRecord(id) {
  return request(`${BASE}/records/${id}`, { method: "DELETE" });
}

export function exportUrl(format) {
  return `${BASE}/export?format=${format}`;
}
