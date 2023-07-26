const Papa = require('papaparse')

const {generateDayTimeOrder} = require('./energyFlow')

// {"20200101:00":{P:20}, "20200101:01":{P:30.5}, ...}
const convertConsumptionCSV = (csvData) => {
    const config = {
        header: true,
        worker: true,
    }

    const data = Papa.parse(csvData,config)

    if (data.errors.length) throw Error('file could not read')
    if (!data.data[0].Datetime || !data.data[0].Power ) throw new Error('Headers are not correct: Datetime + Power')
    if (!(data.data.length == 365*24) && !(data.data.length == 366*24) && !(data.data.length == 48)) throw new Error('Length of your data must be 365/366 days * 24 hours')
    
    const year = parseInt(data.data[0].Datetime.slice(0,4))
    if (year < 2000 || year > 2050) throw new Error('do you live in our century? Year '+year+'???')
    
    const dayTimes = generateDayTimeOrder(year)

    dayTimes.forEach(daytime => {
        const found = data.data.find(val => {
            if (val.Datetime == daytime) return true
            return false
        })
        if (!found) throw new Error('Folowing timeslot not found:' + daytime)
    })
    data.data.forEach(val => {
        if (!dayTimes.includes(val.Datetime))  throw new Error('at least one DayTime is wrong: ' + val.Datetime)
    })

    const parsedData = data.data.reduce((acc,curr)=> {
        if(!curr.Datetime) throw new Error('At least one Datetime is empty')
        if(!curr.Power) throw new Error('Power miss for Datetime '+ curr.Datetime)
        if(acc[curr.Datetime]) throw new Error('Double Datetime '+ curr.Datetime)

        acc[curr.Datetime] = {P:curr.Power}
        return acc

    },{})


    return parsedData

}

const createTemplateCsv = year => {
    const dayTime = generateDayTimeOrder(year)
    
    const daytimearr = dayTime.map(v => [v])
    const csv =  Papa.unparse({data:daytimearr,fields:['Datetime', 'Power']},{delimiter:';',quotes:true})
    return csv
}


module.exports = {
    convertConsumptionCSV,
    createTemplateCsv
}