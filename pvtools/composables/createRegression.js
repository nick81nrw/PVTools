const { parse } = require('csv-parse/sync')
const fs = require('fs')

const data = fs.readFileSync('./regressiondb.csv', {
  encoding: 'utf8',
  flag: 'r',
})

const csvData = parse(data, { delimiter: ';', columns: true })

const objfunc = (acc, curr) => {
  const power = curr['P(1h)']
  const o = {}
  for (const [key, value] of Object.entries(curr)) {
    try {
      const newkey = parseInt(key)
      const newVal = parseFloat(value)
      if (isNaN(newkey)) {
        continue
      }
      o[newkey] = newVal
    } catch (e) {
      console.log(e)
    }
  }
  acc[power] = o
  return acc
}

const obj = csvData.reduce(objfunc, {})

fs.writeFileSync('./regression.json', JSON.stringify(obj, null, 2))

// console.log(obj)
