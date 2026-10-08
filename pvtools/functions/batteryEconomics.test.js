import { describe, expect, test } from 'vitest'
import {
  batteryPrice,
  batterySteps,
  compareSizes,
  offerSizes,
  rate,
  recommendationSentences,
  recommendBattery,
} from './batteryEconomics.js'

const prices = {
  consumptionCosts: 0.3,
  feedInCompensation: 0.08,
  batteryPriceMode: 'perKwh',
  batteryBaseCosts: 1000,
  batteryCostsPerKwh: 400,
  batteryLifetime: 15,
}

/** simulation result with the values the economics need */
const result = (size, gridUsedEnergy, fedInPower) => ({
  size,
  gridUsedEnergy,
  fedInPower,
  costSavings:
    (5000 - gridUsedEnergy) * prices.consumptionCosts +
    fedInPower * prices.feedInCompensation,
})

// 5.000 kWh consumption, the benefit gets smaller with every step
const sizes = [
  result(1, 3000, 6000),
  result(5000, 1800, 4800),
  result(10000, 1250, 4250),
  result(15000, 1110, 4110),
  result(20000, 1065, 4065),
]

describe('battery price', () => {
  test('base costs plus price per kWh', () => {
    expect(batteryPrice(5000, prices)).toBe(3000)
    expect(batteryPrice(1, prices)).toBe(0)
  })

  test('own offers have priority', () => {
    const input = {
      ...prices,
      batteryPriceMode: 'offers',
      batteryOffers: [
        { kwh: 10, price: 2500 },
        { kwh: 5, price: 1800 },
        { kwh: 15, price: 3100 },
      ],
    }
    expect(batteryPrice(5000, input)).toBe(1800)
    expect(batteryPrice(7500, input)).toBe(2150)
    expect(batteryPrice(2500, input)).toBe(900)
    expect(batteryPrice(20000, input)).toBe(3700)
    expect(offerSizes(input)).toEqual([5000, 10000, 15000])
  })

  test('offers are ignored in the price per kWh mode or when empty', () => {
    const offers = [{ kwh: 5, price: 1 }]
    expect(batteryPrice(5000, { ...prices, batteryOffers: offers })).toBe(3000)
    expect(
      batteryPrice(5000, {
        ...prices,
        batteryPriceMode: 'offers',
        batteryOffers: [{ kwh: '', price: 100 }],
      }),
    ).toBe(3000)
  })
})

describe('rating', () => {
  test('uses 2/3 of the lifetime and the lifetime as limits', () => {
    expect(rate(10, 15)).toBe('yes')
    expect(rate(10.1, 15)).toBe('borderline')
    expect(rate(15, 15)).toBe('borderline')
    expect(rate(15.1, 15)).toBe('no')
    expect(rate(Infinity, 15)).toBe('no')
    expect(rate(NaN, 15)).toBe('no')
  })
})

describe('steps', () => {
  test('one step per neighbouring sizes', () => {
    const steps = batterySteps(sizes, prices)
    expect(steps.map((step) => [step.from, step.to])).toEqual([
      [1, 5000],
      [5000, 10000],
      [10000, 15000],
      [15000, 20000],
    ])
    expect(steps[0]).toMatchObject({
      extraCosts: 3000,
      lessGrid: 1200,
      lessFeedIn: 1200,
    })
    // 1200 kWh × 0,30 € − 1200 kWh × 0,08 €
    expect(steps[0].extraSavings).toBeCloseTo(264, 6)
    expect(steps[0].payback).toBeCloseTo(3000 / 264, 6)
  })

  test('the benefit of a step shrinks for larger batteries', () => {
    const lessGrid = batterySteps(sizes, prices).map((step) => step.lessGrid)
    expect(lessGrid).toEqual([1200, 550, 140, 45])
  })

  test('T10: an extension without extra benefit is not economic', () => {
    const step = compareSizes(
      result(10000, 1250, 4250),
      result(15000, 1250, 4250),
      prices,
    )
    expect(step.extraSavings).toBe(0)
    expect(step.payback).toBe(Infinity)
    expect(step.rating).toBe('no')
  })

  test('never NaN, even without costs', () => {
    const free = { ...prices, batteryBaseCosts: 0, batteryCostsPerKwh: 0 }
    batterySteps(sizes, free).forEach((step) => {
      expect(Number.isNaN(step.payback)).toBe(false)
      expect(step.payback).toBe(0)
      expect(step.rating).toBe('yes')
    })
  })
})

describe('recommendation', () => {
  test('stops before the first step that does not pay back', () => {
    const cheap = { ...prices, batteryBaseCosts: 0, batteryCostsPerKwh: 200 }
    const recommendation = recommendBattery(sizes, cheap)
    // 5 → 10 kWh: 1.000 € for 121 €/a = 8,3 years; 10 → 15 kWh: 31 €/a
    expect(recommendation.size).toBe(10000)
    expect(recommendation.path.map((step) => step.to)).toEqual([5000, 10000])
    expect(recommendation.next).toMatchObject({ from: 10000, to: 15000 })
    expect(recommendation.next.rating).toBe('no')
  })

  test('may skip a size when only the larger step pays back', () => {
    // high base costs: 0 → 5 kWh does not pay back, 0 → 10 kWh does
    const input = { ...prices, batteryBaseCosts: 3000, batteryCostsPerKwh: 0 }
    const custom = [
      result(1, 3000, 6000),
      result(5000, 2900, 5900),
      result(10000, 1500, 4500),
    ]
    expect(recommendBattery(custom, input).size).toBe(10000)
  })

  test('no battery when nothing pays back', () => {
    const expensive = { ...prices, batteryCostsPerKwh: 2000 }
    const recommendation = recommendBattery(sizes, expensive)
    expect(recommendation.size).toBe(1)
    expect(recommendation.path).toEqual([])
    expect(recommendation.next.to).toBe(5000)
  })

  test('explains the decision in words', () => {
    const cheap = { ...prices, batteryBaseCosts: 0, batteryCostsPerKwh: 200 }
    expect(recommendationSentences(recommendBattery(sizes, cheap))).toEqual([
      'Die ersten 5 kWh Speicher sparen 1.200 kWh Netzbezug im Jahr und amortisieren sich nach 3,8 Jahren.',
      'Weitere 5 kWh (auf 10 kWh) bringen noch 550 kWh und amortisieren sich nach 8,3 Jahren.',
      'Die Erweiterung von 10 auf 15 kWh bringt nur noch 140 kWh und amortisiert sich nach 32,5 Jahren und damit nicht innerhalb der Lebensdauer.',
    ])
    const expensive = { ...prices, batteryCostsPerKwh: 2000 }
    expect(recommendationSentences(recommendBattery(sizes, expensive))).toEqual(
      [
        'Ein Speicher lohnt sich bei deinen Preisen nicht: Die ersten 5 kWh sparen 1.200 kWh Netzbezug im Jahr und amortisieren sich nach 41,7 Jahren und damit nicht innerhalb der Lebensdauer.',
      ],
    )
  })
})
