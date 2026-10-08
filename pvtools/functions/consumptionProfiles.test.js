import { describe, expect, test } from 'vitest'
import {
  addVariability,
  CONSUMPTION_PROFILES,
  DEFAULT_CONSUMPTION_PROFILE,
  getConsumptionProfile,
} from './consumptionProfiles.js'
import { calculateConsumption } from './energyFlow.js'
import { HOUR_MODELS } from './hourModels/index.js'
import { factorFunction, PROFILEBASE, SLPH0 } from './SLP.js'

const sum = (consumption) =>
  Object.values(consumption).reduce((total, { P }) => total + P, 0)

const daySums = (consumption) => {
  const days = {}
  for (const [key, { P }] of Object.entries(consumption)) {
    const day = key.slice(0, 8)
    days[day] = (days[day] ?? 0) + P
  }
  return days
}

describe('registry', () => {
  test('ids are unique and the default exists', () => {
    const ids = CONSUMPTION_PROFILES.map((profile) => profile.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain(DEFAULT_CONSUMPTION_PROFILE)
  })

  test('unknown ids fall back to the default', () => {
    expect(getConsumptionProfile('unknown').id).toBe(
      DEFAULT_CONSUMPTION_PROFILE,
    )
  })

  test('every hour model names an existing profile', () => {
    for (const model of HOUR_MODELS) {
      expect(getConsumptionProfile(model.consumptionProfile).id).toBe(
        model.consumptionProfile,
      )
    }
  })

  test('the classic model keeps the plain H0 profile', () => {
    expect(
      HOUR_MODELS.find((model) => model.id === 'legacyRegression')
        .consumptionProfile,
    ).toBe('h0')
  })
})

describe.each(CONSUMPTION_PROFILES)('profile $id', (profile) => {
  const consumption = profile.build({ year: 2020, consumptionYear: 5000000 })

  test('covers every hour of the year', () => {
    expect(Object.keys(consumption)).toHaveLength(8784)
  })

  test('keeps the yearly consumption', () => {
    expect(sum(consumption)).toBeCloseTo(
      sum(
        calculateConsumption({
          year: 2020,
          consumptionYear: 5000000,
          profile: SLPH0,
          profileBase: PROFILEBASE,
          factorFunction,
        }),
      ),
      3,
    )
  })

  test('has no negative hours', () => {
    expect(Object.values(consumption).every(({ P }) => P >= 0)).toBe(true)
  })
})

describe('h0 calibrated', () => {
  const h0 = getConsumptionProfile('h0').build({
    year: 2020,
    consumptionYear: 5000000,
  })
  const calibrated = getConsumptionProfile('h0Calibrated').build({
    year: 2020,
    consumptionYear: 5000000,
  })

  test('every day keeps its energy from H0', () => {
    const before = daySums(h0)
    const after = daySums(calibrated)
    for (const day of Object.keys(before)) {
      expect(after[day]).toBeCloseTo(before[day], 6)
    }
  })

  test('varies much more from hour to hour than H0', () => {
    const spread = (consumption) => {
      const values = Object.values(consumption).map(({ P }) => P)
      const mean = values.reduce((a, b) => a + b, 0) / values.length
      const variance =
        values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length
      return Math.sqrt(variance) / mean
    }
    expect(spread(calibrated)).toBeGreaterThan(2 * spread(h0))
  })

  test('is reproducible', () => {
    expect(addVariability(h0)).toEqual(calibrated)
  })
})
