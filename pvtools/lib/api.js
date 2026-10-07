import {
  mergePowerGeneration,
  normalizeHourlyRadiation,
} from '../functions/energyFlow.js'

// PVGIS 5.3 (PVGIS-SARAH3) provides hourly data from 2005 to 2023
export const PVGIS_FIRST_YEAR = 2005
export const PVGIS_LAST_YEAR = 2023

/**
 * The backend relays requests to PVGIS and Nominatim: PVGIS does not allow
 * CORS and the user's IP address is not passed on to third parties.
 */
export async function relayRequest(url) {
  const response = await fetch(__API_BASE_URL__ + '/relay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, method: 'GET', body: {} }),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(
      `Request failed with status code ${response.status}`,
    )
    error.response = { status: response.status, data }
    throw error
  }
  return data
}

/** Returns the first Nominatim result for the query or null */
export async function geocode(query) {
  const results = await relayRequest(
    'https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=' +
      encodeURIComponent(query),
  )
  if (!Array.isArray(results) || !results.length) return null
  const { lat, lon, display_name, address = {} } = results[0]
  const city =
    address.city || address.town || address.village || address.municipality
  return {
    lat,
    lon,
    display_name,
    shortName:
      [address.postcode, city].filter(Boolean).join(' ') || display_name,
  }
}

export function buildPvgisUrl({
  lat,
  lon,
  peakpower,
  loss,
  year,
  angle,
  aspect,
}) {
  const params = new URLSearchParams({
    pvcalculation: 1,
    outputformat: 'json',
    loss: loss ?? 12,
    lat,
    lon,
    startyear: year,
    endyear: year,
    peakpower, // kWp
    angle,
    aspect,
  })
  return `https://re.jrc.ec.europa.eu/api/v5_3/seriescalc?${params}`
}

/**
 * Fetches the hourly PV generation of all roofs and merges them.
 * Roofs store their peak power in Wp.
 */
export async function fetchGeneration({ roofs, lat, lon, loss, year }) {
  const perRoof = await Promise.all(
    roofs.map(async (roof) => {
      const data = await relayRequest(
        buildPvgisUrl({
          lat,
          lon,
          loss,
          year,
          angle: roof.angle,
          aspect: roof.aspect,
          peakpower: roof.peakpower / 1000,
        }),
      )
      const hourly = normalizeHourlyRadiation(data.outputs.hourly)
      const generationYear =
        Object.values(hourly).reduce((sum, { P }) => sum + P, 0) / 1000
      return { hourly, roof: { ...roof, generationYear } }
    }),
  )
  return {
    mergedPower: mergePowerGeneration(perRoof.map((r) => r.hourly)),
    roofsData: perRoof.map((r) => r.roof),
  }
}
