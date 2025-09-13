/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { delay } from "https://deno.land/std@0.177.0/async/delay.ts";

interface WeatherData {
  data: {
    values: {
      temperature: number;
      humidity: number;
      windSpeed: number;
      pressureSeaLevel: number;
      precipitationIntensity: number;
    };
  };
}

interface RequestParams {
  lat: number;
  lon: number;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const apiKey = Deno.env.get('TOMORROW_API_KEY') || '5EQZDJIyPYQJhIuKIgctgnKIwIk11eG7';

async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  maxRetries = 3, 
  baseDelay = 1000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.ok) {
        return response;
      }

      if (response.status === 429) { // Rate limit hit
        const waitTime = baseDelay * Math.pow(2, attempt);
        console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
        await delay(waitTime);
        continue;
      }

      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        await delay(baseDelay * Math.pow(2, attempt));
      }
    }
  }

  throw lastError || new Error('Max retries reached');
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  if (req.method !== 'GET') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const lat = url.searchParams.get('lat');
    const lon = url.searchParams.get('lon');

    if (!lat || !lon) {
      throw new Error('Missing latitude or longitude');
    }
    
    console.log('Fetching weather data for:', { lat, lon });

    // Fetch current weather data
    const weatherUrl = `https://api.tomorrow.io/v4/weather/realtime?location=${lat},${lon}&apikey=${apiKey}`;
    const weatherResponse = await fetchWithRetry(weatherUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const weatherData: WeatherData = await weatherResponse.json();

    // Check conditions for potential thunderstorm
    const { temperature, humidity, windSpeed, pressureSeaLevel, precipitationIntensity } = weatherData.data.values;

    const thunderstormLikelihood = calculateThunderstormLikelihood(
      temperature,
      humidity,
      windSpeed,
      pressureSeaLevel,
      precipitationIntensity
    );

    return new Response(
      JSON.stringify({
        prediction: thunderstormLikelihood,
        currentConditions: {
          temperature,
          humidity,
          windSpeed,
          pressureSeaLevel,
          precipitationIntensity,
        },
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

function calculateThunderstormLikelihood(
  temperature: number,
  humidity: number,
  windSpeed: number,
  pressureSeaLevel: number,
  precipitationIntensity: number
): number {
  // Temperature factor (higher temperatures increase likelihood)
  const tempFactor = Math.max(0, (temperature - 20) / 20); // Normalized around 20°C

  // Humidity factor (higher humidity increases likelihood)
  const humidityFactor = humidity / 100;

  // Wind speed factor (moderate winds are more favorable)
  const windFactor = Math.min(windSpeed / 10, 1);

  // Pressure factor (lower pressure increases likelihood)
  const pressureFactor = Math.max(0, (1015 - pressureSeaLevel) / 20);

  // Precipitation factor (higher precipitation increases likelihood)
  const precipFactor = Math.min(precipitationIntensity / 10, 1);

  // Calculate overall likelihood (0-1 scale)
  const likelihood = (
    tempFactor * 0.3 +
    humidityFactor * 0.25 +
    windFactor * 0.15 +
    pressureFactor * 0.15 +
    precipFactor * 0.15
  );

  return Math.min(Math.max(likelihood, 0), 1);
}