import {
  calculateConsumption,
  generateDayTimeValues,
  normalizeHourlyRadiation,
} from './energyFlow.js'
import { simulateBatterySizes } from './simulation.js'
import { factorFunction, PROFILEBASE, SLPH0 } from './SLP.js'
import regressionDb from './regression.json'
import seriescalc from './seriescalc.json'

const input = {
  yearlyConsumption: 5000,
  consumptionCosts: 0.32,
  feedInCompensation: 0.086,
  installationCostsWithoutBattery: 10000,
  batteryCostsPerKwh: 500,
  batteryLoadEfficiency: 99,
  batteryUnloadEfficiency: 99,
  batterySocMinPercent: 10,
  year: 2020,
  maxPowerGenerationInverter: 5000,
  maxPowerGenerationBattery: 0,
  maxPowerLoadBattery: 0,
  maxPowerFeedIn: 0,
  amortizationYears: 20,
  linearDegrationModules: 0.5,
  linearConsumptionChange: 0.5,
  linearConsumptionCostsChange: 0,
  linearSelfUseRateChange: 0,
}

const powerGenAndConsumption = generateDayTimeValues({
  consumption: calculateConsumption({
    year: 2020,
    consumptionYear: input.yearlyConsumption,
    profile: SLPH0,
    profileBase: PROFILEBASE,
    factorFunction,
  }),
  powerGeneration: normalizeHourlyRadiation(seriescalc.outputs.hourly),
  year: 2020,
})

const results = simulateBatterySizes({
  powerGenAndConsumption,
  input,
  batterySizes: [2000, 6000, 12000],
  regressionDb,
})

const KEYS = [
  'size',
  'generationYear',
  'consumptionYear',
  'selfUsedEnergy',
  'fedInPower',
  'gridUsedEnergy',
  'selfSufficiencyRate',
  'selfUseRate',
  'costSavings',
  'amortization',
  'costSavingsBattery',
  'batteryAmortization',
]

describe('simulateBatterySizes', () => {
  test('returns one result per size plus the case without battery', () => {
    expect(results.map((r) => r.size)).toEqual([1, 2000, 6000, 12000])
  })

  test('energy balance holds for every size', () => {
    results.forEach((r) => {
      expect(r.selfUsedEnergy + r.gridUsedEnergy).toBeCloseTo(
        r.consumptionYear,
        6,
      )
      expect(r.energyFlow).toHaveLength(powerGenAndConsumption.length)
      expect(r.monthlyData).toHaveLength(12)
    })
  })

  test('a bigger battery increases self sufficiency', () => {
    for (let i = 1; i < results.length; i++) {
      expect(results[i].selfSufficiencyRate).toBeGreaterThan(
        results[i - 1].selfSufficiencyRate,
      )
    }
  })

  test('key figures stay unchanged', () => {
    const rounded = results.map((r) =>
      Object.fromEntries(KEYS.map((k) => [k, Number(r[k].toFixed(4))])),
    )
    expect(rounded).toMatchSnapshot()
  })
})
