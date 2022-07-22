const {energyFlow, calculateConsumption, normalizeHourlyRadiation, mergePowerGeneration, generateDayTimeOrder} = require('./energyFlow')

const loadProfile = require('./SLPH0')[0]
const seriescalc = require('./seriescalc.json')
const seriescalc2 = require('./seriescalc2.json')

const normalizedHR = normalizeHourlyRadiation([seriescalc.outputs.hourly, seriescalc2.outputs.hourly])

describe('PV > Consumption',() => {
    test('pv generation is more than consumption, battery is loading', () => {
        const data = energyFlow({   
                    powerGeneration: 5000, 
                    powerConsumption: 4000, 
                    batterySoc: 5000, 
                    batterySocMax: 10000, 
                    batterySocMin: 100, 
                    batteryEfficiency: .99
                })
        expect(data).toEqual({
            newBatterySoc: 1000 * .99 + 5000,
            selfUsagePower: 4000,
            selfUsagePowerPv: 4000,
            selfUsagePowerBattery: 0,
            feedInPowerGrid: 0,
            batteryLoad: 1000 * .99,
            consumptionGrid: 0,
            missedInverterPower: 0,
            missedBatteryPower: 0,
            missedFeedInPowerGrid: 0,
        })
    })
    
    test('pv generation is more than consumption, max battery power load is lower than generation and split in feed in and load', () => {
        const data = energyFlow({   
                    powerGeneration: 5000, 
                    powerConsumption: 0, 
                    batterySoc: 5000, 
                    batterySocMax: 8000, 
                    batterySocMin: 100, 
                    batteryEfficiency: .99,
                    maxPowerLoadBattery: 2000
                })
        expect(data).toEqual({
            newBatterySoc: 2000 + 5000,
            selfUsagePower: 0,
            selfUsagePowerPv: 0,
            selfUsagePowerBattery: 0,
            feedInPowerGrid: 3000 * .99,
            batteryLoad: 2000,
            consumptionGrid: 0,
            missedInverterPower: 0,
            missedBatteryPower: 0,
            missedFeedInPowerGrid: 0,
        })
    })
    
    test('pv generation is more than consumption, max battery power load is lower than generation, only load in battery', () => {
        const data = energyFlow({   
                    powerGeneration: 5000, 
                    powerConsumption: 2000, 
                    batterySoc: 5000, 
                    batterySocMax: 8000, 
                    batterySocMin: 100, 
                    batteryEfficiency: .99,
                    maxPowerLoadBattery: 2000
                })
        expect(data).toEqual({
            newBatterySoc: 2000 + 5000,
            selfUsagePower: 2000,
            selfUsagePowerPv: 2000,
            selfUsagePowerBattery: 0,
            feedInPowerGrid: 1000 * .99,
            batteryLoad: 2000,
            consumptionGrid: 0,
            missedInverterPower: 0,
            missedBatteryPower: 0,
            missedFeedInPowerGrid: 0,
        })
    })
    
    test('pv generation is more than inverter max power generation', () => {
        const data = energyFlow({   
                    powerGeneration: 5000, 
                    powerConsumption: 4000, 
                    batterySoc: 5000, 
                    batterySocMax: 10000, 
                    batterySocMin: 100, 
                    batteryEfficiency: .99,
                    maxPowerGenerationInverter: 4500
                })
        expect(data).toEqual({
            newBatterySoc: 500 * .99 + 5000,
            selfUsagePower: 4000,
            selfUsagePowerPv: 4000,
            selfUsagePowerBattery: 0,
            feedInPowerGrid: 0,
            batteryLoad: 500 * .99,
            consumptionGrid: 0,
            missedInverterPower: 500,
            missedBatteryPower: 0,
            missedFeedInPowerGrid: 0,
        })
    })
    
    test('pv generation is more than consumption, battery load efficiency diff than unload', () => {
        const data = energyFlow({   
                    powerGeneration: 5000, 
                    powerConsumption: 4000, 
                    batterySoc: 5000, 
                    batterySocMax: 10000, 
                    batterySocMin: 100, 
                    batteryLoadEfficiency: .95,
                    batteryEfficiency: .99 // unload as default
                })
        expect(data).toEqual({
            newBatterySoc: 1000 * .95 + 5000,
            selfUsagePower: 4000,
            selfUsagePowerPv: 4000,
            selfUsagePowerBattery: 0,
            feedInPowerGrid: 0,
            batteryLoad: 1000 * .95,
            consumptionGrid: 0,
            missedInverterPower: 0,
            missedBatteryPower: 0,
            missedFeedInPowerGrid: 0,
        })
    })
    
    test('pv generation is more than consumption, battery is full, power is feed in', () => {
        const data = energyFlow({   
                    powerGeneration: 5000, 
                    powerConsumption: 4000, 
                    batterySoc: 5000, 
                    batterySocMax: 5000, 
                    batterySocMin: 100, 
                    batteryEfficiency: .99
                })
        expect(data).toEqual({
            newBatterySoc: 5000,
            selfUsagePower: 4000,
            selfUsagePowerPv: 4000,
            selfUsagePowerBattery: 0,
            feedInPowerGrid: 1000,
            batteryLoad: 0,
            consumptionGrid: 0,
            missedInverterPower: 0,
            missedBatteryPower: 0,
            missedFeedInPowerGrid: 0,
        })
    })
    test('pv generation is more than consumption, battery is full, power is feed in, max feedin power less then generation', () => {
        const data = energyFlow({   
                    powerGeneration: 5000, 
                    powerConsumption: 2000, 
                    batterySoc: 5000, 
                    batterySocMax: 5000, 
                    batterySocMin: 100, 
                    batteryEfficiency: .99,
                    maxPowerFeedIn: 2000
                })
        expect(data).toEqual({
            newBatterySoc: 5000,
            selfUsagePower: 2000,
            selfUsagePowerPv: 2000,
            selfUsagePowerBattery: 0,
            feedInPowerGrid: 2000,
            batteryLoad: 0,
            consumptionGrid: 0,
            missedInverterPower: 0,
            missedBatteryPower: 0,
            missedFeedInPowerGrid: 1000,
        })
    })
    
    test('pv generation is more than consumption, battery will be fullfilled, diff power is feed in', () => {
        const data = energyFlow({   
                    powerGeneration: 5000, 
                    powerConsumption: 4000, 
                    batterySoc: 5000, 
                    batterySocMax: 5500, 
                    batterySocMin: 100, 
                    batteryEfficiency: .99
                })
        expect(data).toEqual({
            newBatterySoc: 5500,
            selfUsagePower: 4000,
            selfUsagePowerPv: 4000,
            selfUsagePowerBattery: 0,
            feedInPowerGrid: 500 * .99,
            batteryLoad: 500,
            consumptionGrid: 0,
            missedInverterPower: 0,
            missedBatteryPower: 0,
            missedFeedInPowerGrid: 0,
        })
    })
    
})

describe('PV < Consumption', () => {
    test('pv generation is less than consumption, battery is discharging', () => {
        const data = energyFlow({   
                    powerGeneration: 5000, 
                    powerConsumption: 6000, 
                    batterySoc: 5000, 
                    batterySocMax: 10000, 
                    batterySocMin: 100, 
                    batteryEfficiency: .99
                })
        expect(data).toEqual({
            newBatterySoc: 5000 - 1000 / 0.99,
            selfUsagePower: 6000,
            selfUsagePowerPv: 5000,
            selfUsagePowerBattery: 1000,
            feedInPowerGrid: 0,
            batteryLoad: -1000 / 0.99,
            consumptionGrid: 0,
            missedInverterPower: 0,
            missedBatteryPower: 0,
            missedFeedInPowerGrid: 0,
        })
    })

    test('pv generation is less than consumption, battery is discharging, Batterypower is lower then consumption', () => {
        const data = energyFlow({   
                    powerGeneration: 3000, 
                    powerConsumption: 6000, 
                    batterySoc: 5000, 
                    batterySocMax: 10000, 
                    batterySocMin: 100, 
                    batteryEfficiency: .99,
                    maxPowerGenerationBattery: 1000
                })
        expect(data).toEqual({
            newBatterySoc: 5000 - 1000 / 0.99,
            selfUsagePower: 4000,
            selfUsagePowerPv: 3000,
            selfUsagePowerBattery: 1000,
            feedInPowerGrid: 0,
            batteryLoad: -1000 / 0.99,
            consumptionGrid: 2000,
            missedInverterPower: 0,
            missedBatteryPower: 0,
            missedFeedInPowerGrid: 0,
        })
    })
   
    test('pv generation is less than consumption, battery is discharging, Batterypower is lower then consumption, battery will be empty', () => {
        const data = energyFlow({   
                    powerGeneration: 3000, 
                    powerConsumption: 6000, 
                    batterySoc: 3000, 
                    batterySocMax: 10000, 
                    batterySocMin: 100, 
                    batteryEfficiency: .99,
                    maxPowerGenerationBattery: 1000
                })
        expect(data).toEqual({
            newBatterySoc: 3000 - 1000 / 0.99,
            selfUsagePower: 4000,
            selfUsagePowerPv: 3000,
            selfUsagePowerBattery: 1000,
            feedInPowerGrid: 0,
            batteryLoad: -1000 / 0.99,
            consumptionGrid: 2000,
            missedInverterPower: 0,
            missedBatteryPower: 0,
            missedFeedInPowerGrid: 0,
        })
    })
    
    test('pv generation is less than consumption, battery unload efficiency is differnt then load', () => {
        const data = energyFlow({   
                    powerGeneration: 5000, 
                    powerConsumption: 6000, 
                    batterySoc: 5000, 
                    batterySocMax: 10000, 
                    batterySocMin: 100, 
                    batteryEfficiency: .99,
                    batteryUnloadEfficiency: .80
                })
        expect(data).toEqual({
            newBatterySoc: 5000 - 1000 / 0.80,
            selfUsagePower: 6000,
            selfUsagePowerPv: 5000,
            selfUsagePowerBattery: 1000,
            feedInPowerGrid: 0,
            batteryLoad: -1000 / 0.80,
            consumptionGrid: 0,
            missedInverterPower: 0,
            missedBatteryPower: 0,
            missedFeedInPowerGrid: 0,
        })
    })
    
    test('pv generation is less than consumption, battery is empty, cunsumpion from grid', () => {
        const data = energyFlow({   
                    powerGeneration: 5000, 
                    powerConsumption: 6000, 
                    batterySoc: 100, 
                    batterySocMax: 10000, 
                    batterySocMin: 100, 
                    batteryEfficiency: .99
                })
        expect(data).toEqual({
            newBatterySoc: 100,
            selfUsagePower: 5000,
            selfUsagePowerPv: 5000,
            selfUsagePowerBattery: 0,
            feedInPowerGrid: 0,
            batteryLoad: 0,
            consumptionGrid: 1000,
            missedInverterPower: 0,
            missedBatteryPower: 0,
            missedFeedInPowerGrid: 0,
        })
    })
    
    test('pv generation is less than consumption, battery is nearly empty, diff cunsumpion from grid', () => {
        const data = energyFlow({   
                    powerGeneration: 5000, 
                    powerConsumption: 6000, 
                    batterySoc: 1000, 
                    batterySocMax: 10000, 
                    batterySocMin: 500, 
                    batteryEfficiency: .99
                })
        expect(data).toEqual({
            newBatterySoc: 500,
            selfUsagePower: 5500,
            selfUsagePowerPv: 5000,
            selfUsagePowerBattery: 500,
            feedInPowerGrid: 0,
            batteryLoad: -500,
            consumptionGrid: 500 / 0.99,
            missedInverterPower: 0,
            missedBatteryPower: 0,
            missedFeedInPowerGrid: 0,
        })
    })
})







describe.only('calculate power consumption', () => {

    
    test('check length (365 * 24h = 8760 datasets)', () => {
        const result = calculateConsumption(loadProfile)
        expect(Object.values(result).length).toBe(8760)
    })
    test('check length of leap year (366 * 24h = 8784 datasets)', () => {
        const result = calculateConsumption(loadProfile, 2012)
        expect(Object.values(result).length).toBe(8784)
    })
    test('check power consumption of one day/hour', () => {
        const result = calculateConsumption(loadProfile, 2021, 10000)
        //{ month: 1, weekDay: 5, dayHour: 18, partPerMonth: 0.008098458, partPerYear: 0.000804395 },
        expect(result['20210115:18'].P).toBe(10000 * 1000 * 0.000804395)
    })
    test('check power consumption of one day/hour on leap year', () => {
        const result = calculateConsumption(loadProfile, 2012, 10000)
        //{ month: 1, weekDay: 5, dayHour: 18, partPerMonth: 0.008098458, partPerYear: 0.000804395 },
        expect(result['20120229:18'].P).toBe(10000 * 1000 * 0.000791455)
    })
    test('check sum of year consumption', () => {
        const result = calculateConsumption(loadProfile, 2021, 4500)
        const sum = Object.values(result).reduce((prev, curr) => prev + curr.P,0)
        expect(sum).toBe(4500000)

    })
})





describe('norm hourly radiation', () => {
    
    test('first result is an object', () => {
        expect(typeof normalizedHR[0]).toBe('object')
    })
    test('all results is are object', () => {
        normalizedHR.forEach(e => {
            expect(typeof e).toBe('object')
        });
    })
    test('results has the correct length', () => {
        expect(normalizedHR.length).toBe(2)
       
    })
    test('results should be the right length in leap year 2020', () => {
        expect(Object.keys(normalizedHR[0]).length).toBe(366 * 24)
    })
    test('results conatain the right power generation', () => {
        // {
        //     "time": "20200308:1310",
        //     "P": 1365630.0,
        //     "G(i)": 549.35,
        //     "H_sun": 36.12,
        //     "T2m": 12.84,
        //     "WS10m": 0.69,
        //     "Int": 0.0
        //   },
        expect(normalizedHR[0]['20200308:13'].P).toBe(3065.16)
    })


})




describe('merge powergeneration arrays', () => {
    const result = mergePowerGeneration(normalizedHR)
    const oneResult = mergePowerGeneration([normalizedHR[0]])

    // normalizedHR.map(obj => console.log(obj['20200515:14']))

    test('merge only one power generation object', () => {
        expect(typeof oneResult).toBe('object')
    })
    test('merge only one power generation object, find one key', () => {
        expect(oneResult['20200308:13']).toEqual({"P": 3065.16})
    })
    test('result is an object', () => {
        expect(typeof result).toBe('object')
    })
    test('check  object key length', () => {
        expect(Object.keys(result).length).toBe(8784)
    })
    test('an key exist', () => {
        expect(typeof result['20200515:14']).toBe('object')
    })
    test('the summarized value af key is correct', () => {
        expect(result['20200515:14'].P).toBe(7332.96)
    })
  

})



describe('generate das time array', () => {
    test('date time order length is 24 hour times day of year 2020 with 366 days ', () => {
        const dayTimeOrder = generateDayTimeOrder(2020)
        expect(dayTimeOrder.length).toBe(366*24) //leap year
    })
    test('date time order length is 24 hour times day of year 2021 with 365 days ', () => {
        const dayTimeOrder2 = generateDayTimeOrder(2021)
        expect(dayTimeOrder2.length).toBe(365*24) //normal year
    })
    test('date time order are sorted in ascending order', () => {
        const dayTimeOrder = generateDayTimeOrder(2020)
        let order = 1
        dayTimeOrder.reduce((prev, curr) => {
            if (prev <= curr) order = 0
        })

        expect(order).toBe(0) 
    })
})


describe('integration tests energyFlow', () => {
    const consumption = calculateConsumption(loadProfile, 2020, 4500)
    const mergedPowerGeneration = mergePowerGeneration(normalizedHR)
    const dayTimeOrder = generateDayTimeOrder(2020)

    test('test one energy flow result', () => {

        const dayTime = '20200518:18'
        // console.log(consumption[dayTime])
        const result = energyFlow({
            powerGeneration: mergedPowerGeneration[dayTime].P, //473.34000000000003
            powerConsumption: consumption[dayTime].P, //3093.3675000000003
            batterySoc:5000, 
            batterySocMax: 10000, 
            batterySocMin: 100, 
            batteryEfficiency: .99, 
        })
        expect(consumption[dayTime].P).toBe(3093.3675000000003)
        expect(mergedPowerGeneration[dayTime].P).toBe(473.34000000000003)
        expect(result).toEqual({
               "batteryLoad": -4900,
               "consumptionGrid": 1515.9696969696975,
               "feedInPowerGrid": 0,
               "missedBatteryPower": 0,
               "missedFeedInPowerGrid": 0,
               "missedInverterPower": 0,
               "newBatterySoc": 100,
               "selfUsagePower": 5373.34,
               "selfUsagePowerBattery": 4900,
               "selfUsagePowerPv": 473.34000000000003,
             })

    })
    
    test('test a year in energy flow', () => {
        
        let yearSum = {
            "batteryLoad": 0,
            "consumptionGrid": 0,
            "feedInPowerGrid": 0,
            "missedBatteryPower": 0,
            "missedFeedInPowerGrid": 0,
            "missedInverterPower": 0,
            "newBatterySoc": 0,
            "selfUsagePower": 0,
            "selfUsagePowerBattery": 0,
            "selfUsagePowerPv": 0,
        }

        dayTimeOrder.forEach(key => {

            const result = energyFlow({
                powerGeneration: mergedPowerGeneration[key].P, 
                powerConsumption: consumption[key].P, 
                batterySoc: yearSum.newBatterySoc, 
                batterySocMax: 20000, 
                batterySocMin: 100, 
                batteryEfficiency: .99, 
            })

            yearSum.batteryLoad = yearSum.batteryLoad + result.batteryLoad
            yearSum.consumptionGrid = yearSum.consumptionGrid + result.consumptionGrid
            yearSum.feedInPowerGrid = yearSum.feedInPowerGrid + result.feedInPowerGrid
            yearSum.missedBatteryPower = yearSum.missedBatteryPower + result.missedBatteryPower
            yearSum.missedFeedInPowerGrid = yearSum.missedFeedInPowerGrid + result.missedFeedInPowerGrid
            yearSum.missedInverterPower = yearSum.missedInverterPower + result.missedInverterPower
            yearSum.selfUsagePower = yearSum.selfUsagePower + result.selfUsagePower
            yearSum.selfUsagePowerBattery = yearSum.selfUsagePowerBattery + result.selfUsagePowerBattery
            yearSum.selfUsagePowerPv = yearSum.selfUsagePowerPv + result.selfUsagePowerPv
            yearSum.newBatterySoc = result.newBatterySoc
        
            
        })
        // expect(mergedPowerGeneration[dayTime].P).toBe(207450)
        // expect(consumption[dayTime].P).toBe(6874.150000000001)
        expect(yearSum).toEqual({
               "batteryLoad": 100,
               "consumptionGrid": 7017443.115791865,
               "feedInPowerGrid": 3488849.343801145,
               "missedBatteryPower": 0,
               "missedFeedInPowerGrid": 0,
               "missedInverterPower": 0,
               "newBatterySoc": 100,
               "selfUsagePower": 12522855.128756072,
               "selfUsagePowerBattery": 5269271.398256048,
               "selfUsagePowerPv": 7253583.730499969
             })

    })

})