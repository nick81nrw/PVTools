import {
  calcInverterEfficiency,
  chargeBattery,
  createRegression,
} from './shared.js'

/**
 * Classic calculation of PVTools until 10/2026 (selectable as hour model
 * "legacyRegression"). Kept for comparison with earlier results.
 *
 * Like calcHourWithLoadDistribution() it uses the load distribution of the
 * hour, but differs in three points (see BERECHNUNG.md):
 * - PV covers the load levels only up to min(consumption, PV), i.e. up to the
 *   hourly mean instead of the PV power. Large PV systems still draw 20 - 40 %
 *   from the grid in sunny hours, the self consumption without battery is
 *   underestimated and the gain of a battery overestimated.
 * - The load levels are not scaled to the hourly consumption.
 * - Inverter losses are counted as missing consumption (covered by grid or
 *   battery) instead of as additional PV energy.
 *
 * Measured against 1-minute load profiles of real households the battery gain
 * is about 25 % too high, see BERECHNUNG.md.
 *
 * Parameters and result: see the hour model interface in ./index.js.
 */
export const regressionCalc = ({
  regressionDb,
  energyConsumption,
  staticPowerGeneration = 0,
  maxPowerStaticInverter = 0,
  maxPowerDynamicInverter = 0,
  batterySoc = 0,
  batteryUnloadEfficiency = 1,
  batteryLoadEfficiency = 1,
  batterySocMin = 0,
  batterySocMax,
  maxPowerLoadBattery = 0,
  maxPowerFeedIn = 9999999,
}) => {
  const maxBatteryLoad =
    maxPowerLoadBattery > 0 ? maxPowerLoadBattery : Infinity

  let freePowerDynamicGeneration = 0
  if (maxPowerDynamicInverter > 0)
    freePowerDynamicGeneration = maxPowerDynamicInverter
  else if (maxPowerStaticInverter - staticPowerGeneration > 0)
    freePowerDynamicGeneration = maxPowerStaticInverter - staticPowerGeneration
  else freePowerDynamicGeneration = 99999999

  if (!(energyConsumption > 0)) {
    // no consumption in this hour: all generation is stored or fed in
    const charged = chargeBattery({
      surplus: Math.max(staticPowerGeneration, 0),
      batterySoc,
      batterySocMax,
      batteryLoadEfficiency,
      maxBatteryLoad,
      maxPowerFeedIn,
    })
    return {
      selfUsedEnergy: 0,
      selfUsedEnergyPV: 0,
      selfUsedEnergyBattery: 0,
      gridUsedEnergy: 0,
      lossesUnloadBattery: 0,
      lossesPvGeneration: 0,
      batteryDischarge: 0,
      ...charged,
      losses: charged.lossesLoadBattery,
    }
  }

  const multiplicator = Math.min(energyConsumption, staticPowerGeneration)

  const staticInverterEfficiency = calcInverterEfficiency({
    maxPowerGenerationInverter: maxPowerStaticInverter,
    power: staticPowerGeneration,
  })
  // const lastRegression = Object.keys(regressionDb)[Object.keys(regressionDb).length-1]
  const regressionKey = Math.floor(energyConsumption / 50) * 50
  const regressionBigConsumption = !regressionDb[regressionKey]
    ? createRegression({ energyConsumption })
    : null
  const regression = regressionDb[regressionKey]
    ? regressionDb[regressionKey]
    : regressionBigConsumption.regression

  const powerDelta = regressionBigConsumption
    ? Math.floor(regressionBigConsumption.resulution / 2)
    : 25 // use the mid of two regressen keys. e.g. 50,100,150 > use 75,125,175

  const {
    usedEnergyPv,
    usedEnergyPvBase,
    usedEnergyBattery,
    usedEnergyBatteryBase,
    usedPv,
  } = Object.keys(regression).reduce(
    (acc, curr) => {
      const power = parseInt(curr)
      const value = regression[curr]
      const usedPv = Math.min((power + powerDelta) / multiplicator, 1)
      const usedEnergyPvBase = usedPv * value * multiplicator
      const usedEnergyPv =
        usedPv * value * staticInverterEfficiency * multiplicator

      const splitConsumption = value * energyConsumption
      const energyForBattery = splitConsumption - usedEnergyPv
      const usedBattery = Math.min(
        freePowerDynamicGeneration / (power + powerDelta),
        1,
      )

      const usedEnergyBatteryBase = usedPv * value * staticPowerGeneration
      const usedEnergyBattery = usedBattery * energyForBattery

      return {
        usedEnergyPv: acc.usedEnergyPv + usedEnergyPv,
        usedEnergyPvBase: acc.usedEnergyPvBase + usedEnergyPvBase,
        usedEnergyBattery: acc.usedEnergyBattery + usedEnergyBattery,
        usedEnergyBatteryBase:
          acc.usedEnergyBatteryBase + usedEnergyBatteryBase,
        usedPv: acc.usedPv + usedPv,
      }
    },
    {
      usedEnergyPv: 0,
      usedEnergyPvBase: 0,
      usedEnergyBattery: 0,
      usedEnergyBatteryBase: 0,
      usedPv: 0,
    },
  )

  const selfUsedEnergyPV = usedEnergyPv
  const lossesPvGeneration = usedEnergyPvBase - selfUsedEnergyPV
  const overflowPv = Math.max(staticPowerGeneration - usedEnergyPvBase, 0)

  // discharge, the battery must not go below its minimum state of charge
  const usableBatteryEnergy = Math.max(batterySoc - batterySocMin, 0)
  const batteryDischarge = Math.min(usedEnergyBattery, usableBatteryEnergy)
  const selfUsedEnergyBattery = batteryDischarge * batteryUnloadEfficiency
  const lossesUnloadBattery = batteryDischarge - selfUsedEnergyBattery

  const {
    batteryCharge,
    newBatterySoc,
    lossesLoadBattery,
    feedInEnergyGrid,
    missedFeedInPowerGrid,
  } = chargeBattery({
    surplus: overflowPv,
    batterySoc: batterySoc - batteryDischarge,
    batterySocMax,
    batteryLoadEfficiency,
    maxBatteryLoad,
    maxPowerFeedIn,
  })

  const selfUsedEnergy = selfUsedEnergyBattery + selfUsedEnergyPV
  const gridUsedEnergy = energyConsumption - selfUsedEnergy
  const losses = lossesLoadBattery + lossesUnloadBattery + lossesPvGeneration

  return {
    selfUsedEnergy,
    selfUsedEnergyPV,
    usedEnergyPvBase,
    gridUsedEnergy,
    selfUsedEnergyBattery,
    feedInEnergyGrid,
    lossesUnloadBattery,
    lossesLoadBattery,
    lossesPvGeneration,
    missedFeedInPowerGrid,
    losses,
    newBatterySoc,
    batteryCharge,
    batteryDischarge,
    staticInverterEfficiency,
    usedPv,
    usedEnergyBatteryBase,
  }
}
