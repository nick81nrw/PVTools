export interface PVGIS {
  inputs: Inputs
  outputs: Outputs
  meta: Meta
}

export interface Inputs {
  location: Location
  meteo_data: MeteoData
  mounting_system: MountingSystem
  pv_module: PvModule
}

export interface Location {
  latitude: number
  longitude: number
  elevation: number
}

export interface MeteoData {
  radiation_db: string
  meteo_db: string
  year_min: number
  year_max: number
  use_horizon: boolean
  horizon_db: any
  horizon_data: string
}

export interface MountingSystem {
  fixed: Fixed
}

export interface Fixed {
  slope: Slope
  azimuth: Azimuth
  type: string
}

export interface Slope {
  value: number
  optimal: boolean
}

export interface Azimuth {
  value: number
  optimal: boolean
}

export interface PvModule {
  technology: string
  peak_power: number
  system_loss: number
}

export interface Outputs {
  hourly: Hourly[]
}

export interface Hourly {
  time: string
  P: number
  'G(i)': number
  H_sun: number
  T2m: number
  WS10m: number
  Int: number
}

export interface Meta {
  inputs: Inputs2
  outputs: Outputs2
}

export interface Inputs2 {
  location: Location2
  meteo_data: MeteoData2
  mounting_system: MountingSystem2
  pv_module: PvModule2
}

export interface Location2 {
  description: string
  variables: Variables
}

export interface Variables {
  latitude: Latitude
  longitude: Longitude
  elevation: Elevation
}

export interface Latitude {
  description: string
  units: string
}

export interface Longitude {
  description: string
  units: string
}

export interface Elevation {
  description: string
  units: string
}

export interface MeteoData2 {
  description: string
  variables: Variables2
}

export interface Variables2 {
  radiation_db: RadiationDb
  meteo_db: MeteoDb
  year_min: YearMin
  year_max: YearMax
  use_horizon: UseHorizon
  horizon_db: HorizonDb
}

export interface RadiationDb {
  description: string
}

export interface MeteoDb {
  description: string
}

export interface YearMin {
  description: string
}

export interface YearMax {
  description: string
}

export interface UseHorizon {
  description: string
}

export interface HorizonDb {
  description: string
}

export interface MountingSystem2 {
  description: string
  choices: string
  fields: Fields
}

export interface Fields {
  slope: Slope2
  azimuth: Azimuth2
}

export interface Slope2 {
  description: string
  units: string
}

export interface Azimuth2 {
  description: string
  units: string
}

export interface PvModule2 {
  description: string
  variables: Variables3
}

export interface Variables3 {
  technology: Technology
  peak_power: PeakPower
  system_loss: SystemLoss
}

export interface Technology {
  description: string
}

export interface PeakPower {
  description: string
  units: string
}

export interface SystemLoss {
  description: string
  units: string
}

export interface Outputs2 {
  hourly: Hourly2
}

export interface Hourly2 {
  type: string
  timestamp: string
  variables: Variables4
}

export interface Variables4 {
  P: P
  'G(i)': GI
  H_sun: HSun
  T2m: T2m
  WS10m: Ws10m
  Int: Int
}

export interface P {
  description: string
  units: string
}

export interface GI {
  description: string
  units: string
}

export interface HSun {
  description: string
  units: string
}

export interface T2m {
  description: string
  units: string
}

export interface Ws10m {
  description: string
  units: string
}

export interface Int {
  description: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body.url || !body.url.startsWith('https://re.jrc.ec.europa.eu/')) {
    return
  }

  const pvgisBody: PVGIS = await $fetch(body.url)

  return pvgisBody.outputs.hourly
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
