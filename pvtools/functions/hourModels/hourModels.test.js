import { energyFlow, normalizeHourlyRadiation } from '../energyFlow.js'
import regressionDb from '../regression.json'
import seriescalc from '../seriescalc.json'
import { DEFAULT_HOUR_MODEL, getHourModel, HOUR_MODELS } from './index.js'

const KEYS = [
  'selfUsedEnergyPV',
  'selfUsedEnergyBattery',
  'selfUsedEnergy',
  'gridUsedEnergy',
  'lossesPvGeneration',
  'batteryCharge',
  'batteryDischarge',
  'lossesLoadBattery',
  'lossesUnloadBattery',
  'losses',
  'feedInEnergyGrid',
  'missedFeedInPowerGrid',
  'newBatterySoc',
]

// checks the interface and the energy balance described in ./index.js
const expectValidHour = (params, data) => {
  KEYS.forEach((key) => {
    expect(Number.isFinite(data[key]), key).toBe(true)
    expect(data[key], key).toBeGreaterThanOrEqual(-1e-9)
  })
  expect(
    data.missedInverterPower +
      data.selfUsedEnergyPV +
      data.lossesPvGeneration +
      data.batteryCharge +
      data.feedInEnergyGrid +
      data.missedFeedInPowerGrid,
  ).toBeCloseTo(params.energyGeneration, 6)
  expect(
    params.batterySoc +
      data.batteryCharge -
      data.lossesLoadBattery -
      data.batteryDischarge,
  ).toBeCloseTo(data.newBatterySoc, 6)
  expect(data.selfUsedEnergy + data.gridUsedEnergy).toBeCloseTo(
    params.energyConsumption,
    6,
  )
  expect(data.newBatterySoc).toBeLessThanOrEqual(params.batterySocMax + 1e-9)
  expect(data.newBatterySoc).toBeGreaterThanOrEqual(
    Math.min(params.batterySoc, params.batterySocMin) - 1e-9,
  )
}

describe('hour model registry', () => {
  test('ids are unique and the default exists', () => {
    const ids = HOUR_MODELS.map((model) => model.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain(DEFAULT_HOUR_MODEL)
  })

  test('unknown ids fall back to the default model', () => {
    expect(getHourModel('does-not-exist').id).toBe(DEFAULT_HOUR_MODEL)
    expect(getHourModel(undefined).id).toBe(DEFAULT_HOUR_MODEL)
  })
})

describe.each(HOUR_MODELS)('hour model $id', (model) => {
  const base = {
    batterySocMax: 10000,
    batterySocMin: 1000,
    batteryEfficiency: 0.95,
    regressionDb,
    hourModel: model.id,
  }
  const hour = (params) => {
    const all = { ...base, ...params }
    const data = energyFlow(all)
    expectValidHour(all, data)
    return data
  }

  test('has a label, a description and a calculate function', () => {
    expect(model.label).toBeTruthy()
    expect(model.description).toBeTruthy()
    expect(typeof model.calculate).toBe('function')
  })

  test('edge cases', () => {
    hour({ energyGeneration: 0, energyConsumption: 0, batterySoc: 5000 })
    hour({ energyGeneration: 5000, energyConsumption: 0, batterySoc: 5000 })
    hour({ energyGeneration: 0, energyConsumption: 800, batterySoc: 1000 })
    hour({ energyGeneration: 0, energyConsumption: 800, batterySoc: 9000 })
    hour({ energyGeneration: 9000, energyConsumption: 300, batterySoc: 10000 })
    hour({
      energyGeneration: 9000,
      energyConsumption: 300,
      batterySoc: 5000,
      maxPowerFeedIn: 0,
      maxPowerLoadBattery: 1000,
    })
    hour({ energyGeneration: 3000, energyConsumption: 12000, batterySoc: 8000 })
  })

  test('a full year with real PVGIS data keeps the energy balance', () => {
    let batterySoc = base.batterySocMin
    Object.values(normalizeHourlyRadiation(seriescalc.outputs.hourly)).forEach(
      ({ P }, i) => {
        const data = hour({
          energyGeneration: P,
          energyConsumption: i % 24 === 3 ? 0 : 150 + (i % 11) * 120,
          batterySoc,
        })
        batterySoc = data.newBatterySoc
      },
    )
  })
})
