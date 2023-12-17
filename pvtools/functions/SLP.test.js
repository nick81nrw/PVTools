const { SLPH0, PROFILEBASE, factorFunction } = require('./SLP')
const calcProfile = require('./calcProfile')

describe('test SPL functions', () => {
  const results = calcProfile({
    year: 2021,
    consumptionYear: 5000,
    profile: SLPH0,
    profileBase: PROFILEBASE,
  })
  test('results length are as long then the year', () => {
    expect(Object.keys(results).length).toBe(365 * 24)
  })
  test('results length are as long then the year in leap year', () => {
    const results = calcProfile({
      year: 2016,
      consumptionYear: 5000,
      profile: SLPH0,
      profileBase: PROFILEBASE,
    })
    expect(Object.keys(results).length).toBe(366 * 24)
  })
  test('one result should be ab object', () => {
    expect(typeof results).toBe('object')
  })
  test('one result should have the following key and value', () => {
    const results = calcProfile({
      year: 1996,
      consumptionYear: 5000,
      profile: SLPH0,
      profileBase: PROFILEBASE,
      factorFunction,
    })

    expect(results['19960601:02'].P.toFixed(5)).toBe(
      (45.840113499345804 * 5).toFixed(5),
    )
  })
  test('full powerconsumption of is near the input consumption with max 1% defference', () => {
    const power = Object.values(results).reduce(
      (prev, curr) => prev + curr.P,
      0,
    )

    expect(power > 5000 * 1000 * 0.9 && power < 5000 * 1000 * 1.1).toBeTruthy()
  })
})
