import { energyFlow } from './energyFlow.js'

/**
 * Simulates one year of energy flows for every battery size and derives the
 * yearly, monthly and economic key figures.
 *
 * @param {Object} params
 * @param {Array} params.powerGenAndConsumption hourly values from generateDayTimeValues
 * @param {Object} params.input user settings (costs, efficiencies, limits, ...)
 * @param {Array<number>} params.batterySizes battery sizes in Wh
 * @param {Object} params.regressionDb consumption regression database
 * @return {Array<Object>} one result per battery size, the first one without battery (size 1)
 */
/** installed PV power of all roofs in Wp */
export const totalPeakPower = (input) =>
  (input.roofs || []).reduce(
    (sum, roof) => sum + Number(roof.peakpower || 0),
    0,
  )

/**
 * Effective power limits in W (= Wh per hour).
 * inverterPower 0 means no limit, feedInLimit Infinity means no limit.
 * Inputs saved before the modes existed only have the plain values.
 */
export const resolveLimits = (input) => {
  const inverterMode =
    input.inverterMode ??
    (input.maxPowerGenerationInverter > 0 ? 'manual' : 'none')
  const inverterPower =
    inverterMode === 'auto'
      ? totalPeakPower(input)
      : inverterMode === 'manual'
        ? Math.max(input.maxPowerGenerationInverter || 0, 0)
        : 0

  const feedInMode =
    input.feedInMode ?? (input.maxPowerFeedIn > 0 ? 'watt' : 'none')
  const feedInLimit = {
    none: Infinity,
    zero: 0,
    watt: Math.max(input.maxPowerFeedIn || 0, 0),
    percent:
      (totalPeakPower(input) * Math.max(input.feedInPercent || 0, 0)) / 100,
  }[feedInMode]

  return { inverterPower, feedInLimit: feedInLimit ?? Infinity }
}

/** payback time in years, Infinity if the investment never pays back */
export const paybackYears = (costs, yearlySavings) =>
  yearlySavings > 0 && Number.isFinite(costs) ? costs / yearlySavings : Infinity

const sumOf = (rows, key) => rows.reduce((sum, row) => sum + row[key], 0)

/**
 * Checks that no energy gets lost or created over the year (in Wh):
 * generation = used + stored + fed in + curtailed + losses,
 * battery start + charged - losses - discharged = battery end,
 * consumption = self used + grid.
 */
export const checkEnergyBalance = (rows, startSoc) => {
  const generation = sumOf(rows, 'powerProduction')
  const consumption = sumOf(rows, 'energyConsumption')
  const pv =
    generation -
    sumOf(rows, 'missedInverterPower') -
    sumOf(rows, 'selfUsedEnergyPV') -
    sumOf(rows, 'lossesPvGeneration') -
    sumOf(rows, 'batteryCharge') -
    sumOf(rows, 'feedInEnergyGrid') -
    sumOf(rows, 'missedFeedInPowerGrid')
  const endSoc = rows.length ? rows[rows.length - 1].newBatterySoc : startSoc
  const battery =
    startSoc +
    sumOf(rows, 'batteryCharge') -
    sumOf(rows, 'lossesLoadBattery') -
    sumOf(rows, 'batteryDischarge') -
    endSoc
  const usage =
    consumption - sumOf(rows, 'selfUsedEnergy') - sumOf(rows, 'gridUsedEnergy')
  const tolerance = 1 + 1e-9 * (generation + consumption)
  const deviations = { pv, battery, usage }
  return {
    ok: Object.values(deviations).every(
      (value) => Number.isFinite(value) && Math.abs(value) <= tolerance,
    ),
    deviations,
  }
}

export const simulateBatterySizes = ({
  powerGenAndConsumption,
  input,
  batterySizes,
  regressionDb,
}) => {
  let costSavingWithoutBattery
  const { inverterPower, feedInLimit } = resolveLimits(input)

  const batterySizesWithNoBattery = [1, ...batterySizes]

  let BatterySizeResults = batterySizesWithNoBattery.map((size) => {
    const minSocWithoutBattery = 1
    let newSoc =
      size == 1
        ? minSocWithoutBattery
        : (size * input.batterySocMinPercent) / 100
    const startSoc = newSoc

    let energyFlowData = powerGenAndConsumption.map((genConsumption) => {
      const energyFlowObj = {
        energyGeneration: genConsumption.P,
        energyConsumption: genConsumption.consumption,
        batterySoc: newSoc,
        batterySocMax: size, // * input.batterySocMaxPercent / 100,
        batterySocMin:
          size == 1
            ? minSocWithoutBattery
            : (size * input.batterySocMinPercent) / 100,
        batteryLoadEfficiency: input.batteryLoadEfficiency / 100,
        batteryUnloadEfficiency: input.batteryUnloadEfficiency / 100,
        dayTime: genConsumption.dayTime,
        regressionDb,
        hourModel: input.hourModel,
      }
      if (inverterPower > 0)
        energyFlowObj.maxPowerGenerationInverter = inverterPower
      if (
        input.maxPowerGenerationBattery &&
        input.maxPowerGenerationBattery > 0
      )
        energyFlowObj.maxPowerGenerationBattery =
          input.maxPowerGenerationBattery
      if (input.maxPowerLoadBattery && input.maxPowerLoadBattery > 0)
        energyFlowObj.maxPowerLoadBattery = input.maxPowerLoadBattery
      if (feedInLimit < Infinity) energyFlowObj.maxPowerFeedIn = feedInLimit

      const hourFlow = energyFlow(energyFlowObj)
      newSoc = hourFlow.newBatterySoc
      return hourFlow
    })

    const generationYear =
      energyFlowData.reduce((prev, curr) => curr.powerProduction + prev, 0) /
      1000
    const consumptionYear =
      energyFlowData.reduce((prev, curr) => curr.energyConsumption + prev, 0) /
      1000
    const gridUsedEnergy =
      energyFlowData.reduce((prev, curr) => curr.gridUsedEnergy + prev, 0) /
      1000
    const missedBatteryPower =
      energyFlowData.reduce(
        (prev, curr) =>
          curr.lossesUnloadBattery + curr.lossesLoadBattery + prev,
        0,
      ) / 1000
    const missedFeedInPowerGrid =
      energyFlowData.reduce(
        (prev, curr) => curr.missedFeedInPowerGrid + prev,
        0,
      ) / 1000
    const missedInverterPower =
      energyFlowData.reduce(
        (prev, curr) => curr.missedInverterPower + prev,
        0,
      ) / 1000
    const lossesPvGeneration =
      energyFlowData.reduce((prev, curr) => curr.lossesPvGeneration + prev, 0) /
      1000
    const selfUsedEnergy =
      energyFlowData.reduce((prev, curr) => curr.selfUsedEnergy + prev, 0) /
      1000
    const fedInPower =
      energyFlowData.reduce((prev, curr) => curr.feedInEnergyGrid + prev, 0) /
      1000
    const selfSufficiencyRate = (selfUsedEnergy / consumptionYear) * 100 // Autarkiegrad
    const selfUseRate = (selfUsedEnergy / generationYear) * 100 // Eigenverbrauchsquote
    const costSavings =
      selfUsedEnergy * input.consumptionCosts +
      fedInPower * input.feedInCompensation
    if (size == 1) costSavingWithoutBattery = costSavings
    const amortization = paybackYears(
      input.installationCostsWithoutBattery +
        input.batteryCostsPerKwh * (size / 1000),
      costSavings,
    )
    const costSavingsBattery =
      size == 1 ? 0 : costSavings - costSavingWithoutBattery
    const batteryAmortization =
      size == 1
        ? 0
        : paybackYears(
            input.batteryCostsPerKwh * (size / 1000),
            costSavingsBattery,
          )

    const monthlyDataObj = energyFlowData.reduce((prev, curr) => {
      const month = parseInt(curr.dayTime.slice(4, 6))
      if (prev[month]) {
        prev[month] = {
          batteryLoad:
            curr.batteryLoad <= 0
              ? curr.batteryLoad * -1 + prev[month].batteryLoad
              : curr.batteryLoad + prev[month].batteryLoad,
          gridUsedEnergy: curr.gridUsedEnergy + prev[month].gridUsedEnergy,
          feedInEnergyGrid:
            curr.feedInEnergyGrid + prev[month].feedInEnergyGrid,
          missedBatteryPower:
            curr.missedBatteryPower + prev[month].missedBatteryPower,
          missedFeedInPowerGrid:
            curr.missedFeedInPowerGrid + prev[month].missedFeedInPowerGrid,
          missedInverterPower:
            curr.missedInverterPower + prev[month].missedInverterPower,
          lossesPvGeneration:
            curr.lossesPvGeneration + prev[month].lossesPvGeneration,
          selfUsedEnergy: curr.selfUsedEnergy + prev[month].selfUsedEnergy,
          selfUsedEnergyBattery:
            curr.selfUsedEnergyBattery + prev[month].selfUsedEnergyBattery,
          selfUsedEnergyPV:
            curr.selfUsedEnergyPV + prev[month].selfUsedEnergyPV,
        }
      } else {
        prev[month] = {
          batteryLoad:
            curr.batteryLoad <= 0 ? curr.batteryLoad * -1 : curr.batteryLoad,
          gridUsedEnergy: curr.gridUsedEnergy,
          feedInEnergyGrid: curr.feedInEnergyGrid,
          missedBatteryPower: curr.missedBatteryPower,
          missedFeedInPowerGrid: curr.missedFeedInPowerGrid,
          missedInverterPower: curr.missedInverterPower,
          lossesPvGeneration: curr.lossesPvGeneration,
          selfUsedEnergy: curr.selfUsedEnergy,
          selfUsedEnergyBattery: curr.selfUsedEnergyBattery,
          selfUsedEnergyPV: curr.selfUsedEnergyPV,
        }
      }
      return prev
    }, {})

    const yearlyData = new Array(input.amortizationYears)
      .fill(undefined)
      .map((val, i) => i)
      .map((val) => {
        const conYear =
          (consumptionYear * (100 + input.linearConsumptionChange * val)) / 100
        // var suRate = selfUseRate * (100 + input.linearSelfUseRateChange * val)/100
        var suRate =
          selfUseRate * (input.linearSelfUseRateChange / 100 + 1) ** val
        const suPower = (generationYear * suRate) / 100
        const conCosts =
          input.consumptionCosts *
          ((100 + input.linearConsumptionCostsChange * val) / 100)
        const fedIn = generationYear - suPower
        return {
          year: val,
          generationYear:
            (generationYear * (100 - input.linearDegrationModules * val)) / 100,
          consumptionYear: conYear,
          selfUsedEnergy: suPower,
          fedInPower: fedIn,
          selfSufficiencyRate: (suPower / conYear) * 100,
          selfUsedRate: selfUseRate,
          consumptionCosts: conCosts,
          costSavings: suPower * conCosts + fedIn * input.feedInCompensation,
        }
      })

    const monthlyData = Object.keys(monthlyDataObj)
      .map((key) => {
        monthlyDataObj[key].month = parseInt(key)
        return monthlyDataObj[key]
      })
      .sort((a, b) => a.month - b.month)

    return {
      size,
      balance: checkEnergyBalance(energyFlowData, startSoc),
      batteryCharge: sumOf(energyFlowData, 'batteryCharge') / 1000,
      batteryDischarge: sumOf(energyFlowData, 'batteryDischarge') / 1000,
      energyFlow: energyFlowData,
      generationYear,
      consumptionYear,
      selfUsedEnergy,
      fedInPower,
      missedBatteryPower,
      missedFeedInPowerGrid,
      missedInverterPower,
      lossesPvGeneration,
      gridUsedEnergy,
      selfSufficiencyRate,
      selfUseRate,
      costSavings,
      amortization,
      costSavingsBattery,
      batteryAmortization,
      monthlyData,
      yearlyData,
      // regressionEnergyFlow
    }
  })

  return BatterySizeResults
}
