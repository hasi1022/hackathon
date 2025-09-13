import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { delay } from 'https://deno.land/std@0.177.0/async/delay.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:8080',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, Origin',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Credentials': 'true'
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    })
  }

  if (req.method !== 'GET') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    })
  }

  try {
    const url = new URL(req.url)
    const lat = url.searchParams.get('lat')
    const lon = url.searchParams.get('lon')

    if (!lat || !lon) {
      return new Response('Missing latitude or longitude', {
        status: 400,
        headers: corsHeaders,
      })
    }

    const apiKey = Deno.env.get('TOMORROW_API_KEY') || '5EQZDJIyPYQJhIuKIgctgnKIwIk11eG7'
    const weatherUrl = `https://api.tomorrow.io/v4/weather/realtime?location=${lat},${lon}&apikey=${apiKey}`
    
    let retries = 3
    let lastError = null

    while (retries > 0) {
      try {
        const response = await fetch(weatherUrl, {
          headers: { 'Accept': 'application/json' }
        })

        if (response.ok) {
          const data = await response.json()
          const values = data.data.values
          
          const likelihood = calculateThunderstormLikelihood(
            values.temperature,
            values.humidity,
            values.windSpeed,
            values.pressureSeaLevel,
            values.precipitationIntensity
          )

          return new Response(JSON.stringify({
            prediction: likelihood,
            currentConditions: values,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (response.status === 429) {
          const waitTime = 1000 * Math.pow(2, 3 - retries)
          await delay(waitTime)
          retries--
          continue
        }

        throw new Error(`HTTP error! status: ${response.status}`)
      } catch (error) {
        lastError = error
        retries--
        if (retries > 0) {
          await delay(1000 * Math.pow(2, 3 - retries))
        }
      }
    }

    return new Response(JSON.stringify({ 
      error: lastError?.message || 'Failed to fetch weather data'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function calculateThunderstormLikelihood(
  temperature: number,
  humidity: number,
  windSpeed: number,
  pressureSeaLevel: number,
  precipitationIntensity: number
): number {
  const tempFactor = Math.max(0, (temperature - 20) / 20)
  const humidityFactor = humidity / 100
  const windFactor = Math.min(windSpeed / 10, 1)
  const pressureFactor = Math.max(0, (1015 - pressureSeaLevel) / 20)
  const precipFactor = Math.min(precipitationIntensity / 10, 1)

  const likelihood = (
    tempFactor * 0.3 +
    humidityFactor * 0.25 +
    windFactor * 0.15 +
    pressureFactor * 0.15 +
    precipFactor * 0.15
  )

  return Math.min(Math.max(likelihood, 0), 1)
}