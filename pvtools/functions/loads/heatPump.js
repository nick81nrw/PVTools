/**
 * Heat pump (beta): electricity per hour from the outdoor temperature.
 *
 * 1. Heat demand for space heating per hour is proportional to the degree
 *    hours below the heating limit: max(0, heatingLimit − T). T is the mean
 *    temperature of the last 24 hours, because a building reacts slowly.
 * 2. Hot water is spread over the year with a daily pattern (morning and
 *    evening).
 * 3. Electricity = heat / COP. The COP gets worse with lower outdoor
 *    temperature (COP_raw = 3 + 0.1 · (T − 2), at least 1.5). Hot water needs
 *    a higher flow temperature, its COP is 25 % lower. The COP is scaled so
 *    that the year has the given seasonal performance factor (JAZ).
 * 4. If the yearly electricity of the heat pump is known, the result is
 *    scaled to it.
 *
 * The outdoor temperature comes from PVGIS for the location and the weather
 * year, so cold and dark days come together like in reality.
 */

/** space heating demand in kWh per m² and year by building standard */
export const BUILDING_STANDARDS = {
  new: { label: 'Neubau / KfW', heatPerM2: 50 },
  renovated: { label: 'saniert', heatPerM2: 90 },
  old: { label: 'unsaniert', heatPerM2: 150 },
}

/**
 * hot water heat per person and year in kWh, including losses of the tank
 * and the pipes (about 40 % on top of the tapped hot water)
 */
export const HOT_WATER_PER_PERSON = 1000

// share of the daily hot water per hour of the day (sum 1)
const HOT_WATER_PATTERN = (() => {
  const weights = [
    1, 1, 1, 1, 1, 2, 6, 8, 6, 4, 3, 3, 3, 3, 3, 3, 4, 5, 7, 8, 6, 4, 2, 1,
  ]
  const total = weights.reduce((a, b) => a + b, 0)
  return weights.map((w) => w / total)
})()

const rawCop = (temperature) => Math.max(3 + 0.1 * (temperature - 2), 1.5)
const HOT_WATER_COP_FACTOR = 0.75

/** temperatures with gaps filled by the previous value (or 10 °C) */
const cleanTemperatures = (rows) => {
  let last = 10
  return rows.map((row) => {
    const value = Number(row.temperature)
    if (Number.isFinite(value)) last = value
    return last
  })
}

/** heat demand of the building in kWh per year (space heating, hot water) */
export const heatDemand = (input) => ({
  space:
    Math.max(Number(input.heatPumpArea) || 0, 0) *
    (BUILDING_STANDARDS[input.heatPumpBuilding] ?? BUILDING_STANDARDS.renovated)
      .heatPerM2,
  hotWater:
    Math.max(Number(input.heatPumpPersons) || 0, 0) * HOT_WATER_PER_PERSON,
})

/**
 * Electricity of the heat pump per hour in Wh.
 * @param {Array} rows hourly rows with dayTime ('YYYYMMDD:HH') and temperature
 * @param {Object} input heatPumpMode 'consumption' (heatPumpConsumption kWh/a)
 *   or 'building' (heatPumpArea, heatPumpBuilding, heatPumpPersons),
 *   heatPumpJaz, heatPumpHeatingLimit
 * @return {Array<number>} Wh per hour, same order as rows
 */
export const heatPumpLoad = (rows, input) => {
  const temperatures = cleanTemperatures(rows)
  const limit = Number(input.heatPumpHeatingLimit ?? 15)
  const jaz = Math.max(Number(input.heatPumpJaz) || 3.5, 1)

  // 24 h mean temperature (building inertia)
  const smoothed = []
  let window = 0
  temperatures.forEach((t, i) => {
    window += t
    if (i >= 24) window -= temperatures[i - 24]
    smoothed.push(window / Math.min(i + 1, 24))
  })
  const degreeHours = smoothed.map((t) => Math.max(limit - t, 0))
  const degreeSum = degreeHours.reduce((a, b) => a + b, 0)

  const demand =
    input.heatPumpMode === 'consumption'
      ? { space: 1, hotWater: 0.2 } // only the shape matters, scaled below
      : heatDemand(input)
  const hours = rows.length
  const heat = rows.map((row, i) => {
    const hour = Number(row.dayTime.slice(-2))
    const space =
      degreeSum > 0 ? (demand.space * degreeHours[i]) / degreeSum : 0
    const hotWater = ((demand.hotWater * 24) / hours) * HOT_WATER_PATTERN[hour]
    return { space, hotWater }
  })

  // electricity with a temperature dependent COP, scaled to the JAZ
  const rawElectricity = heat.map((h, i) => {
    const cop = rawCop(temperatures[i])
    return h.space / cop + h.hotWater / (cop * HOT_WATER_COP_FACTOR)
  })
  const totalHeat = heat.reduce((sum, h) => sum + h.space + h.hotWater, 0)
  const totalRaw = rawElectricity.reduce((a, b) => a + b, 0)
  const targetKwh =
    input.heatPumpMode === 'consumption'
      ? Math.max(Number(input.heatPumpConsumption) || 0, 0)
      : totalHeat / jaz
  const factor = totalRaw > 0 ? (targetKwh * 1000) / totalRaw : 0
  return rawElectricity.map((value) => value * factor)
}
