import Papa from 'papaparse'

import { generateDayTimeOrder } from './energyFlow.js'

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

export { createTemplateCsv, createDataCsv }
