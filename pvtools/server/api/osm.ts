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

  const osmBody: OSM[] = await $fetch(body.url)

  return osmBody[0]
})

// import {RequestHandler} from "express";
// // let axios = require("axios")

// export const relayAPIRequest:RequestHandler = ((req,res, next) => {
//     if (!req.body.url.startsWith("https://re.jrc.ec.europa.eu/") &&
// 	!req.body.url.startsWith("https://nominatim.openstreetmap.org/")) {
//         return res.send(403)
//     }
//     if(req.body.method == "GET"){
//         axios.get(req.body.url)
//             .then((result:any) => res.json(result.data))
//             .catch((error:any) => console.error(error))
//     } else {
//         return res.send(403)
//     }

// })
