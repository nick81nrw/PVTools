import { calculateConsumption, generateDayTimeValues } from './energyFlow.js'
import { factorFunction, PROFILEBASE, SLPH0 } from './SLP.js'
import { simulateBatterySizes } from './simulation.js'
import regressionDb from './regression.json'

// runs the simulation off the main thread, it takes a few seconds
self.onmessage = ({ data }) => {
  try {
    const { mergedPower, importedConsumption, input, batterySizes } = data
    const consumption =
      importedConsumption ||
      calculateConsumption({
        year: input.year,
        consumptionYear: input.yearlyConsumption,
        profile: SLPH0,
        profileBase: PROFILEBASE,
        factorFunction,
      })
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
