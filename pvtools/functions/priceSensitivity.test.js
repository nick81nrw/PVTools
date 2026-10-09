import { describe, expect, test } from 'vitest'

import {
  economicsFor,
  recommendationGrid,
  repriceSizes,
  withPrices,
} from './priceSensitivity.js'

const input = {
  consumptionCosts: 0.3,
  feedInCompensation: 0.08,
  batteryPriceMode: 'perKwh',
  batteryBaseCosts: 1000,
  batteryCostsPerKwh: 400,
  batteryLifetime: 15,
}

/** simulation result with the energies the economics need (kWh) */
const result = (size, selfUsedEnergy, fedInPower) => ({
  size,
  selfUsedEnergy,
  fedInPower,
  gridUsedEnergy: 5000 - selfUsedEnergy,
  costSavings:
    selfUsedEnergy * input.consumptionCosts +
    fedInPower * input.feedInCompensation,
})

const sizes = [
  result(1, 2000, 6000),
  result(5000, 3200, 4800),
  result(10000, 3750, 4250),
  result(15000, 3890, 4110),
]

describe('price sensitivity', () => {
  test('the entered prices give the same savings as the simulation', () => {
    repriceSizes(sizes, input).forEach((item, i) =>
      expect(item.costSavings).toBeCloseTo(sizes[i].costSavings, 9),
    )
  })

  test('savings follow the prices linearly', () => {
    const priced = repriceSizes(
      sizes,
      withPrices(input, { electricity: 0.4, feedIn: 0 }),
    )
    expect(priced[1].costSavings).toBeCloseTo(3200 * 0.4, 9)
    // 1.200 kWh more self used energy × 0,40 €
    expect(priced[1].costSavingsBattery).toBeCloseTo(480, 9)
  })

  test('the battery factor scales price per kWh, base costs and offers', () => {
    const half = withPrices(input, { batteryFactor: 0.5 })
    expect(half.batteryBaseCosts).toBe(500)
    expect(half.batteryCostsPerKwh).toBe(200)
    const offers = withPrices(
      { ...input, batteryOffers: [{ kwh: 5, price: 3000 }] },
      { batteryFactor: 1.2 },
    )
    expect(offers.batteryOffers[0].price).toBeCloseTo(3600, 9)
  })

  test('higher electricity prices and cheaper batteries favour larger batteries', () => {
    const grid = recommendationGrid(
      sizes,
      input,
      [0.2, 0.3, 0.45],
      [1.4, 1, 0.6],
      0.08,
    )
    // more expensive electricity: never a smaller recommendation
    for (let col = 0; col < 3; col++) {
      expect(grid[1][col]).toBeGreaterThanOrEqual(grid[0][col])
      expect(grid[2][col]).toBeGreaterThanOrEqual(grid[1][col])
    }
    // cheaper battery: never a smaller recommendation
    grid.forEach((row) => {
      expect(row[1]).toBeGreaterThanOrEqual(row[0])
      expect(row[2]).toBeGreaterThanOrEqual(row[1])
    })
    expect(grid[2][2]).toBeGreaterThan(grid[0][0])
  })

  test('economicsFor returns a complete recommendation', () => {
    const economics = economicsFor(sizes, input, {
      electricity: 0.4,
      feedIn: 0.08,
      batteryFactor: 1,
    })
    expect(economics.steps).toHaveLength(3)
    expect(economics.sentences.length).toBeGreaterThan(0)
    expect(economics.recommended.size).toBe(economics.recommendation.size)
  })
})
