const {
  energyFlow,
  calculateConsumption,
  normalizeHourlyRadiation,
  mergePowerGeneration,
} = require('./energyFlow')

const seriescalc = require('./seriescalc.json')
const seriescalc2 = require('./seriescalc2.json')

const normalizedHR = normalizeHourlyRadiation(seriescalc.outputs.hourly)
const normalizedHR2 = normalizeHourlyRadiation(seriescalc2.outputs.hourly)

const regressionDb = require('./regression.json')

describe('testNormalize function', () => {
  test('check P and temperature values', () => {
    expect(Object.keys(normalizedHR).length).toBe(8784)
    expect(normalizedHR['20200505:15']).toEqual({
      P: 3443.82,
      temperature: 22.81,
    })
  })
})

describe('PV > Consumption', () => {
  test('pv generation is more than consumption, battery is loading', () => {
    const data = energyFlow({
      energyGeneration: 5000,
      energyConsumption: 4000,
      batterySoc: 5000,
      batterySocMax: 10000,
      batterySocMin: 100,
      batteryEfficiency: 0.99,
      regressionDb,
    })
    expect(data).toEqual({
      newBatterySoc: 1000 * 0.99 + 5000,
      selfUsedEnergy: 4000,
      selfUsedEnergyPv: 4000,
      selfUsedEnergyBattery: 0,
      feedInEnergyGrid: 0,
      batteryLoad: 1000 * 0.99,
      gridUsedEnergy: 0,
      missedInverterPower: 0,
      missedBatteryPower: 0,
      missedFeedInPowerGrid: 0,
      dayTime: '',
    })
  })

  test('pv generation is more than consumption, max battery power load is lower than generation and split in feed in and load', () => {
    const data = energyFlow({
      energyGeneration: 5000,
      energyConsumption: 0,
      batterySoc: 5000,
      batterySocMax: 8000,
      batterySocMin: 100,
      batteryEfficiency: 0.99,
      maxPowerLoadBattery: 2000,
      regressionDb,
    })
    expect(data).toEqual({
      newBatterySoc: 2000 + 5000,
      selfUsedEnergy: 0,
      selfUsedEnergyPv: 0,
      selfUsedEnergyBattery: 0,
      feedInEnergyGrid: 3000 * 0.99,
      batteryLoad: 2000,
      gridUsedEnergy: 0,
      missedInverterPower: 0,
      missedBatteryPower: 0,
      missedFeedInPowerGrid: 0,
      dayTime: '',
    })
  })

  test('pv generation is more than consumption, max battery power load is lower than generation, only load in battery', () => {
    const data = energyFlow({
      energyGeneration: 5000,
      energyConsumption: 2000,
      batterySoc: 5000,
      batterySocMax: 8000,
      batterySocMin: 100,
      batteryEfficiency: 0.99,
      maxPowerLoadBattery: 2000,
    })
    expect(data).toEqual({
      newBatterySoc: 2000 + 5000,
      selfUsedEnergy: 2000,
      selfUsedEnergyPv: 2000,
      selfUsedEnergyBattery: 0,
      feedInEnergyGrid: 1000 * 0.99,
      batteryLoad: 2000,
      gridUsedEnergy: 0,
      missedInverterPower: 0,
      missedBatteryPower: 0,
      missedFeedInPowerGrid: 0,
      dayTime: '',
    })
  })

  test('pv generation is more than inverter max power generation', () => {
    const data = energyFlow({
      energyGeneration: 5000,
      energyConsumption: 4000,
      batterySoc: 5000,
      batterySocMax: 10000,
      batterySocMin: 100,
      batteryEfficiency: 0.99,
      maxPowerGenerationInverter: 4500,
      regressionDb,
    })
    expect(data).toEqual({
      newBatterySoc: 500 * 0.99 + 5000,
      selfUsedEnergy: 4000,
      selfUsedEnergyPv: 4000,
      selfUsedEnergyBattery: 0,
      feedInEnergyGrid: 0,
      batteryLoad: 500 * 0.99,
      gridUsedEnergy: 0,
      missedInverterPower: 500,
      missedBatteryPower: 0,
      missedFeedInPowerGrid: 0,
      dayTime: '',
    })
  })

  test('pv generation is more than consumption, battery load efficiency diff than unload', () => {
    const data = energyFlow({
      energyGeneration: 5000,
      energyConsumption: 4000,
      batterySoc: 5000,
      batterySocMax: 10000,
      batterySocMin: 100,
      batteryLoadEfficiency: 0.95,
      batteryEfficiency: 0.99, // unload as default
      regressionDb,
    })
    expect(data).toEqual({
      newBatterySoc: 1000 * 0.95 + 5000,
      selfUsedEnergy: 4000,
      selfUsedEnergyPv: 4000,
      selfUsedEnergyBattery: 0,
      feedInEnergyGrid: 0,
      batteryLoad: 1000 * 0.95,
      gridUsedEnergy: 0,
      missedInverterPower: 0,
      missedBatteryPower: 0,
      missedFeedInPowerGrid: 0,
      dayTime: '',
    })
  })

  test('pv generation is more than consumption, battery is full, power is feed in', () => {
    const data = energyFlow({
      energyGeneration: 5000,
      energyConsumption: 4000,
      batterySoc: 5000,
      batterySocMax: 5000,
      batterySocMin: 100,
      batteryEfficiency: 0.99,
      regressionDb,
    })
    expect(data).toEqual({
      newBatterySoc: 5000,
      selfUsedEnergy: 4000,
      selfUsedEnergyPv: 4000,
      selfUsedEnergyBattery: 0,
      feedInEnergyGrid: 1000,
      batteryLoad: 0,
      gridUsedEnergy: 0,
      missedInverterPower: 0,
      missedBatteryPower: 0,
      missedFeedInPowerGrid: 0,
      dayTime: '',
    })
  })
  test('pv generation is more than consumption, battery is full, power is feed in, max feedin power less then generation', () => {
    const data = energyFlow({
      energyGeneration: 5000,
      energyConsumption: 2000,
      batterySoc: 5000,
      batterySocMax: 5000,
      batterySocMin: 100,
      batteryEfficiency: 0.99,
      maxPowerFeedIn: 2000,
      regressionDb,
    })
    expect(data).toEqual({
      newBatterySoc: 5000,
      selfUsedEnergy: 2000,
      selfUsedEnergyPv: 2000,
      selfUsedEnergyBattery: 0,
      feedInEnergyGrid: 2000,
      batteryLoad: 0,
      gridUsedEnergy: 0,
      missedInverterPower: 0,
      missedBatteryPower: 0,
      missedFeedInPowerGrid: 1000,
      dayTime: '',
    })
  })

  test('pv generation is more than consumption, battery will be fullfilled, diff power is feed in', () => {
    const data = energyFlow({
      energyGeneration: 5000,
      energyConsumption: 4000,
      batterySoc: 5000,
      batterySocMax: 5500,
      batterySocMin: 100,
      batteryEfficiency: 0.99,
      regressionDb,
    })
    expect(data).toEqual({
      newBatterySoc: 5500,
      selfUsedEnergy: 4000,
      selfUsedEnergyPv: 4000,
      selfUsedEnergyBattery: 0,
      feedInEnergyGrid: 500 * 0.99,
      batteryLoad: 500,
      gridUsedEnergy: 0,
      missedInverterPower: 0,
      missedBatteryPower: 0,
      missedFeedInPowerGrid: 0,
      dayTime: '',
    })
  })
})

describe('PV < Consumption', () => {
  test('pv generation is less than consumption, battery is discharging', () => {
    const data = energyFlow({
      energyGeneration: 5000,
      energyConsumption: 6000,
      batterySoc: 5000,
      batterySocMax: 10000,
      batterySocMin: 100,
      batteryEfficiency: 0.99,
      regressionDb,
    })
    expect(data).toEqual({
      newBatterySoc: 5000 - 1000 / 0.99,
      selfUsedEnergy: 6000,
      selfUsedEnergyPv: 5000,
      selfUsedEnergyBattery: 1000,
      feedInEnergyGrid: 0,
      batteryLoad: -1000 / 0.99,
      gridUsedEnergy: 0,
      missedInverterPower: 0,
      missedBatteryPower: 0,
      missedFeedInPowerGrid: 0,
      dayTime: '',
    })
  })

  test('pv generation is less than consumption, battery is discharging, Batterypower is lower then consumption', () => {
    const data = energyFlow({
      energyGeneration: 3000,
      energyConsumption: 6000,
      batterySoc: 5000,
      batterySocMax: 10000,
      batterySocMin: 100,
      batteryEfficiency: 0.99,
      maxPowerGenerationBattery: 1000,
      regressionDb,
    })
    expect(data).toEqual({
      newBatterySoc: 5000 - 1000 / 0.99,
      selfUsedEnergy: 4000,
      selfUsedEnergyPv: 3000,
      selfUsedEnergyBattery: 1000,
      feedInEnergyGrid: 0,
      batteryLoad: -1000 / 0.99,
      gridUsedEnergy: 2000,
      missedInverterPower: 0,
      missedBatteryPower: 0,
      missedFeedInPowerGrid: 0,
      dayTime: '',
    })
  })

  test('pv generation is less than consumption, battery is discharging, Batterypower is lower then consumption, battery will be empty', () => {
    const data = energyFlow({
      energyGeneration: 3000,
      energyConsumption: 6000,
      batterySoc: 3000,
      batterySocMax: 10000,
      batterySocMin: 100,
      batteryEfficiency: 0.99,
      maxPowerGenerationBattery: 1000,
      regressionDb,
    })
    expect(data).toEqual({
      newBatterySoc: 3000 - 1000 / 0.99,
      selfUsedEnergy: 4000,
      selfUsedEnergyPv: 3000,
      selfUsedEnergyBattery: 1000,
      feedInEnergyGrid: 0,
      batteryLoad: -1000 / 0.99,
      gridUsedEnergy: 2000,
      missedInverterPower: 0,
      missedBatteryPower: 0,
      missedFeedInPowerGrid: 0,
      dayTime: '',
    })
  })

  test('pv generation is less than consumption, battery unload efficiency is differnt then load', () => {
    const data = energyFlow({
      energyGeneration: 5000,
      energyConsumption: 6000,
      batterySoc: 5000,
      batterySocMax: 10000,
      batterySocMin: 100,
      batteryEfficiency: 0.99,
      batteryUnloadEfficiency: 0.8,
      regressionDb,
    })
    expect(data).toEqual({
      newBatterySoc: 5000 - 1000 / 0.8,
      selfUsedEnergy: 6000,
      selfUsedEnergyPv: 5000,
      selfUsedEnergyBattery: 1000,
      feedInEnergyGrid: 0,
      batteryLoad: -1000 / 0.8,
      gridUsedEnergy: 0,
      missedInverterPower: 0,
      missedBatteryPower: 0,
      missedFeedInPowerGrid: 0,
      dayTime: '',
    })
  })

  test('pv generation is less than consumption, battery is empty, cunsumpion from grid', () => {
    const data = energyFlow({
      energyGeneration: 5000,
      energyConsumption: 6000,
      batterySoc: 100,
      batterySocMax: 10000,
      batterySocMin: 100,
      batteryEfficiency: 0.99,
      regressionDb,
    })
    expect(data).toEqual({
      newBatterySoc: 100,
      selfUsedEnergy: 5000,
      selfUsedEnergyPv: 5000,
      selfUsedEnergyBattery: 0,
      feedInEnergyGrid: 0,
      batteryLoad: 0,
      gridUsedEnergy: 1000,
      missedInverterPower: 0,
      missedBatteryPower: 0,
      missedFeedInPowerGrid: 0,
      dayTime: '',
    })
  })

  test('pv generation is less than consumption, battery is nearly empty, diff cunsumpion from grid', () => {
    const data = energyFlow({
      energyGeneration: 5000,
      energyConsumption: 6000,
      batterySoc: 1000,
      batterySocMax: 10000,
      batterySocMin: 500,
      batteryEfficiency: 0.99,
      regressionDb,
    })
    expect(data).toEqual({
      newBatterySoc: 500,
      selfUsedEnergy: 5500,
      selfUsedEnergyPv: 5000,
      selfUsedEnergyBattery: 500,
      feedInEnergyGrid: 0,
      batteryLoad: -500,
      gridUsedEnergy: 500 / 0.99,
      missedInverterPower: 0,
      missedBatteryPower: 0,
      missedFeedInPowerGrid: 0,
      dayTime: '',
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
