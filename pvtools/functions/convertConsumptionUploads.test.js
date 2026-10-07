import { createTemplateCsv } from './convertConsumptionUploads.js'

describe('csv template', () => {
  test('createCsv', () => {
    const csv = createTemplateCsv(2023)
    // Linecount for 2023: 1 headline + 24h*356d data lines
    expect(csv.split('\n').length).toBe(1 + 24 * 365)
    // Filesize for 2023 template
    expect(csv.length).toBe(140178)
  })
})
