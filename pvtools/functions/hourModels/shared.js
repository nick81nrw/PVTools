/**
 * Helpers shared by the hour models (see ./index.js).
 */

/**
 * Synthetic load distribution for hourly consumptions above the regression
 * database (two normal distributions around a third of and slightly above
 * the hourly consumption).
 */
export const createRegression = ({ energyConsumption }) => {
  const multiplicator = 8
  const resulution = Math.max(
    Math.floor((energyConsumption * multiplicator) / 100 / 100) * 100,
    100,
  )
  const regressionKey = Math.floor(energyConsumption / resulution) * resulution

  const sigma1 = energyConsumption * 0.195
  const mu1 = energyConsumption / 3 + 50
  const sigma2 = energyConsumption * 0.1
  // const sigma2 = Math.max( -energyConsumption * (50/2000) + 500, 300 )
  const mu2 = energyConsumption + energyConsumption / 10

  // const powers = new Array(100).fill(0).map((e,i)=> i* resulution)
  const powers = new Array((regressionKey / resulution) * multiplicator)
    .fill(0)
    .map((e, i) => i * resulution)

  const unnorm = powers.map((power) => {
    const val =
      (1 / (sigma1 * Math.sqrt(2 * Math.PI))) *
        Math.exp(1) ** (-0.5 * ((power - mu1) / sigma1) ** 2) +
      (1 / (sigma2 * Math.sqrt(2 * Math.PI))) *
        Math.exp(1) ** (-0.5 * ((power - mu2) / sigma2) ** 2)
    return val
  })
  const sumUnnorm = unnorm.reduce((acc, curr) => acc + curr, 0)
  const regression = unnorm.reduce((acc, curr, i) => {
    acc[powers[i]] = curr * (1 / sumUnnorm)
    return acc
  }, {})

  return { regression, resulution, info: { sigma1, sigma2, mu1, mu2 } }
}

/**
 * Stores PV surplus in the battery (limited by free capacity and charging
 * power), the rest is fed into the grid (limited by the feed-in limit)
 */
export const chargeBattery = ({
  surplus,
  batterySoc,
  batterySocMax,
  batteryLoadEfficiency,
  maxBatteryLoad,
  maxPowerFeedIn,
}) => {
  const freeCapacity = Math.max(batterySocMax - batterySoc, 0)
  const batteryCharge = Math.max(
    Math.min(surplus, freeCapacity / batteryLoadEfficiency, maxBatteryLoad),
    0,
  )
  const feedInEnergyGridBase = surplus - batteryCharge
  const feedInEnergyGrid = Math.min(feedInEnergyGridBase, maxPowerFeedIn)
  return {
    batteryCharge,
    newBatterySoc: batterySoc + batteryCharge * batteryLoadEfficiency,
    lossesLoadBattery: batteryCharge * (1 - batteryLoadEfficiency),
    feedInEnergyGrid,
    missedFeedInPowerGrid: feedInEnergyGridBase - feedInEnergyGrid,
  }
}

/**
 * Efficiency of the PV inverter depending on its load (power / AC power).
 * Without an AC power limit the efficiency at full load is used.
 */
export const calcInverterEfficiency = ({
  maxPowerGenerationInverter,
  power,
}) => {
  const inverterEfficiency = {
    0: 0.8667,
    10: 0.8667,
    20: 0.9103,
    30: 0.9207,
    50: 0.9295,
    75: 0.9291,
    101: 0.9304,
  }

  if (!maxPowerGenerationInverter || maxPowerGenerationInverter == 0) {
    return inverterEfficiency[101]
  }
  const usedPower = Math.min(power / maxPowerGenerationInverter, 1) * 100
  const getCorrectEfficiencyKey =
    Object.keys(inverterEfficiency).find((val) => val >= usedPower) || 0

  return inverterEfficiency[getCorrectEfficiencyKey]
}
