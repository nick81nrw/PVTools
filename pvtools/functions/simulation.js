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
export const simulateBatterySizes = ({
  powerGenAndConsumption,
  input,
  batterySizes,
  regressionDb,
}) => {
  let costSavingWithoutBattery

  const batterySizesWithNoBattery = [1, ...batterySizes]

  let BatterySizeResults = batterySizesWithNoBattery.map((size) => {
    const minSocWithoutBattery = 1
    let newSoc =
      size == 1
        ? minSocWithoutBattery
        : (size * input.batterySocMinPercent) / 100

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
      }
      if (
        input.maxPowerGenerationInverter &&
        input.maxPowerGenerationInverter > 0
      )
        energyFlowObj.maxPowerGenerationInverter =
          input.maxPowerGenerationInverter
      if (
        input.maxPowerGenerationBattery &&
        input.maxPowerGenerationBattery > 0
      )
        energyFlowObj.maxPowerGenerationBattery =
          input.maxPowerGenerationBattery
      if (input.maxPowerLoadBattery && input.maxPowerLoadBattery > 0)
        energyFlowObj.maxPowerLoadBattery = input.maxPowerLoadBattery
      if (input.maxPowerFeedIn && input.maxPowerFeedIn > 0)
        energyFlowObj.maxPowerFeedIn = input.maxPowerFeedIn

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
    const amortization =
      (input.installationCostsWithoutBattery +
        input.batteryCostsPerKwh * (size / 1000)) /
      costSavings
    const costSavingsBattery =
      size == 1 ? 0 : costSavings - costSavingWithoutBattery
    const batteryAmortization =
      size == 1
        ? 0
        : (input.batteryCostsPerKwh * (size / 1000)) / costSavingsBattery

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
