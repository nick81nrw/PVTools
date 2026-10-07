import Papa from 'papaparse'

import { generateDayTimeOrder } from './energyFlow.js'

// {"20200101:00":{P:20}, "20200101:01":{P:30.5}, ...}
const convertConsumptionCSV = (csvData, year) => {
  const config = {
    header: true,
  }

  const data = Papa.parse(csvData, config)
  if (data && !data.data.length)
    throw new Error('Die Datei konnte nicht gelesen werden.')
  if (!data.data[0].Datetime || !data.data[0].Power)
    throw new Error(
      'Die Spaltenüberschriften stimmen nicht, erwartet: Datetime und Power',
    )

  const filteredEmpty = data.data.filter((v, i) => {
    if (v.Datetime == '') {
      return false
    }
    return true
  })
  if (
    !(filteredEmpty.length == 365 * 24) &&
    !(filteredEmpty.length == 366 * 24) &&
    !(filteredEmpty.length == 48)
  )
    throw new Error(
      'Die Datei muss einen Wert pro Stunde enthalten (365 bzw. 366 Tage * 24 Stunden).',
    )

  const importYear = parseInt(filteredEmpty[0].Datetime.slice(0, 4))
  if (importYear !== year)
    throw new Error(
      'Falsches Jahr: Die Datei enthält das Jahr ' +
        importYear +
        ', als Vergleichsjahr ist aber ' +
        year +
        ' eingestellt.',
    )

  const dayTimes = generateDayTimeOrder(year)

  dayTimes.forEach((daytime) => {
    const found = filteredEmpty.find((val) => {
      if (val.Datetime == daytime) return true
      return false
    })
    if (!found)
      throw new Error('Folgende Stunde fehlt in der Datei: ' + daytime)
  })
  filteredEmpty.forEach((val) => {
    if (!dayTimes.includes(val.Datetime))
      throw new Error('Ungültiger Zeitpunkt in der Datei: ' + val.Datetime)
  })

  const parsedData = filteredEmpty.reduce((acc, curr) => {
    if (!curr.Datetime) throw new Error('Mindestens ein Zeitpunkt ist leer.')
    if (!curr.Power)
      throw new Error('Verbrauchswert fehlt für ' + curr.Datetime)
    if (acc[curr.Datetime])
      throw new Error('Zeitpunkt doppelt vorhanden: ' + curr.Datetime)

    acc[curr.Datetime] = { P: parseFloat(curr.Power) }
    return acc
  }, {})

  return parsedData
}

const createTemplateCsv = (year) => {
  const dayTime = generateDayTimeOrder(year)

  const daytimearr = dayTime.map((v) => [v])
  const csv = Papa.unparse(
    { data: daytimearr, fields: ['Datetime', 'Power'] },
    { delimiter: ';', quotes: true },
  )
  return csv
}

const createDataCsv = (array) => {
  const csv = Papa.unparse(array, { delimiter: ';', quotes: true })
  return csv
}

export { convertConsumptionCSV, createTemplateCsv, createDataCsv }
