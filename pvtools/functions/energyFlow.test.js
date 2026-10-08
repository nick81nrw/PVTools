import {
  calcHourWithLoadDistribution,
  energyFlow,
  calculateConsumption,
  normalizeHourlyRadiation,
  mergePowerGeneration,
} from './energyFlow.js'

import seriescalc from './seriescalc.json'
import seriescalc2 from './seriescalc2.json'

const normalizedHR = normalizeHourlyRadiation(seriescalc.outputs.hourly)
const normalizedHR2 = normalizeHourlyRadiation(seriescalc2.outputs.hourly)

import regressionDb from './regression.json'

describe('testNormalize function', () => {
  test('check P and temperature values', () => {
    expect(Object.keys(normalizedHR).length).toBe(8784)
    expect(normalizedHR['20200505:15']).toEqual({
      P: 3443.82,
      temperature: 22.81,
    })
  })
})

const NUMERIC_KEYS = [
  'newBatterySoc',
  'selfUsedEnergy',
  'selfUsedEnergyPV',
  'selfUsedEnergyBattery',
  'feedInEnergyGrid',
  'gridUsedEnergy',
  'missedInverterPower',
  'missedFeedInPowerGrid',
  'lossesUnloadBattery',
  'lossesLoadBattery',
  'lossesPvGeneration',
  'losses',
]

const baseParams = {
  batterySocMax: 10000,
  batterySocMin: 1000,
  batteryEfficiency: 0.99,
  regressionDb,
}

// The energy flow uses a statistical consumption model (regression) and an
// inverter efficiency curve, so the results are checked against physical
// invariants instead of exact values.
const expectConsistentResult = (params, data) => {
  NUMERIC_KEYS.forEach((key) => {
    expect(Number.isFinite(data[key])).toBe(true)
    expect(data[key]).toBeGreaterThanOrEqual(-1e-9)
  })
  expect(data.selfUsedEnergy + data.gridUsedEnergy).toBeCloseTo(
    params.energyConsumption,
    6,
  )
  expect(data.selfUsedEnergy).toBeLessThanOrEqual(
    params.energyConsumption + 1e-9,
  )
  // generation is used, stored, fed in, curtailed or lost
  expect(
    data.missedInverterPower +
      data.selfUsedEnergyPV +
      data.lossesPvGeneration +
      data.batteryCharge +
      data.feedInEnergyGrid +
      data.missedFeedInPowerGrid,
  ).toBeCloseTo(params.energyGeneration, 6)
  // battery: charged minus losses minus discharged equals the change of the SoC
  expect(
    params.batterySoc +
      data.batteryCharge -
      data.lossesLoadBattery -
      data.batteryDischarge,
  ).toBeCloseTo(data.newBatterySoc, 6)
  expect(data.newBatterySoc).toBeLessThanOrEqual(params.batterySocMax + 1e-9)
  if (params.batterySoc >= params.batterySocMin) {
    expect(data.newBatterySoc).toBeGreaterThanOrEqual(
      params.batterySocMin - 1e-9,
    )
  }
}

describe('energyFlow', () => {
  test('pv generation is more than consumption, battery is loading', () => {
    const params = {
      ...baseParams,
      energyGeneration: 5000,
      energyConsumption: 4000,
      batterySoc: 5000,
    }
    const data = energyFlow(params)
    expectConsistentResult(params, data)
    expect(data.newBatterySoc).toBeGreaterThan(params.batterySoc)
    expect(data.feedInEnergyGrid).toBe(0)
    expect(data.selfUsedEnergy).toBeGreaterThan(3500)
  })

  test('no consumption: generation is stored, the rest is fed in', () => {
    const params = {
      ...baseParams,
      energyGeneration: 5000,
      energyConsumption: 0,
      batterySoc: 5000,
      batterySocMax: 8000,
    }
    const data = energyFlow(params)
    expectConsistentResult(params, data)
    expect(data.newBatterySoc).toBeCloseTo(8000, 6)
    // charging 3000 Wh into the battery needs 3000 / 0.99 Wh
    expect(data.feedInEnergyGrid).toBeCloseTo(5000 - 3000 / 0.99, 6)
    expect(data.selfUsedEnergy).toBe(0)
    expect(data.gridUsedEnergy).toBe(0)
  })

  test('no consumption and no generation keeps the battery state', () => {
    const params = {
      ...baseParams,
      energyGeneration: 0,
      energyConsumption: 0,
      batterySoc: 4000,
    }
    const data = energyFlow(params)
    expectConsistentResult(params, data)
    expect(data.newBatterySoc).toBe(4000)
    expect(data.feedInEnergyGrid).toBe(0)
  })

  test('max battery load power limits the charging, the rest is fed in', () => {
    const params = {
      ...baseParams,
      energyGeneration: 5000,
      energyConsumption: 0,
      batterySoc: 5000,
      maxPowerLoadBattery: 2000,
    }
    const data = energyFlow(params)
    expectConsistentResult(params, data)
    // 2000 Wh charging power, 99 % of it is stored
    expect(data.newBatterySoc).toBeCloseTo(5000 + 2000 * 0.99, 6)
    expect(data.feedInEnergyGrid).toBeCloseTo(3000, 6)
  })

  test('max battery load power limits the charging with consumption', () => {
    const params = {
      ...baseParams,
      energyGeneration: 5000,
      energyConsumption: 1000,
      batterySoc: 5000,
      maxPowerLoadBattery: 500,
    }
    const data = energyFlow(params)
    expectConsistentResult(params, data)
    expect(data.newBatterySoc).toBeLessThanOrEqual(5000 + 500 * 0.99 + 1e-9)
    expect(data.feedInEnergyGrid).toBeGreaterThan(0)
  })

  test('pv generation is more than inverter max power generation', () => {
    const params = {
      ...baseParams,
      energyGeneration: 5000,
      energyConsumption: 4000,
      batterySoc: 5000,
      maxPowerGenerationInverter: 4500,
    }
    const data = energyFlow(params)
    expectConsistentResult(params, data)
    expect(data.missedInverterPower).toBe(500)
    expect(data.powerProduction).toBe(5000)
  })

  test('battery is full, power is fed in', () => {
    const params = {
      ...baseParams,
      energyGeneration: 5000,
      energyConsumption: 4000,
      batterySoc: 10000,
    }
    const data = energyFlow(params)
    expectConsistentResult(params, data)
    expect(data.newBatterySoc).toBe(10000)
    expect(data.feedInEnergyGrid).toBeGreaterThan(0)
  })

  test('battery is full, feed in is limited by max feed in power', () => {
    const params = {
      ...baseParams,
      energyGeneration: 5000,
      energyConsumption: 0,
      batterySoc: 10000,
      maxPowerFeedIn: 3000,
    }
    const data = energyFlow(params)
    expectConsistentResult(params, data)
    expect(data.feedInEnergyGrid).toBe(3000)
    // fed in directly, without battery losses
    expect(data.missedFeedInPowerGrid).toBeCloseTo(2000, 6)
  })

  test('pv generation is less than consumption, battery is discharging', () => {
    const params = {
      ...baseParams,
      energyGeneration: 1000,
      energyConsumption: 3000,
      batterySoc: 8000,
    }
    const data = energyFlow(params)
    expectConsistentResult(params, data)
    expect(data.selfUsedEnergyBattery).toBeGreaterThan(0)
    expect(data.newBatterySoc).toBeLessThan(params.batterySoc)
    expect(data.feedInEnergyGrid).toBe(0)
  })

  test('battery is not discharged below its minimum state of charge', () => {
    const params = {
      ...baseParams,
      energyGeneration: 0,
      energyConsumption: 3000,
      batterySoc: 1500,
    }
    const data = energyFlow(params)
    expectConsistentResult(params, data)
    expect(data.newBatterySoc).toBeCloseTo(1000, 6)
    expect(data.selfUsedEnergyBattery).toBeCloseTo(500 * 0.99, 6)
  })

  test('battery is empty, consumption from grid', () => {
    const params = {
      ...baseParams,
      energyGeneration: 0,
      energyConsumption: 3000,
      batterySoc: 1000,
    }
    const data = energyFlow(params)
    expectConsistentResult(params, data)
    expect(data.selfUsedEnergyBattery).toBe(0)
    expect(data.newBatterySoc).toBe(1000)
  })

  test('very high consumption without regression entry', () => {
    const params = {
      ...baseParams,
      energyGeneration: 3000,
      energyConsumption: 50000,
      batterySoc: 5000,
    }
    const data = energyFlow(params)
    expectConsistentResult(params, data)
  })

  test('a full year with real PVGIS data stays consistent', () => {
    let batterySoc = baseParams.batterySocMin
    Object.entries(normalizedHR).forEach(([dayTime, { P }], i) => {
      const params = {
        ...baseParams,
        energyGeneration: P,
        // includes hours without consumption
        energyConsumption: i % 24 === 3 ? 0 : 200 + (i % 7) * 150,
        batterySoc,
        dayTime,
      }
      const data = energyFlow(params)
      expectConsistentResult(params, data)
      batterySoc = data.newBatterySoc
    })
  })
})

describe('norm hourly radiation', () => {
  test('result is an object', () => {
    expect(typeof normalizedHR).toBe('object')
  })
  test('all results is are object', () => {
    ;[normalizedHR, normalizedHR2].forEach((e) => {
      expect(typeof e).toBe('object')
    })
  })
  test('results should be the right length in leap year 2020', () => {
    expect(Object.keys(normalizedHR).length).toBe(366 * 24)
  })
  test('results conatain the right power generation', () => {
    // {
    //     "time": "20200308:1310",
    //     "P": 1365630.0,
    //     "G(i)": 549.35,
    //     "H_sun": 36.12,
    //     "T2m": 12.84,
    //     "WS10m": 0.69,
    //     "Int": 0.0
    //   },
    expect(normalizedHR['20200308:13'].P).toBe(3065.16)
  })
})

describe('merge powergeneration arrays', () => {
  const result = mergePowerGeneration([normalizedHR, normalizedHR2])
  const oneResult = mergePowerGeneration([normalizedHR])

  // normalizedHR.map(obj => console.log(obj['20200515:14']))

  test('merge only one power generation object', () => {
    expect(typeof oneResult).toBe('object')
  })
  test('merge only one power generation object, find one key', () => {
    expect(oneResult['20200308:13']).toEqual({ P: 3065.16, temperature: 12.84 })
    expect(result['20200308:13']).toEqual({ P: 5861.82, temperature: 12.84 })
  })
  test('result is an object', () => {
    expect(typeof result).toBe('object')
  })
  test('check  object key length', () => {
    expect(Object.keys(result).length).toBe(8784)
  })
  test('an key exist', () => {
    expect(typeof result['20200515:14']).toBe('object')
  })
  test('the summarized value af key is correct', () => {
    expect(result['20200515:14'].P).toBe(7332.96)
  })
})

// describe.skip('integration tests energyFlow', () => {
//     const consumption = calculateConsumption(loadProfile, 2020, 4500)
//     const mergedPowerGeneration = mergePowerGeneration(normalizedHR)
//     const dayTimeOrder = generateDayTimeOrder(2020)

//     test('test one energy flow result', () => {

//         const dayTime = '20200518:18'
//         // console.log(consumption[dayTime])
//         const result = energyFlow({
//             energyGeneration: mergedPowerGeneration[dayTime].P, //473.34000000000003
//             energyConsumption: consumption[dayTime].P, //3093.3675000000003
//             batterySoc:5000,
//             batterySocMax: 10000,
//             batterySocMin: 100,
//             batteryEfficiency: .99,
//         })
//         expect(consumption[dayTime].P).toBe(3093.3675000000003)
//         expect(mergedPowerGeneration[dayTime].P).toBe(473.34000000000003)
//         expect(result).toEqual({
//                "batteryLoad": -4900,
//                "gridUsedEnergy": 1515.9696969696975,
//                "feedInEnergyGrid": 0,
//                "missedBatteryPower": 0,
//                "missedFeedInPowerGrid": 0,
//                "missedInverterPower": 0,
//                "newBatterySoc": 100,
//                "selfUsedEnergy": 5373.34,
//                "selfUsedEnergyBattery": 4900,
//                "selfUsedEnergyPv": 473.34000000000003,
//              })

//     })

//     test('test a year in energy flow', () => {

//         let yearSum = {
//             "batteryLoad": 0,
//             "gridUsedEnergy": 0,
//             "feedInEnergyGrid": 0,
//             "missedBatteryPower": 0,
//             "missedFeedInPowerGrid": 0,
//             "missedInverterPower": 0,
//             "newBatterySoc": 0,
//             "selfUsedEnergy": 0,
//             "selfUsedEnergyBattery": 0,
//             "selfUsedEnergyPv": 0,
//         }

//         dayTimeOrder.forEach(key => {

//             const result = energyFlow({
//                 energyGeneration: mergedPowerGeneration[key].P,
//                 energyConsumption: consumption[key].P,
//                 batterySoc: yearSum.newBatterySoc,
//                 batterySocMax: 20000,
//                 batterySocMin: 100,
//                 batteryEfficiency: .99,
//             })

//             yearSum.batteryLoad = yearSum.batteryLoad + result.batteryLoad
//             yearSum.gridUsedEnergy = yearSum.consumptionGrid + result.consumptionGrid
//             yearSum.feedInEnergyGrid = yearSum.feedInPowerGrid + result.feedInPowerGrid
//             yearSum.missedBatteryPower = yearSum.missedBatteryPower + result.missedBatteryPower
//             yearSum.missedFeedInPowerGrid = yearSum.missedFeedInPowerGrid + result.missedFeedInPowerGrid
//             yearSum.missedInverterPower = yearSum.missedInverterPower + result.missedInverterPower
//             yearSum.selfUsedEnergy = yearSum.selfUsagePower + result.selfUsagePower
//             yearSum.selfUsedEnergyBattery = yearSum.selfUsedEnergyBattery + result.selfUsagePowerBattery
//             yearSum.selfUsedEnergyPv = yearSum.selfUsedEnergyPV + result.selfUsagePowerPv
//             yearSum.newBatterySoc = result.newBatterySoc

//         })
//         // expect(mergedPowerGeneration[dayTime].P).toBe(207450)
//         // expect(consumption[dayTime].P).toBe(6874.150000000001)
//         expect(yearSum).toEqual({
//                "batteryLoad": 100,
//                "gridUsedEnergy": 7017443.115791865,
//                "feedInEnergyGrid": 3488849.343801145,
//                "missedBatteryPower": 0,
//                "missedFeedInPowerGrid": 0,
//                "missedInverterPower": 0,
//                "newBatterySoc": 100,
//                "selfUsedEnergy": 12522855.128756072,
//                "selfUsedEnergyBattery": 5269271.398256048,
//                "selfUsedEnergyPv": 7253583.730499969
//              })

//     })

// })

describe('calcHourWithLoadDistribution', () => {
  const hour = (params) =>
    calcHourWithLoadDistribution({
      regressionDb,
      batterySoc: 0,
      batterySocMin: 0,
      batterySocMax: 0,
      ...params,
    })

  test('large PV covers the whole consumption (previously ~25 % from grid)', () => {
    const data = hour({ energyConsumption: 500, staticPowerGeneration: 10000 })
    expect(data.selfUsedEnergyPV).toBeCloseTo(500, 6)
    expect(data.gridUsedEnergy).toBeCloseTo(0, 6)
  })

  test('also for consumption above the regression database', () => {
    const data = hour({ energyConsumption: 8000, staticPowerGeneration: 60000 })
    expect(data.selfUsedEnergyPV).toBeCloseTo(8000, 6)
  })

  test('PV below the smallest load level is used completely', () => {
    const data = hour({ energyConsumption: 1500, staticPowerGeneration: 50 })
    // a tiny share of the hour has a load below 50 W
    expect(data.selfUsedEnergyPV + data.lossesPvGeneration).toBeCloseTo(50, 1)
    expect(data.feedInEnergyGrid).toBeLessThan(0.05)
  })

  test('load peaks above the PV power come from the grid', () => {
    const data = hour({ energyConsumption: 500, staticPowerGeneration: 500 })
    expect(data.gridUsedEnergy).toBeGreaterThan(0)
    expect(data.feedInEnergyGrid).toBeGreaterThan(0)
  })

  test('more PV never reduces the self consumption', () => {
    for (const energyConsumption of [100, 500, 1500, 3000]) {
      let previous = 0
      for (let pv = 0; pv <= 20000; pv += 250) {
        const { selfUsedEnergyPV } = hour({
          energyConsumption,
          staticPowerGeneration: pv,
        })
        expect(selfUsedEnergyPV).toBeGreaterThanOrEqual(previous - 1e-9)
        expect(selfUsedEnergyPV).toBeLessThanOrEqual(energyConsumption + 1e-9)
        previous = selfUsedEnergyPV
      }
    }
  })

  test('the battery covers the peaks only up to its discharge power', () => {
    const limited = hour({
      energyConsumption: 1500,
      staticPowerGeneration: 0,
      batterySoc: 10000,
      batterySocMax: 10000,
      maxPowerDynamicInverter: 300,
    })
    expect(limited.batteryDischarge).toBeLessThanOrEqual(300 + 1e-9)
    const unlimited = hour({
      energyConsumption: 1500,
      staticPowerGeneration: 0,
      batterySoc: 10000,
      batterySocMax: 10000,
    })
    expect(unlimited.batteryDischarge).toBeCloseTo(1500, 6)
  })
})
