const { calcHeatingTempMap, calcHeatEfficiencyMap } = require('./calcHeatpump')

describe('calculate heating temperature', () => {
  test('test failure input parameters', () => {
    expect(() => calcHeatingTempMap({ tempMap: 1 })).toThrow(
      'maxHeatTemp not given',
    )
    expect(() => calcHeatingTempMap({ maxHeatTemp: 15 })).toThrow(
      'tempMap is not given',
    )
    expect(() =>
      calcHeatingTempMap({ maxHeatTemp: 15, tempMap: 'text' }),
    ).toThrow('tempMap is not an array')
    expect(() => calcHeatingTempMap({ maxHeatTemp: 15, tempMap: [] })).toThrow(
      'tempMap length must be greater then 0',
    )
    expect(() =>
      calcHeatingTempMap({ maxHeatTemp: 15, tempMap: ['text'] }),
    ).toThrow('tempMap elements must be also an array')
    expect(() =>
      calcHeatingTempMap({ maxHeatTemp: 15, tempMap: [[1]] }),
    ).toThrow('tempMap elements must be also an array with the length of 2')
  })
  test('test temp calculations', () => {
    const calc = calcHeatingTempMap({
      minHeatTemp: -25,
      maxHeatTemp: 18,
      tempMap: [
        [-20, 50],
        [-10, 40],
        [10, 30],
        [15, 26],
      ],
    })
    expect(calc[2]).toBe(34)
  })
})

describe('calculate efficiency Map', () => {
  test('test failure input parameters', () => {
    expect(() => calcHeatEfficiencyMap({})).toThrow('maxHeatTemp not given')
    expect(() => calcHeatEfficiencyMap({ maxHeatTemp: 3 })).toThrow(
      'minHeatTemp not given',
    )
    expect(() =>
      calcHeatEfficiencyMap({ maxHeatTemp: 3, minHeatTemp: 4 }),
    ).toThrow('maxTargetTemp not given')
    expect(() =>
      calcHeatEfficiencyMap({
        maxHeatTemp: 3,
        minHeatTemp: 4,
        maxTargetTemp: 4,
      }),
    ).toThrow('minTargetTemp not given')
    expect(() =>
      calcHeatEfficiencyMap({
        maxHeatTemp: 3,
        minHeatTemp: 4,
        maxTargetTemp: 4,
        minTargetTemp: 4,
      }),
    ).toThrow('efficiencyMap is not given')
    expect(() =>
      calcHeatEfficiencyMap({
        maxHeatTemp: 3,
        minHeatTemp: 4,
        maxTargetTemp: 4,
        minTargetTemp: 4,
        efficiencyMap: 33,
      }),
    ).toThrow('efficiencyMap is not an array')
    expect(() =>
      calcHeatEfficiencyMap({
        minHeatTemp: -25,
        maxHeatTemp: 18,
        minTargetTemp: 30,
        maxTargetTemp: 55,
        efficiencyMap: [
          [-7, 35, 3.14],
          [-7, 55, 2.13],
        ],
      }),
    ).toThrow(
      'efficiencyMap need two efficiency values with same heat temprature',
    )
    expect(() =>
      calcHeatEfficiencyMap({
        minHeatTemp: -25,
        maxHeatTemp: 18,
        minTargetTemp: 30,
        maxTargetTemp: 55,
        efficiencyMap: [
          [-7, 35, 3.14],
          [2, 35, 4.61],
        ],
      }),
    ).toThrow('efficiencyMap need two efficiency values with same temprature')
  })
  test('test efficiency calculations', () => {
    const calc = calcHeatEfficiencyMap({
      minHeatTemp: -10,
      maxHeatTemp: 10,
      minTargetTemp: 39,
      maxTargetTemp: 40,
      efficiencyMap: [
        [2, 35, 4.61],
        [-7, 55, 2.13],
        [-7, 35, 3.14],
      ],
    })
    // const calc = calcHeatEfficiencyMap({minHeatTemp: -10, maxHeatTemp: 10, minTargetTemp:39, maxTargetTemp:40, efficiencyMap:[[-7,35,3.14], [-7,55,2.13], [2,35,4.61]] } )

    expect(calc['39']['-2']).toBe(3.6418333333333335)
  })
})

describe('calculate needed heat per day', () => {
  test('', () => {})
})
