const axios = require('axios')
const {
  energyFlow,
  normalizeHourlyRadiation,
  mergePowerGeneration,
  generateDayTimeValues,
  calculateConsumption,
} = require('./energyFlow')
const { SLPH0, PROFILEBASE, factorFunction } = require('./SLP')

const string1url =
  'https://re.jrc.ec.europa.eu/api/v5_2/seriescalc?lat=45&lon=8&outputformat=json&startyear=2020&endyear=2020&pvcalculation=1&peakpower=10&loss=12&angle=25&aspect=0'
const string2url =
  'https://re.jrc.ec.europa.eu/api/v5_2/seriescalc?lat=45&lon=8&outputformat=json&startyear=2020&endyear=2020&pvcalculation=1&peakpower=5&loss=12&angle=35&aspect=-90'

describe.skip('intertation', () => {
  let results1,
    results2,
    consumption,
    normResult1,
    normResult2,
    mergedPower,
    powerGenAndConsumption

  beforeAll(async () => {
    jest.setTimeout(10000)
    results1 = await axios.get(string1url).then((res) => res.data)
    results2 = await axios.get(string2url).then((res) => res.data)
    normResult1 = normalizeHourlyRadiation(results1.outputs.hourly)
    normResult2 = normalizeHourlyRadiation(results2.outputs.hourly)
    mergedPower = mergePowerGeneration([normResult1, normResult2])

    consumption = calculateConsumption({
      year: 2020,
      consumptionYear: 6000,
      profile: SLPH0,
      profileBase: PROFILEBASE,
      factorFunction,
    })
    powerGenAndConsumption = generateDayTimeValues({
      consumption,
      powerGeneration: mergedPower,
      year: 2020,
    })
  })

  test('get data from PVGis seariescalc', async () => {
    expect(results1.outputs.hourly.length).toBe(8784) //leap year
    expect(results2.outputs.hourly.length).toBe(8784) //leap year
  })

  test('normalize hour radiation data', () => {
    expect(Object.keys(normResult1).length).toBe(8784)
    expect(Object.keys(normResult2).length).toBe(8784)
  })
  test('normalize hour radiation values', () => {
    expect(normResult1['20200405:14'].P).toBe(6324.3)
    expect(normResult2['20200405:14'].P).toBe(558.6)
  })
  test('consumption calculation length of hours in year', () => {
    expect(Object.keys(consumption).length).toBe(8784)
  })
  test('consumption calculation value of one hour in year', () => {
    expect(consumption['20200405:14'].P).toBe(885.0214310934527)
  })
  test('merged power generation data', () => {
    expect(Object.keys(mergedPower).length).toBe(8784)
  })
  test.skip('merged power generation value check', () => {
    expect(mergedPower['20200405:14'].P).toBe(6324.3 + 558.6)
  })
  test.skip('merged power generation per year value check', () => {
    const powGenYear =
      Object.values(mergedPower).reduce((prev, curr) => prev + curr.P, 0) / 1000

    expect(powGenYear).toBe(19321.388949999968) // 19T kWh with 15kWp (italy, near Turin)
  })

  test('day/time values are also in merged power generation, check length', () => {
    expect(powerGenAndConsumption.length).toBe(8784)
  })
  test('day/time values are also in merged power generation', () => {
    expect(
      powerGenAndConsumption.find((v) => v.dayTime == '20200405:14'),
    ).toEqual({
      dayTime: '20200405:14',
      P: 6324.3 + 558.6,
      consumption: 885.0214310934527,
      temperature: 17.76,
    })
  })
  test('energyFlow with real data on one day', () => {
    const genConsumption = powerGenAndConsumption.find(
      (v) => v.dayTime == '20200405:14',
    )

    const energyFlowData = energyFlow({
      powerGeneration: genConsumption.P,
      powerConsumption: genConsumption.consumption,
      batterySoc: 5000,
      batterySocMax: 15000,
      batterySocMin: 100,
    })

    expect(energyFlowData).toMatchObject({
      batteryLoad: 6324.3 + 558.6 - 885.0214310934527,
      consumptionGrid: 0,
      feedInPowerGrid: 0,
      missedBatteryPower: 0,
      missedFeedInPowerGrid: 0,
      missedInverterPower: 0,
      newBatterySoc: 5000 + 6324.3 + 558.6 - 885.0214310934527 + 0.000000000002, // rounding difference
      selfUsagePower: 885.0214310934527,
      selfUsagePowerBattery: 0,
      selfUsagePowerPv: 885.0214310934527,
    })
  })
  test('energyFlow calc year consumption and geeneration', () => {
    let newSoc = 5000
    const energyFlowData = powerGenAndConsumption.map((genConsumption) => {
      const hourFlow = energyFlow({
        powerGeneration: genConsumption.P,
        powerConsumption: genConsumption.consumption,
        batterySoc: newSoc,
        batterySocMax: 5000,
        batterySocMin: 100,
      })
      newSoc = hourFlow.newBatterySoc
      return hourFlow
    })

    const generationYear =
      energyFlowData.reduce(
        (prev, curr) => curr.selfUsagePower + curr.feedInPowerGrid + prev,
        0,
      ) / 1000
    const consumptionYear =
      energyFlowData.reduce(
        (prev, curr) => curr.selfUsagePower + curr.consumptionGrid + prev,
        0,
      ) / 1000

    expect(
      generationYear > 19000 * 0.9 && generationYear < 19000 * 1.1,
    ).toEqual(true)
    expect(
      consumptionYear > 6000 * 0.9 && consumptionYear < 6000 * 1.1,
    ).toEqual(true)
  })
})
