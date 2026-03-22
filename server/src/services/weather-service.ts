const OWM_API_KEY = process.env.OPENWEATHERMAP_API_KEY;

export interface WeatherData {
  location: string;
  temperature: number;
  feels_like: number;
  humidity: number;
  description: string;
  wind_speed: number;
  units: string;
}

export async function checkWeather(
  location: string,
  units: 'metric' | 'imperial' = 'imperial',
): Promise<WeatherData> {
  if (!OWM_API_KEY) {
    return {
      location,
      temperature: 0,
      feels_like: 0,
      humidity: 0,
      description:
        'OpenWeatherMap API key is not set. Add OPENWEATHERMAP_API_KEY to the server .env file.',
      wind_speed: 0,
      units,
    };
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=${units}&appid=${OWM_API_KEY}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Weather API failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as {
    name: string;
    sys?: { country?: string };
    main: { temp: number; feels_like: number; humidity: number };
    weather?: Array<{ description?: string }>;
    wind: { speed: number };
  };
  const tempUnit = units === 'metric' ? '°C' : '°F';
  const speedUnit = units === 'metric' ? 'm/s' : 'mph';

  return {
    location: `${data.name}, ${data.sys?.country || ''}`,
    temperature: Math.round(data.main.temp),
    feels_like: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    description: data.weather?.[0]?.description || 'unknown',
    wind_speed: Math.round(data.wind.speed),
    units: `${tempUnit}, ${speedUnit}`,
  };
}
