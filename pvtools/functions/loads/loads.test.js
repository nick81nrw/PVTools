import { describe, expect, test } from 'vitest'

import {
  calculateConsumption,
  energyFlow,
  generateDayTimeValues,
  normalizeHourlyRadiation,
} from '../energyFlow.js'
import { calcHourWithLoadDistribution } from '../hourModels/loadDistribution.js'
import regressionDb from '../regression.json'
import seriescalc from '../seriescalc.json'
import { simulateBatterySizes } from '../simulation.js'
import { factorFunction, PROFILEBASE, SLPH0 } from '../SLP.js'
import {
  EV_MIN_CHARGING_POWER,
  evChargingPlan,
  evDailyEnergy,
} from './electricVehicle.js'
import { heatDemand, heatPumpLoad } from './heatPump.js'

const rows = generateDayTimeValues({
  consumption: calculateConsumption({
    year: 2020,
    consumptionYear: 4000,
    profile: SLPH0,
    profileBase: PROFILEBASE,
    factorFunction,
  }),
  powerGeneration: normalizeHourlyRadiation(seriescalc.outputs.hourly),
  year: 2020,
})

const sum = (values) => values.reduce((a, b) => a + b, 0)
const month = (row) => Number(row.dayTime.slice(4, 6))

const heatPumpInput = {
  heatPumpMode: 'building',
  heatPumpArea: 140,
  heatPumpBuilding: 'renovated',
  heatPumpPersons: 3,
  heatPumpJaz: 3.5,
  heatPumpHeatingLimit: 15,
}

const evInput = {
  evKmPerYear: 12000,
  evConsumption: 18,
  evHomeShare: 80,
  evPower: 11000,
  evBatteryKwh: 60,
  evPresence: 'commuter',
  evChargingMode: 'immediate',
}

describe('heat pump', () => {
  const load = heatPumpLoad(rows, heatPumpInput)

  test('yearly electricity = heat demand / JAZ', () => {
    const demand = heatDemand(heatPumpInput)
    expect(sum(load) / 1000).toBeCloseTo(
      (demand.space + demand.hotWater) / 3.5,
      6,
    )
  })

  test('a known yearly consumption is used as it is', () => {
    const known = heatPumpLoad(rows, {
      ...heatPumpInput,
      heatPumpMode: 'consumption',
      heatPumpConsumption: 3000,
    })
    expect(sum(known) / 1000).toBeCloseTo(3000, 6)
  })

  test('much more in winter than in summer, hot water all year', () => {
    const byMonth = (m) =>
      sum(load.filter((_, i) => month(rows[i]) === m)) / sum(load)
    expect(byMonth(1)).toBeGreaterThan(0.1)
    expect(byMonth(7)).toBeLessThan(0.05)
    expect(byMonth(7)).toBeGreaterThan(0)
  })

  test('no negative or invalid hours, also with missing temperatures', () => {
    const gaps = rows.map((row, i) =>
      i % 7 ? row : { ...row, temperature: undefined },
    )
    heatPumpLoad(gaps, heatPumpInput).forEach((value) => {
      expect(Number.isFinite(value)).toBe(true)
      expect(value).toBeGreaterThanOrEqual(0)
    })
  })
})

describe('electric car', () => {
  const daily = evDailyEnergy(evInput)
  const days = rows.length / 24

  test('daily energy at the wallbox includes charging losses', () => {
    // 12.000 km / 365 × 18 kWh/100 km × 80 % / 90 %
    expect(daily).toBeCloseTo(5260.27, 1)
  })

  test('immediate charging refills what was driven', () => {
    const plan = evChargingPlan(rows, evInput, () => 0)
    const total = sum(plan.grid)
    expect(total).toBeLessThanOrEqual(daily * days + 1e-6)
    expect(total).toBeGreaterThan(daily * (days - 2))
    expect(sum(plan.surplus)).toBe(0)
  })

  test('a commuter never charges on weekdays between 7 and 17', () => {
    const plan = evChargingPlan(rows, evInput, () => 0)
    rows.forEach((row, i) => {
      const date = new Date(
        Date.UTC(2020, month(row) - 1, Number(row.dayTime.slice(6, 8))),
      )
      const hour = Number(row.dayTime.slice(9, 11))
      const weekday = date.getUTCDay()
      if (weekday >= 1 && weekday <= 5 && hour >= 7 && hour < 17) {
        expect(plan.grid[i]).toBe(0)
      }
    })
  })

  test('surplus charging never takes more than the surplus', () => {
    const surplus = rows.map((row) => Math.max(row.P - row.consumption, 0))
    const plan = evChargingPlan(
      rows,
      { ...evInput, evPresence: 'home', evChargingMode: 'surplus' },
      (i) => surplus[i],
    )
    plan.surplus.forEach((value, i) => {
      expect(value).toBeLessThanOrEqual(surplus[i] + 1e-9)
      if (value > 0)
        expect(surplus[i]).toBeGreaterThanOrEqual(EV_MIN_CHARGING_POWER)
    })
    expect(sum(plan.surplus)).toBeGreaterThan(0)
  })

  test('without surplus the car is still charged from the grid', () => {
    const plan = evChargingPlan(
      rows,
      { ...evInput, evChargingMode: 'surplus' },
      () => 0,
    )
    // only up to the reserve, but enough to drive every day
    expect(sum(plan.grid)).toBeGreaterThan(daily * (days - 10))
    expect(sum(plan.surplus)).toBe(0)
  })
})

describe('flat loads in the hour model', () => {
  const base = {
    regressionDb,
    energyConsumption: 500,
    batterySoc: 3000,
    batterySocMin: 500,
    batterySocMax: 5000,
    batteryLoadEfficiency: 1,
    batteryUnloadEfficiency: 1,
  }

  test('without PV and battery a flat load comes from the grid', () => {
    const data = calcHourWithLoadDistribution({
      ...base,
      batterySoc: 500,
      flatConsumption: 2000,
      flatConsumptionNoBattery: 3000,
    })
    expect(data.gridUsedEnergy).toBeCloseTo(5500, 6)
    expect(data.flatSelfUsed).toBe(0)
  })

  test('large PV covers household and flat loads', () => {
    const data = calcHourWithLoadDistribution({
      ...base,
      staticPowerGeneration: 20000,
      flatConsumption: 2000,
      flatConsumptionNoBattery: 3000,
    })
    expect(data.gridUsedEnergy).toBeCloseTo(0, 6)
    expect(data.flatSelfUsed).toBeCloseTo(2000, 6)
    expect(data.flatNoBatterySelfUsed).toBeCloseTo(3000, 6)
  })

  test('the battery supplies the heat pump, but not the car', () => {
    const heatPump = calcHourWithLoadDistribution({
      ...base,
      energyConsumption: 0,
      flatConsumption: 1000,
    })
    expect(heatPump.batteryDischarge).toBeCloseTo(1000, 6)
    expect(heatPump.flatSelfUsed).toBeCloseTo(1000, 6)
    const car = calcHourWithLoadDistribution({
      ...base,
      energyConsumption: 0,
      flatConsumptionNoBattery: 1000,
    })
    expect(car.batteryDischarge).toBe(0)
    expect(car.gridUsedEnergy).toBeCloseTo(1000, 6)
  })

  test('without flat loads nothing changes', () => {
    const params = { ...base, staticPowerGeneration: 800 }
    const plain = calcHourWithLoadDistribution(params)
    const zero = calcHourWithLoadDistribution({
      ...params,
      flatConsumption: 0,
      flatConsumptionNoBattery: 0,
    })
    expect(zero).toEqual(plain)
  })

  test.each(['loadDistribution', 'legacyRegression'])(
    'energyFlow keeps the balance with all loads (%s)',
    (hourModel) => {
      const data = energyFlow({
        energyGeneration: 6000,
        energyConsumption: 400,
        flatConsumption: 1500,
        flatConsumptionNoBattery: 1000,
        pvDirectConsumption: 2000,
        batterySoc: 2000,
        batterySocMin: 500,
        batterySocMax: 5000,
        batteryLoadEfficiency: 0.95,
        batteryUnloadEfficiency: 0.95,
        regressionDb,
        hourModel,
      })
      expect(data.energyConsumption).toBeCloseTo(4900, 6)
      expect(data.selfUsedEnergy + data.gridUsedEnergy).toBeCloseTo(4900, 6)
      expect(
        data.selfUsedEnergyPV +
          data.lossesPvGeneration +
          data.batteryCharge +
          data.feedInEnergyGrid +
          data.missedFeedInPowerGrid,
      ).toBeCloseTo(6000, 6)
      expect(
        data.householdSelfUsed +
          data.flatSelfUsed +
          data.flatNoBatterySelfUsed +
          data.pvDirectConsumption,
      ).toBeCloseTo(data.selfUsedEnergy, 6)
    },
  )
})

describe('simulation with heat pump and car', () => {
  const input = {
    consumptionCosts: 0.32,
    feedInCompensation: 0.08,
    installationCostsWithoutBattery: 10000,
    batteryCostsPerKwh: 500,
    batteryLoadEfficiency: 95,
    batteryUnloadEfficiency: 95,
    batterySocMinPercent: 10,
    year: 2020,
    amortizationYears: 20,
    linearDegrationModules: 0,
    linearConsumptionChange: 0,
    linearConsumptionCostsChange: 0,
    linearSelfUseRateChange: 0,
    heatPumpEnabled: true,
    ...heatPumpInput,
    evEnabled: true,
    ...evInput,
    evPresence: 'home',
    evChargingMode: 'surplus',
  }
  const results = simulateBatterySizes({
    powerGenAndConsumption: rows,
    input,
    batterySizes: [5000, 10000],
    regressionDb,
  })

  test('energy balance holds for every size', () => {
    results.forEach((r) => expect(r.balance.ok).toBe(true))
  })

  test('the consumers add up to the totals', () => {
    results.forEach((r) => {
      const { household, heatPump, ev } = r.consumers
      expect(
        household.consumption + heatPump.consumption + ev.consumption,
      ).toBeCloseTo(r.consumptionYear, 6)
      expect(household.selfUsed + heatPump.selfUsed + ev.selfUsed).toBeCloseTo(
        r.selfUsedEnergy,
        6,
      )
      expect(household.consumption).toBeCloseTo(
        sum(rows.map((row) => row.consumption)) / 1000,
        6,
      )
    })
  })

  test('the car is charged the same way for every battery size', () => {
    const ev = results.map((r) => r.consumers.ev)
    ev.forEach((value) => expect(value).toEqual(ev[0]))
  })

  test('a battery increases the self sufficiency of the heat pump', () => {
    expect(results[2].consumers.heatPump.selfUsed).toBeGreaterThan(
      results[0].consumers.heatPump.selfUsed,
    )
  })
})
