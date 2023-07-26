const {energyFlow, calculateConsumption, normalizeHourlyRadiation, mergePowerGeneration} = require('./energyFlow')

const seriescalc = require('./seriescalc.json')
const seriescalc2 = require('./seriescalc2.json')

const normalizedHR = normalizeHourlyRadiation(seriescalc.outputs.hourly)
const normalizedHR2 = normalizeHourlyRadiation(seriescalc2.outputs.hourly)


describe('testNormalize function',()=>{
    test('check P and temperature values', () => {

        expect(Object.keys(normalizedHR).length).toBe(8784)
        expect(normalizedHR['20200505:15']).toEqual({"P": 3443.82, "temperature": 22.81})

    })

})

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
            dayTime: "",
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
            dayTime:""
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
            dayTime:""
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
            dayTime:""
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
            dayTime:""
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
            dayTime:""
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
            dayTime:""
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
            dayTime:""
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
            dayTime:""
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
            dayTime:""
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
            dayTime:""
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
            dayTime:""
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
            dayTime:""
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
            dayTime:""
        })
    })
})







describe('norm hourly radiation', () => {
    
    test('result is an object', () => {
        expect(typeof normalizedHR).toBe('object')
    })
    test('all results is are object', () => {
        [normalizedHR, normalizedHR2].forEach(e => {
            expect(typeof e).toBe('object')
        });
    })
    test('results should be the right length in leap year 2020', () => {
        expect(Object.keys(normalizedHR).length).toBe(366 * 24)
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
        expect(normalizedHR['20200308:13'].P).toBe(3065.16)
    })


})




describe('merge powergeneration arrays', () => {
    const result = mergePowerGeneration([normalizedHR,normalizedHR2])
    const oneResult = mergePowerGeneration([normalizedHR])

    // normalizedHR.map(obj => console.log(obj['20200515:14']))

    test('merge only one power generation object', () => {
        expect(typeof oneResult).toBe('object')
    })
    test('merge only one power generation object, find one key', () => {
        expect(oneResult['20200308:13']).toEqual({"P": 3065.16,"temperature": 12.84})
        expect(result['20200308:13']).toEqual({"P": 5861.82,"temperature": 12.84})
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





// describe.skip('integration tests energyFlow', () => {
//     const consumption = calculateConsumption(loadProfile, 2020, 4500)
//     const mergedPowerGeneration = mergePowerGeneration(normalizedHR)
//     const dayTimeOrder = generateDayTimeOrder(2020)

//     test('test one energy flow result', () => {

//         const dayTime = '20200518:18'
//         // console.log(consumption[dayTime])
//         const result = energyFlow({
//             powerGeneration: mergedPowerGeneration[dayTime].P, //473.34000000000003
//             powerConsumption: consumption[dayTime].P, //3093.3675000000003
//             batterySoc:5000, 
//             batterySocMax: 10000, 
//             batterySocMin: 100, 
//             batteryEfficiency: .99, 
//         })
//         expect(consumption[dayTime].P).toBe(3093.3675000000003)
//         expect(mergedPowerGeneration[dayTime].P).toBe(473.34000000000003)
//         expect(result).toEqual({
//                "batteryLoad": -4900,
//                "consumptionGrid": 1515.9696969696975,
//                "feedInPowerGrid": 0,
//                "missedBatteryPower": 0,
//                "missedFeedInPowerGrid": 0,
//                "missedInverterPower": 0,
//                "newBatterySoc": 100,
//                "selfUsagePower": 5373.34,
//                "selfUsagePowerBattery": 4900,
//                "selfUsagePowerPv": 473.34000000000003,
//              })

//     })
    
//     test('test a year in energy flow', () => {
        
//         let yearSum = {
//             "batteryLoad": 0,
//             "consumptionGrid": 0,
//             "feedInPowerGrid": 0,
//             "missedBatteryPower": 0,
//             "missedFeedInPowerGrid": 0,
//             "missedInverterPower": 0,
//             "newBatterySoc": 0,
//             "selfUsagePower": 0,
//             "selfUsagePowerBattery": 0,
//             "selfUsagePowerPv": 0,
//         }

//         dayTimeOrder.forEach(key => {

//             const result = energyFlow({
//                 powerGeneration: mergedPowerGeneration[key].P, 
//                 powerConsumption: consumption[key].P, 
//                 batterySoc: yearSum.newBatterySoc, 
//                 batterySocMax: 20000, 
//                 batterySocMin: 100, 
//                 batteryEfficiency: .99, 
//             })

//             yearSum.batteryLoad = yearSum.batteryLoad + result.batteryLoad
//             yearSum.consumptionGrid = yearSum.consumptionGrid + result.consumptionGrid
//             yearSum.feedInPowerGrid = yearSum.feedInPowerGrid + result.feedInPowerGrid
//             yearSum.missedBatteryPower = yearSum.missedBatteryPower + result.missedBatteryPower
//             yearSum.missedFeedInPowerGrid = yearSum.missedFeedInPowerGrid + result.missedFeedInPowerGrid
//             yearSum.missedInverterPower = yearSum.missedInverterPower + result.missedInverterPower
//             yearSum.selfUsagePower = yearSum.selfUsagePower + result.selfUsagePower
//             yearSum.selfUsagePowerBattery = yearSum.selfUsagePowerBattery + result.selfUsagePowerBattery
//             yearSum.selfUsagePowerPv = yearSum.selfUsagePowerPv + result.selfUsagePowerPv
//             yearSum.newBatterySoc = result.newBatterySoc
        
            
//         })
//         // expect(mergedPowerGeneration[dayTime].P).toBe(207450)
//         // expect(consumption[dayTime].P).toBe(6874.150000000001)
//         expect(yearSum).toEqual({
//                "batteryLoad": 100,
//                "consumptionGrid": 7017443.115791865,
//                "feedInPowerGrid": 3488849.343801145,
//                "missedBatteryPower": 0,
//                "missedFeedInPowerGrid": 0,
//                "missedInverterPower": 0,
//                "newBatterySoc": 100,
//                "selfUsagePower": 12522855.128756072,
//                "selfUsagePowerBattery": 5269271.398256048,
//                "selfUsagePowerPv": 7253583.730499969
//              })

//     })

// })