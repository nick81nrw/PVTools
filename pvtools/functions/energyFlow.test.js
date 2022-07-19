const energyFlow = require('./energyFlow')

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
    
    test.only('pv generation is more than inverter max power generation', () => {
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



