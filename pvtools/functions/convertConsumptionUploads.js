const Papa = require('papaparse')

const { generateDayTimeOrder } = require('./energyFlow')

// {"20200101:00":{P:20}, "20200101:01":{P:30.5}, ...}
const convertConsumptionCSV = (csvData, year) => {
  const config = {
    header: true,
  }

  const data = Papa.parse(csvData, config)
  if (data && !data.data.length) throw Error('file could not read')
  if (!data.data[0].Datetime || !data.data[0].Power)
    throw new Error('Headers are not correct: Datetime + Power')

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
    throw new Error('Length of your data must be 365/366 days * 24 hours')

  const importYear = parseInt(filteredEmpty[0].Datetime.slice(0, 4))
  if (importYear !== year)
    throw new Error(
      'Import year is wrong. You want to import year ' +
        importYear +
        ' but you set year ' +
        year +
        '!',
    )

  const dayTimes = generateDayTimeOrder(year)

  dayTimes.forEach((daytime) => {
    const found = filteredEmpty.find((val) => {
      if (val.Datetime == daytime) return true
      return false
    })
    if (!found) throw new Error('Folowing timeslot not found:' + daytime)
  })
  filteredEmpty.forEach((val) => {
    if (!dayTimes.includes(val.Datetime))
      throw new Error('at least one DateTime is wrong: ' + val + val.Datetime)
  })

  const parsedData = filteredEmpty.reduce((acc, curr) => {
    if (!curr.Datetime) throw new Error('At least one Datetime is empty')
    if (!curr.Power) throw new Error('Power miss for Datetime ' + curr.Datetime)
    if (acc[curr.Datetime]) throw new Error('Double Datetime ' + curr.Datetime)

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

module.exports = {
  convertConsumptionCSV,
  createTemplateCsv,
  createDataCsv,
}
