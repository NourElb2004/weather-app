const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";

export class AppWeatherError extends Error {
  constructor(message, statusCode = 502) {
    super(message);
    this.name = "AppWeatherError";
    this.statusCode = statusCode;
  }
}

function describeWeatherCode(code) {
  const map = {
    0: ["Clear sky", "☀️"],
    1: ["Mainly clear", "🌤️"],
    2: ["Partly cloudy", "⛅"],
    3: ["Overcast", "☁️"],
    45: ["Fog", "🌫️"],
    48: ["Depositing rime fog", "🌫️"],
    51: ["Light drizzle", "🌦️"],
    53: ["Moderate drizzle", "🌦️"],
    55: ["Dense drizzle", "🌧️"],
    56: ["Light freezing drizzle", "🌧️"],
    57: ["Dense freezing drizzle", "🌧️"],
    61: ["Slight rain", "🌦️"],
    63: ["Moderate rain", "🌧️"],
    65: ["Heavy rain", "🌧️"],
    66: ["Light freezing rain", "🌧️"],
    67: ["Heavy freezing rain", "🌧️"],
    71: ["Slight snow", "🌨️"],
    73: ["Moderate snow", "🌨️"],
    75: ["Heavy snow", "❄️"],
    77: ["Snow grains", "❄️"],
    80: ["Slight rain showers", "🌦️"],
    81: ["Moderate rain showers", "🌧️"],
    82: ["Violent rain showers", "⛈️"],
    85: ["Slight snow showers", "🌨️"],
    86: ["Heavy snow showers", "❄️"],
    95: ["Thunderstorm", "⛈️"],
    96: ["Thunderstorm with slight hail", "⛈️"],
    99: ["Thunderstorm with heavy hail", "⛈️"],
  };
  return map[code] ? { description: map[code][0], icon: map[code][1] } : { description: "Unknown", icon: "❔" };
}

async function fetchJson(url) {
  let response;
  try {
    response = await fetch(url);
  } catch (err) {
    throw new AppWeatherError("Could not reach the weather service. Check your internet connection.");
  }
  if (!response.ok) {
    throw new AppWeatherError("The weather service returned an error for that location/date range.");
  }
  return response.json();
}

export async function getCurrentAndForecast(latitude, longitude) {
  const url =
    `${FORECAST_URL}?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&forecast_days=5&timezone=auto`;

  const data = await fetchJson(url);

  const current = {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    ...describeWeatherCode(data.current.weather_code),
    time: data.current.time,
  };

  const forecast = data.daily.time.map((date, i) => ({
    date,
    tempMax: data.daily.temperature_2m_max[i],
    tempMin: data.daily.temperature_2m_min[i],
    precipitation: data.daily.precipitation_sum[i],
    ...describeWeatherCode(data.daily.weather_code[i]),
  }));

  return { current, forecast, timezone: data.timezone };
}

export async function getDailyRange(latitude, longitude, startDate, endDate) {
  const dailyParams = "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum";

  const tryEndpoint = async (baseUrl) => {
    const url =
      `${baseUrl}?latitude=${latitude}&longitude=${longitude}` +
      `&start_date=${startDate}&end_date=${endDate}&daily=${dailyParams}&timezone=auto`;
    return fetchJson(url);
  };

  let data;
  try {
    data = await tryEndpoint(FORECAST_URL);
  } catch (err) {
    data = await tryEndpoint(ARCHIVE_URL);
  }

  if (!data.daily || !data.daily.time || data.daily.time.length === 0) {
    throw new AppWeatherError("No weather data available for that date range.", 404);
  }

  return data.daily.time.map((date, i) => ({
    date,
    tempMax: data.daily.temperature_2m_max[i],
    tempMin: data.daily.temperature_2m_min[i],
    precipitation: data.daily.precipitation_sum[i],
    ...describeWeatherCode(data.daily.weather_code[i]),
  }));
}
