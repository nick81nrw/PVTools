import Papa from 'papaparse'

import { generateDayTimeOrder } from './energyFlow.js'

/**
 * Import of hourly consumption values (Wh) from a CSV file.
 *
 * analyzeConsumptionCsv() checks the file and collects statistics for a
 * preview, buildConsumption() turns the result into the hourly consumption
 * of the simulated year: {"20200101:00": {P: 350}, ...}
 */

export const FILL_METHODS = {
  interpolate: 'linear interpolieren',
  zero: 'mit 0 Wh auffüllen',
  previous: 'vorherigen Wert übernehmen',
}

const pad = (value) => String(value).padStart(2, '0')

/** "20230105:04" as "05.01.2023 04:00" */
export const formatDatetime = (datetime) =>
  datetime
    ? `${datetime.slice(6, 8)}.${datetime.slice(4, 6)}.${datetime.slice(0, 4)} ${datetime.slice(9)}:00`
    : '–'

/**
 * Accepts the template format "20230101:00" and common alternatives like
 * "2023-01-01 00:00", "2023-01-01T00:00:00" or "01.01.2023 00:00".
 * Returns the template format or null.
 */
export const normalizeDatetime = (raw) => {
  const value = String(raw ?? '').trim()
  let match = value.match(/^(\d{4})(\d{2})(\d{2}):(\d{1,2})$/)
  if (match) return `${match[1]}${match[2]}${match[3]}:${pad(match[4])}`
  match = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[T ](\d{1,2})(:\d{2}){0,2}/)
  if (match)
    return `${match[1]}${pad(match[2])}${pad(match[3])}:${pad(match[4])}`
  match = value.match(
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})[ ,]+(\d{1,2})(:\d{2}){0,2}/,
  )
  if (match)
    return `${match[3]}${pad(match[2])}${pad(match[1])}:${pad(match[4])}`
  return null
}

/**
 * Parses numbers with decimal comma or point ("1,5", "1.5", "1.234,5").
 * Returns null for empty values and NaN for anything else that is no number.
 */
export const parseNumber = (raw) => {
  let value = String(raw ?? '')
    .trim()
    .replace(/\s/g, '')
  if (value === '') return null
  const comma = value.lastIndexOf(',')
  const point = value.lastIndexOf('.')
  if (comma > -1 && point > -1) {
    // the last separator is the decimal separator, the other one groups digits
    value =
      comma > point
        ? value.replace(/\./g, '').replace(',', '.')
        : value.replace(/,/g, '')
  } else if (comma > -1) {
    value = value.replace(',', '.')
  }
  return /^-?(\d+\.?\d*|\.\d+)$/.test(value) ? Number(value) : NaN
}

const findColumn = (fields, name) =>
  fields.find((field) => field.trim().toLowerCase() === name.toLowerCase())

export function analyzeConsumptionCsv(text) {
  const errors = []
  const parsed = Papa.parse(String(text ?? '').trim(), {
    header: true,
    skipEmptyLines: 'greedy',
    delimitersToGuess: [';', '\t', ','],
  })
  const fields = parsed.meta.fields || []
  const datetimeColumn = findColumn(fields, 'Datetime')
  const powerColumn = findColumn(fields, 'Power')
  if (!datetimeColumn || !powerColumn) {
    return {
      errors: [
        'Die Spaltenüberschriften stimmen nicht, erwartet werden „Datetime“ und „Power“ (wie in der Vorlage).',
      ],
      warnings: [],
    }
  }
  if (!parsed.data.length) {
    return { errors: ['Die Datei enthält keine Werte.'], warnings: [] }
  }

  const values = new Map()
  const invalidDatetimes = []
  const invalidValues = []
  const negativeValues = []
  const duplicates = []
  const emptyValues = []

  parsed.data.forEach((row, index) => {
    const line = index + 2 // header is line 1
    const datetime = normalizeDatetime(row[datetimeColumn])
    if (!datetime) {
      invalidDatetimes.push({ line, raw: row[datetimeColumn] })
      return
    }
    if (values.has(datetime)) {
      duplicates.push({ line, datetime })
      return
    }
    const value = parseNumber(row[powerColumn])
    if (value === null) {
      emptyValues.push({ line, datetime })
    } else if (Number.isNaN(value)) {
      invalidValues.push({ line, datetime, raw: row[powerColumn] })
    } else if (value < 0) {
      negativeValues.push({ line, datetime, value })
    }
    values.set(datetime, value === null || Number.isNaN(value) ? null : value)
  })

  const years = new Map()
  for (const datetime of values.keys()) {
    const year = Number(datetime.slice(0, 4))
    years.set(year, (years.get(year) || 0) + 1)
  }
  const [year] = [...years.entries()].sort((a, b) => b[1] - a[1])[0] || []

  const sample = (list, format) =>
    list.slice(0, 3).map(format).join(', ') +
    (list.length > 3 ? ` … (${list.length} insgesamt)` : '')

  if (invalidDatetimes.length)
    errors.push(
      `Ungültige Zeitpunkte in Zeile ${sample(invalidDatetimes, (e) => `${e.line} („${e.raw}“)`)}.`,
    )
  if (invalidValues.length)
    errors.push(
      `Keine gültige Zahl in Zeile ${sample(invalidValues, (e) => `${e.line} („${e.raw}“)`)}.`,
    )
  if (negativeValues.length)
    errors.push(
      `Negative Verbrauchswerte in Zeile ${sample(negativeValues, (e) => `${e.line} (${e.value})`)}.`,
    )
  if (duplicates.length)
    errors.push(
      `Doppelte Zeitpunkte in Zeile ${sample(duplicates, (e) => `${e.line} (${e.datetime})`)}.`,
    )
  if (years.size > 1)
    errors.push(
      `Die Datei enthält Werte aus mehreren Jahren (${[...years.keys()].join(', ')}). Bitte genau ein Jahr importieren.`,
    )

  const expected = year ? generateDayTimeOrder(year) : []
  const expectedSet = new Set(expected)
  const unexpected = [...values.keys()].filter(
    (datetime) =>
      datetime.startsWith(String(year)) && !expectedSet.has(datetime),
  )
  if (unexpected.length)
    errors.push(`Unbekannte Zeitpunkte: ${sample(unexpected, (d) => d)}.`)

  const missing = expected.filter((datetime) => !values.has(datetime))
  const gaps = [...missing, ...emptyValues.map((e) => e.datetime)]
  const numbers = [...values.values()].filter((v) => Number.isFinite(v))
  const total = numbers.reduce((sum, v) => sum + v, 0)

  const warnings = []
  if (gaps.length)
    warnings.push(
      `${gaps.length} von ${expected.length} Stunden fehlen oder sind leer (z.B. ${gaps.slice(0, 3).map(formatDatetime).join(', ')}).`,
    )

  return {
    errors,
    warnings,
    year,
    values,
    gaps,
    stats: {
      records: values.size,
      expectedHours: expected.length,
      first: expected.find((d) => values.has(d)) || null,
      last: [...expected].reverse().find((d) => values.has(d)) || null,
      totalKwh: total / 1000,
      min: numbers.length ? Math.min(...numbers) : null,
      max: numbers.length ? Math.max(...numbers) : null,
      mean: numbers.length ? total / numbers.length : null,
      zeroValues: numbers.filter((v) => v === 0).length,
      missingHours: gaps.length,
    },
  }
}

const fillGaps = (series, method) => {
  const filled = [...series]
  if (method === 'zero') return filled.map((v) => v ?? 0)
  if (method === 'previous') {
    let last = series.find((v) => v !== null) ?? 0
    return filled.map((v) => (v === null ? last : (last = v)))
  }
  // linear interpolation, at the edges the nearest known value is used
  for (let i = 0; i < filled.length; i++) {
    if (filled[i] !== null) continue
    let prev = i - 1
    while (prev >= 0 && series[prev] === null) prev--
    let next = i + 1
    while (next < series.length && series[next] === null) next++
    const before = prev >= 0 ? series[prev] : null
    const after = next < series.length ? series[next] : null
    filled[i] =
      before !== null && after !== null
        ? before + ((after - before) * (i - prev)) / (next - prev)
        : (before ?? after ?? 0)
  }
  return filled
}

/**
 * Hourly consumption for the simulated year. The values are mapped by
 * month, day and hour, so consumption of e.g. 2025 can be simulated with the
 * weather of 2020. A missing 29 February is filled with the 28 February.
 */
export function buildConsumption(analysis, targetYear, method = 'interpolate') {
  const sourceOrder = generateDayTimeOrder(analysis.year)
  const series = fillGaps(
    sourceOrder.map((datetime) => analysis.values.get(datetime) ?? null),
    method,
  )
  const byDayHour = new Map(
    sourceOrder.map((datetime, i) => [datetime.slice(4), series[i]]),
  )
  return generateDayTimeOrder(targetYear).reduce((result, datetime) => {
    const key = datetime.slice(4)
    const value = byDayHour.has(key)
      ? byDayHour.get(key)
      : byDayHour.get(`0228${key.slice(4)}`)
    result[datetime] = { P: value }
    return result
  }, {})
}
