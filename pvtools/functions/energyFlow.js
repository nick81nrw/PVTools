
/*
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

        console.log(missedFeedInPowerGrid)
        console.log(maxPowerFeedIn)
        console.log(feedInPowerGrid)
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



module.exports = energyFlow