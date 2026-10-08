import {
  getConsumptionProfile,
  scaleToMonths,
  validMonthly,
} from './consumptionProfiles.js'
import { generateDayTimeValues } from './energyFlow.js'
import { getHourModel } from './hourModels/index.js'
import { simulateBatterySizes } from './simulation.js'
import regressionDb from './regression.json'

/** hourly consumption from the yearly value or the 12 monthly values */
const profileConsumption = (input) => {
  const monthly = input.monthlyConsumptionEnabled && input.monthlyConsumption
  const useMonthly = validMonthly(monthly)
  const consumption = getConsumptionProfile(
    getHourModel(input.hourModel).consumptionProfile,
  ).build({
    year: input.year,
    consumptionYear: useMonthly
      ? monthly.reduce((sum, value) => sum + Number(value), 0)
      : input.yearlyConsumption,
  })
  // kWh per month → Wh like the profile
  return useMonthly
    ? scaleToMonths(
        consumption,
        monthly.map((value) => Number(value) * 1000),
      )
    : consumption
}

// runs the simulation off the main thread, it takes a few seconds
self.onmessage = ({ data }) => {
  try {
    const { mergedPower, importedConsumption, input, batterySizes } = data
    const consumption = importedConsumption || profileConsumption(input)
    const powerGenAndConsumption = generateDayTimeValues({
      consumption,
      powerGeneration: mergedPower,
      year: input.year,
    })
    const results = simulateBatterySizes({
      powerGenAndConsumption,
      input,
      batterySizes,
      regressionDb,
    })
    self.postMessage({ results, hours: powerGenAndConsumption.length })
  } catch (error) {
    self.postMessage({ error: error.message })
  }
}
