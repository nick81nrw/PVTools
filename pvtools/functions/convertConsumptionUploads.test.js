import fs from 'fs'
import {
  convertConsumptionCSV,
  createTemplateCsv,
} from './convertConsumptionUploads.js'

const csvData = fs.readFileSync(
  new URL('./ImportTest.csv', import.meta.url),
  'utf8',
)

describe('read csv file', () => {
  test('result has entries', () => {
    const result = convertConsumptionCSV(csvData, 2023)
    expect(typeof result == 'object').toBe(true)
  })
  test('createCsv', () => {
    const csv = createTemplateCsv(2023)
    // Linecount for 2023: 1 headline + 24h*356d data lines
    expect(csv.split('\n').length).toBe(1 + 24 * 365)
    // Filesize for 2023 template
    expect(csv.length).toBe(140178)
  })
})
