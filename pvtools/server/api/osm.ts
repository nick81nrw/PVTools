export interface OSM {
  place_id: number
  licence: string
  osm_type: string
  osm_id: number
  lat: string
  lon: string
  class: string
  type: string
  place_rank: number
  importance: number
  addresstype: string
  name: string
  display_name: string
  address: Address
  boundingbox: string[]
}

export interface Address {
  city: string
  'ISO3166-2-lvl4': string
  country: string
  country_code: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (
    !body.url ||
    !body.url.startsWith('https://nominatim.openstreetmap.org/')
  ) {
    return
  }

  try {
    const osmBody: OSM[] = await $fetch(body.url)
    return osmBody[0]
  } catch (error) {
    if (error)
      throw createError({
        statusCode: error.statusCode,
        message: error.data,
      })
  }
})
