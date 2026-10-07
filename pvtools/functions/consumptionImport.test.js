import fs from 'fs'

import {
  analyzeConsumptionCsv,
  buildConsumption,
  normalizeDatetime,
  parseNumber,
} from './consumptionImport.js'
import { createTemplateCsv } from './convertConsumptionUploads.js'

const testFile = fs.readFileSync(
  new URL('./ImportTest.csv', import.meta.url),
  'utf8',
)

// CSV for a full year, value(index) returns the raw Power column
const csvFor = (year, value) => {
  const [header, ...rows] = createTemplateCsv(year).split('\r\n')
  return [
    header,
    ...rows.map((row, i) => row.replace(/;$/, ';' + value(i))),
  ].join('\n')
}

describe('parseNumber', () => {
  test('decimal comma and point', () => {
    expect(parseNumber('1,5')).toBe(1.5)
    expect(parseNumber('1.5')).toBe(1.5)
    expect(parseNumber('1.234,5')).toBe(1234.5)
    expect(parseNumber('1,234.5')).toBe(1234.5)
    expect(parseNumber(' 300 ')).toBe(300)
    expect(parseNumber('0')).toBe(0)
  })
  test('empty and invalid values', () => {
    expect(parseNumber('')).toBe(null)
    expect(parseNumber(undefined)).toBe(null)
    expect(parseNumber('abc')).toBeNaN()
    expect(parseNumber('12a')).toBeNaN()
  })
})

describe('normalizeDatetime', () => {
  test('supported formats', () => {
    expect(normalizeDatetime('20230101:00')).toBe('20230101:00')
    expect(normalizeDatetime('2023-01-01 05:00')).toBe('20230101:05')
    expect(normalizeDatetime('2023-01-01T05:00:00')).toBe('20230101:05')
    expect(normalizeDatetime('1.2.2023 7:00')).toBe('20230201:07')
    expect(normalizeDatetime('gestern')).toBe(null)
  })
})

describe('analyzeConsumptionCsv', () => {
  test('the example file is valid', () => {
    const result = analyzeConsumptionCsv(testFile)
    expect(result.errors).toEqual([])
    expect(result.year).toBe(2023)
    expect(result.stats.expectedHours).toBe(8760)
    expect(result.stats.totalKwh).toBeGreaterThan(0)
  })

  test('T08: zero values are valid', () => {
    const result = analyzeConsumptionCsv(csvFor(2023, () => '0'))
    expect(result.errors).toEqual([])
    expect(result.stats.zeroValues).toBe(8760)
    expect(result.stats.totalKwh).toBe(0)
  })

  test('decimal comma is read correctly', () => {
    const result = analyzeConsumptionCsv(csvFor(2023, () => '1,5'))
    expect(result.errors).toEqual([])
    expect(result.stats.totalKwh).toBeCloseTo((8760 * 1.5) / 1000, 9)
  })

  test('negative and invalid values are errors', () => {
    const negative = analyzeConsumptionCsv(
      csvFor(2023, (i) => (i === 5 ? '-300' : '100')),
    )
    expect(negative.errors.join()).toMatch(/Negative.*Zeile 7/)
    const text = analyzeConsumptionCsv(
      csvFor(2023, (i) => (i === 5 ? 'abc' : '100')),
    )
    expect(text.errors.join()).toMatch(/Keine gültige Zahl.*Zeile 7/)
  })

  test('T09: missing hours are a warning, not an error', () => {
    const [header, ...rows] = csvFor(2023, () => '100').split('\n')
    const csv = [header, ...rows.filter((_, i) => i !== 10 && i !== 11)].join(
      '\n',
    )
    const result = analyzeConsumptionCsv(csv)
    expect(result.errors).toEqual([])
    expect(result.warnings.join()).toMatch(/2 von 8760 Stunden/)
    expect(result.stats.missingHours).toBe(2)
  })

  test('duplicates and wrong headers are errors', () => {
    const [header, ...rows] = csvFor(2023, () => '100').split('\n')
    expect(
      analyzeConsumptionCsv(
        [header, rows[0], ...rows].join('\n'),
      ).errors.join(),
    ).toMatch(/Doppelte Zeitpunkte/)
    expect(analyzeConsumptionCsv('a;b\n1;2').errors.join()).toMatch(
      /Spaltenüberschriften/,
    )
  })
})

describe('buildConsumption', () => {
  test('fills gaps with the chosen method', () => {
    const [header, ...rows] = csvFor(2023, (i) => String(i)).split('\n')
    const csv = [header, ...rows.filter((_, i) => i !== 10)].join('\n')
    const analysis = analyzeConsumptionCsv(csv)
    expect(
      buildConsumption(analysis, 2023, 'interpolate')['20230101:10'].P,
    ).toBe(10)
    expect(buildConsumption(analysis, 2023, 'previous')['20230101:10'].P).toBe(
      9,
    )
    expect(buildConsumption(analysis, 2023, 'zero')['20230101:10'].P).toBe(0)
  })

  test('maps the data onto another weather year incl. leap years', () => {
    const analysis = analyzeConsumptionCsv(csvFor(2023, (i) => String(i)))
    const leap = buildConsumption(analysis, 2020)
    expect(Object.keys(leap)).toHaveLength(8784)
    expect(leap['20200101:05'].P).toBe(5)
    expect(leap['20200229:13'].P).toBe(leap['20200228:13'].P)
    Object.values(leap).forEach(({ P }) =>
      expect(Number.isFinite(P)).toBe(true),
    )

    const fromLeap = buildConsumption(
      analyzeConsumptionCsv(csvFor(2020, () => '100')),
      2023,
    )
    expect(Object.keys(fromLeap)).toHaveLength(8760)
  })
})
