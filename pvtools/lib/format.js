const formatters = new Map()

const formatter = (digits) => {
  if (!formatters.has(digits)) {
    formatters.set(
      digits,
      new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }),
    )
  }
  return formatters.get(digits)
}

export const num = (value, digits = 0) =>
  Number.isFinite(value) ? formatter(digits).format(value) : '–'

export const kwh = (value, digits = 0) => `${num(value, digits)} kWh`
export const pct = (value, digits = 1) => `${num(value, digits)} %`
export const eur = (value, digits = 0) => `${num(value, digits)} €`
export const NOT_PAYING_BACK = 'nicht amortisierbar'

/** payback time, Infinity (or a negative value) never pays back */
export const years = (value, digits = 1) =>
  Number.isFinite(value) && value > 0
    ? value > 99
      ? '> 99 J.'
      : `${num(value, digits)} J.`
    : NOT_PAYING_BACK

/** battery size in Wh, 1 Wh is used internally for "no battery" */
export const batteryLabel = (sizeWh) =>
  sizeWh <= 1 ? 'ohne' : `${num(sizeWh / 1000, sizeWh % 1000 ? 1 : 0)} kWh`

const DIRECTIONS = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW']

/** PVGIS azimuth (0 = south, -90 = east, 90 = west) to a compass direction */
export const azimuthName = (aspect) => {
  const bearing = (((aspect + 180) % 360) + 360) % 360
  return DIRECTIONS[Math.round(bearing / 45) % 8]
}
