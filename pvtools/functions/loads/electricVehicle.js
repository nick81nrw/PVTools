/**
 * Electric car (beta): when is the car charged at home?
 *
 * The car is modelled as a second battery with its own state of charge:
 * - Every day it uses its daily energy (driving): km per year / 365 ×
 *   consumption × share charged at home / charging efficiency.
 * - Presence 'commuter': drives at 7:00, away Monday–Friday 7:00–16:59,
 *   otherwise at home.
 *   Presence 'home' (home office, retired): a trip in the morning, back at
 *   12:00, otherwise at home.
 * - Charging 'immediate': as soon as it is at home, with full power, until
 *   it is full again.
 * - Charging 'surplus': only with PV surplus that would otherwise be fed in
 *   (from the minimum charging power on). Below the reserve the car is
 *   charged from the grid up to the reserve, so it is always ready to drive.
 *   The house battery never charges the car.
 */

export const EV_CHARGING_EFFICIENCY = 0.9
// a wallbox cannot charge with less (6 A, one phase)
export const EV_MIN_CHARGING_POWER = 1400

const isAway = (dayTime, presence) => {
  if (presence !== 'commuter') return false
  const year = Number(dayTime.slice(0, 4))
  const month = Number(dayTime.slice(4, 6)) - 1
  const day = Number(dayTime.slice(6, 8))
  const hour = Number(dayTime.slice(9, 11))
  const weekday = new Date(Date.UTC(year, month, day)).getUTCDay()
  return weekday >= 1 && weekday <= 5 && hour >= 7 && hour < 17
}

/** energy the car needs from the home wallbox per day in Wh */
export const evDailyEnergy = (input) =>
  ((Math.max(Number(input.evKmPerYear) || 0, 0) / 365) *
    (Math.max(Number(input.evConsumption) || 0, 0) / 100) *
    (Math.min(Math.max(Number(input.evHomeShare) || 0, 0), 100) / 100) *
    1000) /
  EV_CHARGING_EFFICIENCY

/**
 * Charging plan of the car for every hour.
 *
 * @param {Array} rows hourly rows with dayTime
 * @param {Object} input evKmPerYear, evConsumption (kWh/100 km), evHomeShare
 *   (%), evPower (W), evBatteryKwh, evPresence, evChargingMode
 * @param {Function} surplusAt (index, gridCharge) → PV surplus in Wh that
 *   would be fed in or curtailed in this hour (without house battery)
 * @return {Object} grid: Wh per hour charged as a flat load (from PV or grid,
 *   never from the house battery), surplus: Wh per hour taken directly from
 *   the PV surplus
 */
export const evChargingPlan = (rows, input, surplusAt) => {
  const daily = evDailyEnergy(input)
  const capacity = Math.max(Number(input.evBatteryKwh) || 0, 0) * 1000
  const power = Math.max(Number(input.evPower) || 0, 0)
  const reserve = Math.min(capacity, Math.max(0.3 * capacity, 2 * daily))
  const surplusMode = input.evChargingMode === 'surplus'

  // the energy of the day's trip is used when the car is back (or leaves)
  const tripHour = input.evPresence === 'commuter' ? 7 : 12
  let level = capacity
  const grid = new Array(rows.length).fill(0)
  const surplus = new Array(rows.length).fill(0)

  rows.forEach((row, i) => {
    const hour = Number(row.dayTime.slice(9, 11))
    if (hour === tripHour) level = Math.max(level - daily, 0)
    if (isAway(row.dayTime, input.evPresence) || power <= 0) return

    if (!surplusMode) {
      grid[i] = Math.min(power, capacity - level)
      level += grid[i]
      return
    }
    if (level < reserve) {
      grid[i] = Math.min(power, reserve - level)
      level += grid[i]
    }
    const available = surplusAt(i, grid[i])
    const room = Math.min(power - grid[i], capacity - level)
    if (available >= EV_MIN_CHARGING_POWER && room > 0) {
      surplus[i] = Math.min(available, room)
      level += surplus[i]
    }
  })
  return { grid, surplus }
}
