/**
 * Large consumers (beta) on top of the household: heat pump and electric car.
 * They are calculated once per simulation and passed to every hour as flat
 * loads (see hourModels/index.js).
 */
import { evChargingPlan } from './electricVehicle.js'
import { heatPumpLoad } from './heatPump.js'

/**
 * @param {Array} rows hourly rows (dayTime, temperature)
 * @param {Object} input user settings (heatPumpEnabled, evEnabled, …)
 * @param {Function} surplusAt (index, flatLoads) → PV surplus in Wh of this
 *   hour without house battery, used for surplus charging of the car
 * @return {Object|null} per hour arrays in Wh: heatPump, evGrid (flat, never
 *   from the house battery), evSurplus (directly from PV), or null if none
 */
export const buildLoads = (rows, input, surplusAt) => {
  if (!input.heatPumpEnabled && !input.evEnabled) return null
  const zeros = () => new Array(rows.length).fill(0)
  const heatPump = input.heatPumpEnabled ? heatPumpLoad(rows, input) : zeros()
  const ev = input.evEnabled
    ? evChargingPlan(rows, input, (i, evGrid) =>
        surplusAt(i, { heatPump: heatPump[i], evGrid }),
      )
    : { grid: zeros(), surplus: zeros() }
  return { heatPump, evGrid: ev.grid, evSurplus: ev.surplus }
}
