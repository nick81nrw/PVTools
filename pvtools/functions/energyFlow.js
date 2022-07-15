
/*
Parameters object:
    powerGeneration: 503 (watts for one hour)
    powerConsumption: 433 (watts for one hour)
    batterySoC: 3450 (watthours)
    batterySocMax: 5500 (watthours)
    batterySocMin: 100 (watthours)
    batteryEfficiency: 0.99 (99%)
Return object:
    newBatterySoc: 3560 (watthours)
    selfUsagePowerPv: 3550 (watthours) PV-power, that used for own consumption
    selfUsagePowerBattery: 2250 (watthours) Battry-power, that used for own consumption
    selfUsagePower: 5520 (watthours) sum Pv + Battery
    feedInPowerGrid: 3445 (watthours) 
    batteryLoad: 2520 / -2520 (watthours) load/unload battery
    consumptionGrid: 2450 (watthours) 


missing calculations parameters:
    - Max power generation inverter
    - Max load/unload power battery
*/



const energyFlow = ( {powerGeneration, powerConsumption, batterySoc, batterySocMax, batterySocMin, batteryEfficiency} ) => {
    let selfUsagePowerPv, selfUsagePowerBattery, selfUsagePower, newBatterySoc, feedInPowerGrid, consumptionGrid, batteryLoad
    const batteryLost = 1 - batteryEfficiency + 1
    
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
        } else if (batterySoc + (excessPower * batteryEfficiency) > batterySocMax) {
            // if power would overload the battery, power split into feed in and battery loading
            batteryLoad = batterySocMax - batterySoc
            // (excessPower - feedInPowerGrid) 
            feedInPowerGrid = (excessPower - (batterySocMax - batterySoc)) * batteryEfficiency
            newBatterySoc = batterySoc + batteryLoad
        } else {
            // if battery hat enough capacity to save the power, no feed in, all power save in battry
            feedInPowerGrid = 0
            batteryLoad = excessPower * batteryEfficiency
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
            consumptionGrid = (excessLoad - batterySoc + batterySocMin) 
            newBatterySoc = batterySocMin
            batteryLoad = 0
            selfUsagePowerBattery = 0

        } else if (batterySoc - (excessLoad * batteryLost) < batterySocMin) {
            // if battery will be empty, grid consumption and battery will be splitted 
            
            consumptionGrid = (excessLoad - batterySoc + batterySocMin) * batteryLost
            newBatterySoc = batterySocMin
            batteryLoad = batterySocMin - batterySoc
            selfUsagePowerBattery = batterySoc - batterySocMin
            
            // battrySoc load  batterymin
            //    200     500     100
            // 400 consumption (load(*batteryLost) - batterySoc + batterySocMin )
        } else {
            // if battery has enough power, only use battery
            consumptionGrid = 0
            batteryLoad = excessLoad * batteryLost * -1
            selfUsagePowerBattery = excessLoad
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

    return {
        newBatterySoc,
        selfUsagePower,
        selfUsagePowerPv,
        selfUsagePowerBattery,
        feedInPowerGrid,
        batteryLoad,
        consumptionGrid
    }

}



module.exports = energyFlow