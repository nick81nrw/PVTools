import {
  calcInverterEfficiency,
  chargeBattery,
  createRegression,
} from './shared.js'

/**
 * Splits one hour between PV, battery and grid, taking into account that the
 * consumption is not constant within the hour.
 *
 * Why a load distribution? A household with 500 Wh in one hour does not draw
 * a constant 500 W: most of the time it draws 200 W, for a few minutes the
 * kettle draws 3000 W. PV with 1000 W covers the 200 W completely, but only
 * 1000 W of the 3000 W peak. With constant 500 W the PV would wrongly cover
 * everything, so an hourly balance overestimates the self consumption.
 *
 * The load distribution of an hour comes from regressionDb (key = hourly
 * consumption rounded down to 50 Wh, value = { loadPower: share of the hour })
 * or, above the database, from createRegression().
 *
 * Calculation for one hour (all energies in Wh, powers in W, 1 h = 1 Wh/W):
 *
 * 1. Load levels: every entry of the distribution is a load level L_i (the
 *    middle of its 50 W step) that occurs during the share w_i of the hour
 *    (Σ w_i = 1). The levels are scaled so that their mean equals the hourly
 *    consumption E:  L_i = (P_i + Δ) · E / Σ w_j (P_j + Δ),  Σ w_i · L_i = E
 * 2. PV is constant during the hour. The inverter delivers at most
 *    PV · η on the AC side (η = efficiency at this load, calcInverterEfficiency).
 *    Load level i is covered up to that power:
 *      pvAc_i = min(L_i, PV · η),  PV energy used = Σ w_i · pvAc_i,
 *      inverter losses = Σ w_i · pvAc_i · (1 / η - 1)
 * 3. The rest of each load level is wanted from the battery, limited by the
 *    discharge power (or the free power of a shared inverter):
 *      battery demand = Σ w_i · min(L_i - pvAc_i, maxDischargePower)
 *    The battery delivers this demand as far as its state of charge above the
 *    minimum allows, minus the discharge efficiency.
 * 4. PV that is not used directly (PV - Σ w_i · pvAc_i / η) charges the
 *    battery (chargeBattery), the rest is fed in or curtailed by the feed-in
 *    limit.
 * 5. Whatever is left of the consumption comes from the grid.
 *
 * Charging and discharging within the same hour is intended: the battery
 * covers the peaks while the PV surplus of the calm minutes charges it.
 *
 * Example: E = 500 Wh, PV = 10000 Wh → every load level is below PV · η, so
 * the whole consumption is covered by PV and nothing comes from the grid.
 * (The previous calculation capped the coverage at the hourly mean of
 * 500 W and still drew about 25 % from the grid.)
 *
 * @param {Object} params
 * @param {Object} params.regressionDb load distributions per hourly consumption
 * @param {number} params.energyConsumption consumption of the hour in Wh
 * @param {number} params.staticPowerGeneration PV generation of the hour in Wh (after inverter clipping)
 * @param {number} params.maxPowerStaticInverter AC power of the PV inverter in W, 0 = unlimited
 * @param {number} params.maxPowerDynamicInverter discharge power of the battery in W, 0 = unlimited
 * @param {number} params.maxPowerLoadBattery charge power of the battery in W, 0 = unlimited
 * @param {number} params.maxPowerFeedIn feed-in limit in W
 * @param {number} params.batterySoc state of charge at the start of the hour in Wh
 * @param {number} params.batterySocMin minimum state of charge in Wh
 * @param {number} params.batterySocMax capacity in Wh
 * @param {number} params.batteryLoadEfficiency charging efficiency (0..1)
 * @param {number} params.batteryUnloadEfficiency discharging efficiency (0..1)
 * @return {Object} energy flows of the hour in Wh, see energyFlow()
 */
export const calcHourWithLoadDistribution = ({
  regressionDb,
  energyConsumption,
  flatConsumption = 0,
  flatConsumptionNoBattery = 0,
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
  const pv = Math.max(staticPowerGeneration, 0)
  const maxBatteryLoad =
    maxPowerLoadBattery > 0 ? maxPowerLoadBattery : Infinity

  const household = Math.max(energyConsumption || 0, 0)
  const flat = Math.max(flatConsumption || 0, 0)
  const flatNoBattery = Math.max(flatConsumptionNoBattery || 0, 0)
  const totalConsumption = household + flat + flatNoBattery

  // no consumption in this hour: all generation is stored or fed in
  if (!(totalConsumption > 0)) {
    const charged = chargeBattery({
      surplus: pv,
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
      flatSelfUsed: 0,
      flatNoBatterySelfUsed: 0,
      ...charged,
      losses: charged.lossesLoadBattery,
    }
  }

  // discharge power: battery inverter, or what the shared PV inverter has left
  let maxDischargePower = Infinity
  if (maxPowerDynamicInverter > 0) maxDischargePower = maxPowerDynamicInverter
  else if (maxPowerStaticInverter - pv > 0)
    maxDischargePower = maxPowerStaticInverter - pv

  // 1. load levels of the household in this hour, scaled to its consumption
  const levels = householdLevels(regressionDb, household)

  // 2. + 3. PV covers every load level up to its AC power, the battery
  //         is asked for the rest (limited by its discharge power)
  const inverterEfficiency = calcInverterEfficiency({
    maxPowerGenerationInverter: maxPowerStaticInverter,
    power: pv,
  })
  const pvAcPower = pv * inverterEfficiency
  // Large consumers (flat loads) run evenly through the hour and sit on top
  // of every household level. PV supplies the household first, then the
  // flat load, then the flat load that must not use the battery.
  let selfUsedEnergyPV = 0
  let flatFromPv = 0
  let flatNoBatteryFromPv = 0
  let batteryDemand = 0
  let flatBatteryDemand = 0
  for (const level of levels) {
    const pvHousehold = Math.min(level.power, pvAcPower)
    const pvFlat = Math.min(flat, pvAcPower - pvHousehold)
    const pvFlatNoBattery = Math.min(
      flatNoBattery,
      pvAcPower - pvHousehold - pvFlat,
    )
    selfUsedEnergyPV += level.share * (pvHousehold + pvFlat + pvFlatNoBattery)
    flatFromPv += level.share * pvFlat
    flatNoBatteryFromPv += level.share * pvFlatNoBattery
    const forHousehold = Math.min(level.power - pvHousehold, maxDischargePower)
    const forFlat = Math.min(flat - pvFlat, maxDischargePower - forHousehold)
    batteryDemand += level.share * (forHousehold + forFlat)
    flatBatteryDemand += level.share * forFlat
  }
  const pvUsedDc = selfUsedEnergyPV / inverterEfficiency
  const lossesPvGeneration = pvUsedDc - selfUsedEnergyPV

  // 3. discharge, never below the minimum state of charge
  const usableBatteryEnergy = Math.max(batterySoc - batterySocMin, 0)
  const batteryDischarge = Math.min(batteryDemand, usableBatteryEnergy)
  const selfUsedEnergyBattery = batteryDischarge * batteryUnloadEfficiency
  const lossesUnloadBattery = batteryDischarge - selfUsedEnergyBattery

  // 4. PV surplus charges the battery, the rest is fed in
  const {
    batteryCharge,
    newBatterySoc,
    lossesLoadBattery,
    feedInEnergyGrid,
    missedFeedInPowerGrid,
  } = chargeBattery({
    surplus: Math.max(pv - pvUsedDc, 0),
    batterySoc: batterySoc - batteryDischarge,
    batterySocMax,
    batteryLoadEfficiency,
    maxBatteryLoad,
    maxPowerFeedIn,
  })

  // 5. the rest comes from the grid
  const selfUsedEnergy = selfUsedEnergyPV + selfUsedEnergyBattery
  const gridUsedEnergy = Math.max(totalConsumption - selfUsedEnergy, 0)
  const delivered = batteryDemand > 0 ? batteryDischarge / batteryDemand : 0

  return {
    selfUsedEnergy,
    selfUsedEnergyPV,
    selfUsedEnergyBattery,
    gridUsedEnergy,
    feedInEnergyGrid,
    missedFeedInPowerGrid,
    lossesPvGeneration,
    lossesUnloadBattery,
    lossesLoadBattery,
    losses: lossesLoadBattery + lossesUnloadBattery + lossesPvGeneration,
    newBatterySoc,
    batteryCharge,
    batteryDischarge,
    // part of the flat loads covered by PV (and battery)
    flatSelfUsed:
      flatFromPv + flatBatteryDemand * delivered * batteryUnloadEfficiency,
    flatNoBatterySelfUsed: flatNoBatteryFromPv,
    staticInverterEfficiency: inverterEfficiency,
  }
}

/**
 * Load levels {share, power} of the household for one hour, scaled so their
 * mean is the hourly consumption. Without household consumption there is one
 * level with 0 W (only flat loads).
 */
const householdLevels = (regressionDb, energyConsumption) => {
  if (!(energyConsumption > 0)) return [{ share: 1, power: 0 }]
  const regressionKey = Math.floor(energyConsumption / 50) * 50
  const bigConsumption = regressionDb[regressionKey]
    ? null
    : createRegression({ energyConsumption })
  const distribution = bigConsumption
    ? bigConsumption.regression
    : regressionDb[regressionKey]
  // the middle of a step, e.g. 75 W for the step 50..100 W
  const stepMiddle = bigConsumption
    ? Math.floor(bigConsumption.resulution / 2)
    : 25
  const levels = Object.entries(distribution).map(([power, share]) => ({
    share,
    power: parseInt(power) + stepMiddle,
  }))
  const meanPower = levels.reduce((sum, l) => sum + l.share * l.power, 0)
  const scale = energyConsumption / meanPower
  return levels.map((level) => ({
    share: level.share,
    power: level.power * scale,
  }))
}
