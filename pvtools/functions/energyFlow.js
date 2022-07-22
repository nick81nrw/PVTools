/**
 * @return {Object) Functions: energyFlow, calculateConsumption, normalizeHourlyRadiation
 * 
 */


/**
 * Calculate consumption per hour from a load profile, year and an yearly consumption
 * @param  {Int} powerGeneration             watts for one hour
 * @return {Object}                         {newBatterySoc: 3560, ...}
 
Parameters object:
    powerGeneration: 503 (watts for one hour)
    powerConsumption: 433 (watts for one hour)
    batterySoC: 3450 (watthours)
    batterySocMax: 5500 (watthours)
    batterySocMin: 100 (watthours)
    batteryEfficiency / batteryLoadEfficiency: 0.99 (99%)
    batteryUnloadEfficiency (optinal): 0.99 (99%)
    maxPowerGenerationInverter (optional): 2500 (watts)
    maxPowerGenerationBattery: (optional): 3400 (watts)
    maxPowerLoadBattery (optional): 2300 (watts)
    maxPowerFeedIn (optional): 8500 (watts) for feedIn regulations (70% rule in germany)
Return object:
    newBatterySoc: 3560 (watthours)
    selfUsagePowerPv: 3550 (watthours) PV-power, that used for own consumption
    selfUsagePowerBattery: 2250 (watthours) Battry-power, that used for own consumption
    selfUsagePower: 5520 (watthours) sum Pv + Battery
    feedInPowerGrid: 3445 (watthours) 
    batteryLoad: 2520 / -2520 (watthours) load/unload battery
    consumptionGrid: 2450 (watthours) 

    missedFeedInPowerGrid, missedInverterPower, missedBatteryPower;


missing calculations parameters:

missing return values:
    missed feedin power wehen maxPowerFeedIn is set
    missed PV power, when maxPowerGenerationInverter is set
    missed battery power, when maxPowerLoadBattery or maxPowerGenerationBattery is set
*/



const energyFlow = ( {
        powerGeneration, 
        powerConsumption, 
        batterySoc, 
        batterySocMax, 
        batterySocMin, 
        batteryEfficiency, 
        batteryLoadEfficiency, 
        batteryUnloadEfficiency,
        maxPowerGenerationInverter,
        maxPowerGenerationBattery,
        maxPowerLoadBattery,
        maxPowerFeedIn
    } ) => {
    
    let selfUsagePowerPv, selfUsagePowerBattery, selfUsagePower, 
        newBatterySoc, feedInPowerGrid, consumptionGrid, batteryLoad,
        missedFeedInPowerGrid, missedInverterPower, missedBatteryPower;
    
    missedFeedInPowerGrid = 0
    missedInverterPower = 0
    missedBatteryPower = 0

    batteryLoadEfficiency = batteryLoadEfficiency || batteryEfficiency
    batteryUnloadEfficiency = batteryUnloadEfficiency || batteryEfficiency


    if (maxPowerGenerationInverter && maxPowerGenerationInverter < powerGeneration) {
        
        missedInverterPower = powerGeneration - maxPowerGenerationInverter
        powerGeneration = maxPowerGenerationInverter
    }
    
    if (powerGeneration > powerConsumption) {
        // if power generaton is more then consumption, self used power is used complete and battery SoC will be calculated
        selfUsagePowerPv = powerConsumption
        selfUsagePowerBattery = 0
        const excessPower = powerGeneration - powerConsumption
        consumptionGrid = 0
        
        if (batterySoc >= batterySocMax) {
            // if battery is full, all power will be feed in
            feedInPowerGrid = excessPower
            newBatterySoc = batterySoc
            batteryLoad = 0
        } else if (batterySoc + (excessPower * batteryLoadEfficiency) > batterySocMax) {
            // if power would overload the battery, power split into feed in and battery loading
            batteryLoad = batterySocMax - batterySoc
            if (maxPowerLoadBattery && maxPowerLoadBattery < batteryLoad) {batteryLoad = maxPowerLoadBattery}
            feedInPowerGrid = (excessPower - (batteryLoad)) * batteryLoadEfficiency // feedin ist reduced due the missing LoadEfficiency in battery Load
            newBatterySoc = batterySoc + batteryLoad
        } else {
            // if battery has enough capacity to save the power, no feed in, all power save in battery
            feedInPowerGrid = 0
            batteryLoad = excessPower * batteryLoadEfficiency
            if (maxPowerLoadBattery && maxPowerLoadBattery < batteryLoad) {
                batteryLoad = maxPowerLoadBattery
                feedInPowerGrid = (excessPower - batteryLoad) * batteryLoadEfficiency
            }
            newBatterySoc = batterySoc + batteryLoad
        }
        
        
    }
    else if (powerGeneration < powerConsumption) {
        // if power generaton is less then consumption, self used power is only the genaration and battery Soc will be calculated
        selfUsagePowerPv = powerGeneration
        feedInPowerGrid = 0
        const excessLoad = powerConsumption - powerGeneration

        if (batterySoc == batterySocMin) {
            // if battery is empty, full grid consumption
            consumptionGrid = excessLoad
            newBatterySoc = batterySocMin
            batteryLoad = 0
            selfUsagePowerBattery = 0

        } else if (batterySoc - ((excessLoad) / batteryUnloadEfficiency) < batterySocMin) {
            // if battery will be empty, grid consumption and battery will be splitted 
            
            consumptionGrid = (excessLoad - batterySoc + batterySocMin) / batteryUnloadEfficiency
            newBatterySoc = batterySocMin
            batteryLoad = batterySocMin - batterySoc
            selfUsagePowerBattery = batterySoc - batterySocMin
            if(maxPowerGenerationBattery && maxPowerGenerationBattery < batteryLoad *-1 ) {
                batteryLoad = maxPowerGenerationBattery / batteryUnloadEfficiency *-1
                consumptionGrid = excessLoad - maxPowerGenerationBattery
                selfUsagePowerBattery = maxPowerGenerationBattery
                newBatterySoc = batterySoc + batteryLoad
            }
            
            
            // battrySoc load  batterymin
            //    200     500     100
            // 400 consumption (load(/batteryUnloadEfficiency) - batterySoc + batterySocMin )
        } else {
            // if battery has enough power, only use battery
            consumptionGrid = 0
            batteryLoad = excessLoad / batteryUnloadEfficiency * -1
            selfUsagePowerBattery = excessLoad
            if(maxPowerGenerationBattery && maxPowerGenerationBattery < batteryLoad *-1 ) {
                batteryLoad = maxPowerGenerationBattery / batteryUnloadEfficiency *-1
                consumptionGrid = excessLoad - maxPowerGenerationBattery
                selfUsagePowerBattery = maxPowerGenerationBattery
            }
            newBatterySoc = batterySoc + batteryLoad
        }

    }
    else if (powerGeneration == powerConsumption) {
        selfUsagePowerPv = powerConsumption
        selfUsagePowerBattery = 0
        newBatterySoc = batterySoc
        feedInPowerGrid = 0
        batteryLoad = 0
        consumptionGrid = 0

    }

    // 
    selfUsagePower = selfUsagePowerPv + selfUsagePowerBattery
    if (maxPowerFeedIn < feedInPowerGrid) {
        missedFeedInPowerGrid = feedInPowerGrid - maxPowerFeedIn
        feedInPowerGrid = maxPowerFeedIn

        // console.log(missedFeedInPowerGrid)
        // console.log(maxPowerFeedIn)
        // console.log(feedInPowerGrid)
    }

    return {
        newBatterySoc,
        selfUsagePower,
        selfUsagePowerPv,
        selfUsagePowerBattery,
        feedInPowerGrid,
        batteryLoad,
        consumptionGrid,
        missedInverterPower,
        missedBatteryPower,
        missedFeedInPowerGrid,
    }

}

/**
 * Calculate consumption per hour from a load profile, year and an yearly consumption
 * @param  {Object} loadProfile             Loadprofile Object {name: "SLPH0", values: [{ month: 1, weekDay: 1, dayHour: 0, partPerMonth: 0.004096433, partPerYear: 0.000406886 },...]}
 * @param  {Int}   year                     The year which should be calculated (leap year in mind)
 * @param  {Int}   consumptionKwhPerYear    Consumption in this year in kWh
 * @return {Object}                         {"20200101:00":{P:20}, "20200101:01":{P:30.5}, ...}
 */

const calculateConsumption = (loadProfile, year = 2021, consumptionKwhPerYear) => {

    const consumptionWattHours = consumptionKwhPerYear * 1000

    const daysFebruary = new Date(year, 2, 0).getDate()
    
    const months = [1,2,3,4,5,6,7,8,9,10,11,12]
    const monthLength = [31, daysFebruary, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]


    let dayIndex = new Date(`01 Jan ${year} 08:00:00 GMT`).getDay()

    let result = {}
    
    months.map((month, i) => {
        
        const mLength = monthLength[i]
        Array.from(Array(mLength).keys()).map(day => {
            day += 1
            Array.from(Array(24).keys()).map(hour => {
                const timeString = `${year}${('00' + (month)).slice(-2)}${('00' + day).slice(-2)}:${('00' + hour).slice(-2)}`
                const partPerYear = loadProfile.values.find(e => {
                    return e.month == month && e.weekDay == dayIndex && e.dayHour == hour
                }).partPerYear 
                P = (partPerYear * consumptionWattHours)
                if (timeString == '20200501:14') console.log(P, partPerYear, dayIndex, month, hour, consumptionWattHours, consumptionWattHours * P)
                if (result[timeString]) { //should not be run.
                    result[timeString].P += P
                } else {
                    result[timeString] = {P}
                }
            })
            dayIndex == 6 ? dayIndex = 0 : dayIndex += 1

        })
        
        

    })
    return result
   

}

/**
 * normalize the hourly radiation from pvgis API
 * @param  {Array[Array]} hourlyRadiationArrays An Array with power generation e.g. two: [ [{ "time": "20200101:0010", "P": 20.0, ... },{ "time": "20200101:0110", "P": 20.0, ... }],[...] ]
 * @return {Array[Object]} Array with Objects in Fomrat [ [{"20200101:00":{P:20}, "20200101:01":{P:30.5}, ...}], [{...}, ...] ]
*/

const normalizeHourlyRadiation = hourlyRadiationArrays => {

    const normRadiation = hourlyRadiationArrays.map(radiationArray => {
        return radiationArray.reduce((prev, curr) => {
            const dateHour = curr.time.split(':')[0] + ':' + curr.time.split(':')[1].substr(0,2)
            if (prev[dateHour]) {
                prev[dateHour].P += curr.P
            } else {
                prev[dateHour] = {P: curr.P}
            }

            return prev
        },{})
    })

    return normRadiation
}


/**
 * merge powerGeneration to one summerized object
 * @param  {Array[Object]} powerGenerationArray An Array with power generation e.g. two: [ {"20200101:00":{P:20}, "20200101:01":{P:30.5}, ...}, {...} ]
 * @return {Object} Array with Objects in Fomrat {"20200101:00":{P:20}, "20200101:01":{P:30.5}, ...}
*/

const mergePowerGeneration = powerGenerationArray => {
    if (powerGenerationArray.length == 1) return powerGenerationArray[0]

    return powerGenerationArray.reduce((prev, curr) => {

        for (const [key, value] of Object.entries(curr)) {

            if (prev[key]) {
                prev[key].P += value.P
            } else {
                prev[key] = {P: value.P}
            }
        }

        return prev
    }, {})

}


/**
 * generate the order of days for one year
 * @param  {Int} year A year: 2020
 * @return {Array} Array with DayTime  ["20200101:00","20200101:01","20200101:02", ... ,"20201231:23"]
*/

const generateDayTimeOrder = year => {
    const daysFebruary = new Date(year, 2, 0).getDate()
    const months = [1,2,3,4,5,6,7,8,9,10,11,12]
    const monthLength = [31, daysFebruary, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

    const timeString = []

    months.map((month, i) => {
        
        const mLength = monthLength[i]
        Array.from(Array(mLength).keys()).map(day => {
            day += 1
            Array.from(Array(24).keys()).map(hour => {
                timeString.push(`${year}${('00' + (month)).slice(-2)}${('00' + day).slice(-2)}:${('00' + hour).slice(-2)}`)
                
            })
            

        })
        
        

    })
    return timeString
}

module.exports = {
    energyFlow,
    calculateConsumption,
    normalizeHourlyRadiation,
    mergePowerGeneration,
    generateDayTimeOrder
}