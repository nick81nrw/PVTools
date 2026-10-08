/**
 * Consumption profiles: how the yearly consumption is spread over the hours of
 * the year when no measured values (CSV) are imported.
 *
 * Every hour model (hourModels/index.js) names the profile it is calibrated
 * with in `consumptionProfile`. A new profile only needs an entry in
 * CONSUMPTION_PROFILES with a build function:
 *
 *   build({ year, consumptionYear }) → { 'YYYYMMDD:HH': { P: Wh }, ... }
 *
 * The sum over all hours must equal consumptionYear (in Wh).
 */
import { calculateConsumption } from './energyFlow.js'
import { factorFunction, PROFILEBASE, SLPH0 } from './SLP.js'

const h0 = ({ year, consumptionYear }) =>
  calculateConsumption({
    year,
    consumptionYear,
    profile: SLPH0,
    profileBase: PROFILEBASE,
    factorFunction,
  })

/** small deterministic random generator (mulberry32), returns 0 <= x < 1 */
export const createRandom = (seed) => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Parameters of the calibrated variability. They were fitted so that the
 * model „Lastverteilung“ with the calibrated H0 matches minute-resolved
 * simulations of measured single-family households (see BERECHNUNG.md).
 */
export const H0_VARIABILITY = { sigma: 1.0, rho: 0.75, seed: 1 }

/**
 * Add a deterministic hour-to-hour variability to a smooth profile.
 *
 * Every hour is multiplied with exp(sigma · x). x is a correlated random
 * series (AR(1): x = rho · x_prev + sqrt(1 − rho²) · z, z standard normal),
 * so busy and quiet phases last a few hours like in a real household. The
 * hours of each day are then scaled so that the day keeps its energy from the
 * profile; the yearly sum and the seasonal and weekly shape stay unchanged.
 * The same seed always gives the same series, results are reproducible.
 *
 * @param  {Object} consumption {'YYYYMMDD:HH': {P}} smooth profile
 * @param  {Object} options     sigma, rho, seed
 * @return {Object}             new object in the same format
 */
export const addVariability = (
  consumption,
  { sigma, rho, seed } = H0_VARIABILITY,
) => {
  const random = createRandom(seed)
  const normal = () =>
    Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random())

  const keys = Object.keys(consumption).sort()
  const factors = {}
  let x = normal()
  for (const key of keys) {
    x = rho * x + Math.sqrt(1 - rho * rho) * normal()
    factors[key] = Math.exp(sigma * x)
  }

  const days = {}
  for (const key of keys) {
    const day = key.slice(0, 8)
    days[day] ??= []
    days[day].push(key)
  }

  const result = {}
  for (const dayKeys of Object.values(days)) {
    const energy = dayKeys.reduce((sum, key) => sum + consumption[key].P, 0)
    const weighted = dayKeys.reduce(
      (sum, key) => sum + consumption[key].P * factors[key],
      0,
    )
    const scale = weighted > 0 ? energy / weighted : 0
    for (const key of dayKeys) {
      result[key] = {
        ...consumption[key],
        P: consumption[key].P * factors[key] * scale,
      }
    }
  }
  return result
}

/** month (1–12) of an hour key 'YYYYMMDD:HH' */
const monthOf = (key) => Number(key.slice(4, 6))

/** consumption per month in the unit of P, index 0 = January */
export const monthlySums = (consumption) => {
  const sums = new Array(12).fill(0)
  for (const [key, { P }] of Object.entries(consumption)) {
    sums[monthOf(key) - 1] += P
  }
  return sums
}

/**
 * Scales every month of a profile to the given monthly consumption, the
 * shape within the month stays as it is.
 *
 * @param  {Object} consumption {'YYYYMMDD:HH': {P}}
 * @param  {Array}  monthly     12 values in the unit of P, index 0 = January
 * @return {Object}             new object in the same format
 */
export const scaleToMonths = (consumption, monthly) => {
  const current = monthlySums(consumption)
  const factors = current.map((sum, i) =>
    sum > 0 ? Math.max(Number(monthly[i]) || 0, 0) / sum : 0,
  )
  const result = {}
  for (const [key, value] of Object.entries(consumption)) {
    result[key] = { ...value, P: value.P * factors[monthOf(key) - 1] }
  }
  return result
}

/** true if 12 monthly values (kWh) are given and they are not all 0 */
export const validMonthly = (monthly) =>
  Array.isArray(monthly) &&
  monthly.length === 12 &&
  monthly.every((value) => Number(value) >= 0) &&
  monthly.some((value) => Number(value) > 0)

export const CONSUMPTION_PROFILES = [
  {
    id: 'h0',
    label: 'H0 (BDEW)',
    description:
      'BDEW-Standardlastprofil H0 mit Dynamisierung. Als Durchschnitt vieler Haushalte sehr gleichmäßig.',
    build: h0,
  },
  {
    id: 'h0Calibrated',
    label: 'H0 kalibriert',
    description:
      'H0 mit realistischen Schwankungen von Stunde zu Stunde. Tagesverbrauch, Jahreszeiten und Wochentage bleiben wie bei H0.',
    build: (params) => addVariability(h0(params)),
  },
]

export const DEFAULT_CONSUMPTION_PROFILE = 'h0Calibrated'

/** the profile with this id, the default profile for unknown ids */
export const getConsumptionProfile = (id) =>
  CONSUMPTION_PROFILES.find((profile) => profile.id === id) ??
  CONSUMPTION_PROFILES.find(
    (profile) => profile.id === DEFAULT_CONSUMPTION_PROFILE,
  )
