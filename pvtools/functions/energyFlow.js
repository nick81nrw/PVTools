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
    energyConsumption: 433 (watts for one hour)
    batterySoC: 3450 (watthours)
    batterySocMax: 5500 (watthours)
    batterySocMin: 100 (watthours)
    batteryEfficiency / batteryLoadEfficiency: 0.99 (99%)
    batteryUnloadEfficiency (optinal): 0.99 (99%)
    maxPowerGenerationInverter (optional): 2500 (watts)
    maxPowerGenerationBattery: (optional): 3400 (watts)
    maxPowerLoadBattery (optional): 2300 (watts)
    maxPowerFeedIn (optional): 8500 (watts) for feedIn regulations (70% rule in germany)
    dayTime (optional): to identify this time
Return object:
    newBatterySoc: 3560 (watthours)
    selfUsagePowerPv: 3550 (watthours) PV-power, that used for own consumption
    selfUsagePowerBattery: 2250 (watthours) Battry-power, that used for own consumption
    selfUsagePower: 5520 (watthours) sum Pv + Battery
    feedInPowerGrid: 3445 (watthours) 
    batteryLoad: 2520 / -2520 (watthours) load/unload battery
    consumptionGrid: 2450 (watthours) 
    dayTime (optional): to identify this time

    missedFeedInPowerGrid, missedInverterPower, missedBatteryPower;


missing calculations parameters:

missing return values:
    missed feedin power wehen maxPowerFeedIn is set
    missed PV power, when maxPowerGenerationInverter is set
    missed battery power, when maxPowerLoadBattery or maxPowerGenerationBattery is set
*/

const energyFlow = ({
  energyGeneration,
  energyConsumption,
  batterySoc,
  batterySocMax,
  batterySocMin,
  batteryEfficiency,
  batteryLoadEfficiency,
  batteryUnloadEfficiency,
  maxPowerGenerationInverter,
  maxPowerGenerationBattery,
  maxPowerLoadBattery,
  maxPowerFeedIn,
  dayTime,
  regressionDb,
}) => {
  let missedInverterPower = 0,
    missedBatteryPower = 0

  const powerProduction = energyGeneration

  batteryLoadEfficiency = batteryLoadEfficiency || batteryEfficiency || 1
  batteryUnloadEfficiency = batteryUnloadEfficiency || batteryEfficiency || 1

  if (
    maxPowerGenerationInverter &&
    maxPowerGenerationInverter < energyGeneration
  ) {
    missedInverterPower = energyGeneration - maxPowerGenerationInverter
    energyGeneration = maxPowerGenerationInverter
  }

  let {
    selfUsedEnergy,
    selfUsedEnergyPV,
    gridUsedEnergy,
    selfUsedEnergyBattery,
    feedInEnergyGrid,
    lossesUnloadBattery,
    lossesLoadBattery,
    lossesPvGeneration,
    losses,
    newBatterySoc,
    missedFeedInPowerGrid,
    batteryCharge,
    batteryDischarge,
  } = calcHourWithLoadDistribution({
    regressionDb,
    energyConsumption,
    staticPowerGeneration: energyGeneration,
    maxPowerStaticInverter: maxPowerGenerationInverter,
    maxPowerDynamicInverter: maxPowerGenerationBattery,
    maxPowerLoadBattery,
    batterySoc,
    maxPowerFeedIn,
    batterySocMin,
    batterySocMax,
    batteryLoadEfficiency,
    batteryUnloadEfficiency,
  })

  return {
    // batterySoc,
    newBatterySoc,
    energyConsumption,
    powerProduction,
    selfUsedEnergy,
    selfUsedEnergyPV,
    selfUsedEnergyBattery,
    feedInEnergyGrid,
    // batteryLoad: batteryLoadEnergy,
    gridUsedEnergy,
    missedInverterPower,
    missedBatteryPower,
    missedFeedInPowerGrid,
    lossesUnloadBattery,
    lossesLoadBattery,
    lossesPvGeneration,
    losses,
    batteryCharge,
    batteryDischarge,
    dayTime: dayTime ? dayTime : '',
  }

  // if (energyGeneration > energyConsumption) {
  //     // if power generaton is more then consumption, self used power is used complete and battery SoC will be calculated
  //     selfUsagePowerPv = energyConsumption
  //     selfUsagePowerBattery = 0
  //     const excessPower = energyGeneration - energyConsumption
  //     consumptionGrid = 0

  //     if (batterySoc >= batterySocMax) {
  //         // if battery is full, all power will be feed in
  //         feedInPowerGrid = excessPower
  //         newBatterySoc = batterySoc
  //         batteryLoad = 0
  //     } else if (batterySoc + (excessPower * batteryLoadEfficiency) > batterySocMax) {
  //         // if power would overload the battery, power split into feed in and battery loading
  //         batteryLoad = batterySocMax - batterySoc
  //         if (maxPowerLoadBattery && maxPowerLoadBattery < batteryLoad) {batteryLoad = maxPowerLoadBattery}
  //         feedInPowerGrid = (excessPower - (batteryLoad)) * batteryLoadEfficiency // feedin ist reduced due the missing LoadEfficiency in battery Load
  //         newBatterySoc = batterySoc + batteryLoad
  //     } else {
  //         // if battery has enough capacity to save the power, no feed in, all power save in battery
  //         feedInPowerGrid = 0
  //         batteryLoad = excessPower * batteryLoadEfficiency
  //         if (maxPowerLoadBattery && maxPowerLoadBattery < batteryLoad) {
  //             batteryLoad = maxPowerLoadBattery
  //             feedInPowerGrid = (excessPower - batteryLoad) * batteryLoadEfficiency
  //         }
  //         newBatterySoc = batterySoc + batteryLoad
  //     }

  // }
  // else if (energyGeneration < energyConsumption) {
  //     // if power generaton is less then consumption, self used power is only the genaration and battery Soc will be calculated
  //     selfUsagePowerPv = energyGeneration
  //     feedInPowerGrid = 0
  //     const excessLoad = energyConsumption - energyGeneration

  //     if (batterySoc == batterySocMin) {
  //         // if battery is empty, full grid consumption
  //         consumptionGrid = excessLoad
  //         newBatterySoc = batterySocMin
  //         batteryLoad = 0
  //         selfUsagePowerBattery = 0

  //     } else if (batterySoc - ((excessLoad) / batteryUnloadEfficiency) < batterySocMin) {
  //         // if battery will be empty, grid consumption and battery will be splitted

  //         consumptionGrid = (excessLoad - batterySoc + batterySocMin) / batteryUnloadEfficiency
  //         newBatterySoc = batterySocMin
  //         batteryLoad = batterySocMin - batterySoc
  //         selfUsagePowerBattery = batterySoc - batterySocMin
  //         if(maxPowerGenerationBattery && maxPowerGenerationBattery < batteryLoad *-1 ) {
  //             batteryLoad = maxPowerGenerationBattery / batteryUnloadEfficiency *-1
  //             consumptionGrid = excessLoad - maxPowerGenerationBattery
  //             selfUsagePowerBattery = maxPowerGenerationBattery
  //             newBatterySoc = batterySoc + batteryLoad
  //         }

  //         // battrySoc load  batterymin
  //         //    200     500     100
  //         // 400 consumption (load(/batteryUnloadEfficiency) - batterySoc + batterySocMin )
  //     } else {
  //         // if battery has enough power, only use battery
  //         consumptionGrid = 0
  //         batteryLoad = excessLoad / batteryUnloadEfficiency * -1
  //         selfUsagePowerBattery = excessLoad
  //         if(maxPowerGenerationBattery && maxPowerGenerationBattery < batteryLoad *-1 ) {
  //             batteryLoad = maxPowerGenerationBattery / batteryUnloadEfficiency *-1
  //             consumptionGrid = excessLoad - maxPowerGenerationBattery
  //             selfUsagePowerBattery = maxPowerGenerationBattery
  //         }
  //         newBatterySoc = batterySoc + batteryLoad
  //     }

  // }
  // else if (energyGeneration == energyConsumption) {
  //     selfUsagePowerPv = energyConsumption
  //     selfUsagePowerBattery = 0
  //     newBatterySoc = batterySoc
  //     feedInPowerGrid = 0
  //     batteryLoad = 0
  //     consumptionGrid = 0

  // }

  // //
  // selfUsagePower = selfUsagePowerPv + selfUsagePowerBattery
  // if (maxPowerFeedIn < feedInPowerGrid) {
  //     missedFeedInPowerGrid = feedInPowerGrid - maxPowerFeedIn
  //     feedInPowerGrid = maxPowerFeedIn

  //     // console.log(missedFeedInPowerGrid)
  //     // console.log(maxPowerFeedIn)
  //     // console.log(feedInPowerGrid)
  // }

  // return {
  //     newBatterySoc,
  //     energyGeneration,
  //     energyConsumption,
  //     powerProduction,
  //     selfUsagePower,
  //     selfUsagePowerPv,
  //     selfUsagePowerBattery,
  //     feedInPowerGrid,
  //     batteryLoad,
  //     consumptionGrid,
  //     missedInverterPower,
  //     missedBatteryPower,
  //     missedFeedInPowerGrid,
  //     dayTime: dayTime ? dayTime : ''
  // }
}

/**
 * Calculate consumption per hour from a load profile, year and an yearly consumption
 * @param  {Object} loadProfile             Loadprofile Object {name: "SLPH0", values: [{ month: 1, weekDay: 1, dayHour: 0, partPerMonth: 0.004096433, partPerYear: 0.000406886 },...]}
 * @param  {Int}   year                     The year which should be calculated (leap year in mind)
 * @param  {Int}   consumptionKwhPerYear    Consumption in this year in kWh
 * @return {Object}                         {"20200101:00":{P:20}, "20200101:01":{P:30.5}, ...}
 */

const calculateConsumption = ({
  year,
  consumptionYear,
  profile,
  profileBase = 1000,
  factorFunction,
}) => {
  // IF profil is based on 1000kWh per year, it must be multiplied by difference of real consumption (e.g. 5000kWh = multiplier 5x)
  const consumptionFactor = consumptionYear / profileBase
  let currentDay = new Date(Date.UTC(year, 0, 1, 0, 0))
  const lastDay = new Date(Date.UTC(year + 1, 0, 1, 0, 0))

  const days = {}
  // Needed for factorFunction "Standardlastprofil BDEW"
  let dayTimer = 1

  while (currentDay <= lastDay) {
    let currentProfile = profile.find(
      (season) => new Date(season.till + '/' + year) >= currentDay,
    ) // TODO/BUG: this finds the next season one day earlier (03/21 is falsy at currentDay 03/21)

    if (!currentProfile) {
      //TODO/BUG: The date "till: 12/31" aren't find correctly.
      currentProfile = profile.find((season) => season.last)
    }

    for (let hour = 0; hour < 24; hour++) {
      const timeString = `${year}${('00' + (currentDay.getMonth() + 1)).slice(
        -2,
      )}${('00' + currentDay.getDate()).slice(-2)}:${('00' + hour).slice(-2)}`
      let consumption
      switch (
        currentDay.getDay() // find the right day for profile | 0 = sun, 1 = mon, ..., 6 = sat
      ) {
        case 0:
          consumption =
            currentProfile.profileDays['sun'][hour] ||
            currentProfile.profileDays['default'][hour]
          break
        case 6:
          consumption =
            currentProfile.profileDays['sat'][hour] ||
            currentProfile.profileDays['default'][hour]
          break

        default:
          consumption =
            currentProfile.profileDays['weekdays'][hour] ||
            currentProfile.profileDays['default'][hour]
          break
      }

      if (factorFunction) {
        // if function set, use function for "Standardlastprofil BDEW"

        days[timeString] = {
          P: factorFunction(dayTimer, consumption * consumptionFactor),
        }
      } else {
        days[timeString] = { P: consumption * consumptionFactor }
      }
    }
    currentDay.setDate(currentDay.getDate() + 1) // set one day after
    dayTimer++
  }
  return days
}

/**
 * normalize the hourly radiation from pvgis API
 * @param  {Array[Array]} hourlyRadiationArrays An Array with power generation e.g. two: [ [{ "time": "20200101:0010", "P": 20.0, ... },{ "time": "20200101:0110", "P": 20.0, ... }],[...] ]
 * @return {Array[Object]} Array with Objects in Fomrat [ [{"20200101:00":{P:20}, "20200101:01":{P:30.5}, ...}], [{...}, ...] ]
 */

const normalizeHourlyRadiation = (hourlyRadiationArray) => {
  const normRadiation = hourlyRadiationArray.reduce((prev, curr) => {
    const dateHour =
      curr.time.split(':')[0] + ':' + curr.time.split(':')[1].substr(0, 2)
    if (prev[dateHour]) {
      prev[dateHour].P += curr.P
    } else {
      prev[dateHour] = { P: curr.P, temperature: curr.T2m }
    }

    return prev
  }, {})

  return normRadiation
}

/** last Sunday of a month (0 = January) at 01:00 UTC, when the clock changes */
const lastSundayUtc = (year, month) => {
  const last = new Date(Date.UTC(year, month + 1, 0, 1))
  return last.getTime() - last.getUTCDay() * 86400000
}

/**
 * PVGIS returns the hours in UTC, but the load profiles and imported
 * consumption values use German local time (CET, CEST from the last Sunday in
 * March to the last Sunday in October). Without shifting, the PV curve would
 * be 1 hour (winter) or 2 hours (summer) too early compared to the load.
 *
 * The local hour that is skipped in spring and the hour of New Year's night
 * that comes from the previous UTC year get 0 Wh (both are at night); in
 * autumn the doubled night hour is summed.
 *
 * @param {Object} hourly normalized PVGIS values {"20200101:00": {P, temperature}, ...} in UTC
 * @param {number} year the simulated year
 * @return {Object} the same values keyed by German local time
 */
const shiftUtcToGermanTime = (hourly, year) => {
  const summerStart = lastSundayUtc(year, 2)
  const summerEnd = lastSundayUtc(year, 9)
  const pad = (value) => String(value).padStart(2, '0')
  const local = {}
  for (const [key, value] of Object.entries(hourly)) {
    const utc = Date.UTC(
      +key.slice(0, 4),
      +key.slice(4, 6) - 1,
      +key.slice(6, 8),
      +key.slice(9, 11),
    )
    const offset = utc >= summerStart && utc < summerEnd ? 2 : 1
    const date = new Date(utc + offset * 3600000)
    if (date.getUTCFullYear() !== year) continue
    const localKey = `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}:${pad(date.getUTCHours())}`
    if (local[localKey])
      local[localKey] = { ...local[localKey], P: local[localKey].P + value.P }
    else local[localKey] = { ...value }
  }
  let previous = null
  for (const key of generateDayTimeOrder(year)) {
    if (!local[key]) local[key] = { P: 0, temperature: previous?.temperature }
    previous = local[key]
  }
  return local
}

/**
 * merge powerGeneration to one summerized object
 * @param  {Array[Object]} powerGenerationArray An Array with power generation e.g. two: [ {"20200101:00":{P:20}, "20200101:01":{P:30.5}, ...}, {...} ]
 * @return {Object} Array with Objects in Fomrat {"20200101:00":{P:20}, "20200101:01":{P:30.5}, ...}
 */

const mergePowerGeneration = (powerGenerationArray) => {
  if (powerGenerationArray.length == 1) return powerGenerationArray[0]

  return powerGenerationArray.reduce((prev, curr) => {
    for (const [key, value] of Object.entries(curr)) {
      if (prev[key]) {
        prev[key].P += value.P
      } else {
        prev[key] = { P: value.P, temperature: value.temperature }
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

const generateDayTimeOrder = (year) => {
  const daysFebruary = new Date(year, 2, 0).getDate()
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  const monthLength = [31, daysFebruary, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

  const timeString = []

  months.map((month, i) => {
    const mLength = monthLength[i]
    Array.from(Array(mLength).keys()).map((day) => {
      day += 1
      Array.from(Array(24).keys()).map((hour) => {
        timeString.push(
          `${year}${('00' + month).slice(-2)}${('00' + day).slice(-2)}:${(
            '00' + hour
          ).slice(-2)}`,
        )
      })
    })
  })
  return timeString
}

/**
 * generate array with merged power generation + calculated power consumption within day time aray
 * @param  {Int} year A year: 2020
 * @return {Array} Array with Objects  [{dayTime: "20200101:00", P: 220, consumption: 350, temperature:10.3},{dayTime: "20200101:01", P: 20, consumption: 450}, ... ]
 */

const generateDayTimeValues = ({ consumption, powerGeneration, year }) => {
  return generateDayTimeOrder(year).reduce((prev, curr) => {
    if (powerGeneration[curr] && consumption[curr]) {
      return [
        ...prev,
        {
          dayTime: curr,
          P: powerGeneration[curr].P,
          temperature: powerGeneration[curr].temperature,
          consumption: consumption[curr].P,
        },
      ]
    } else {
      return prev
    }
  }, [])
}

const createRegression = ({ energyConsumption }) => {
  const multiplicator = 8
  const resulution = Math.max(
    Math.floor((energyConsumption * multiplicator) / 100 / 100) * 100,
    100,
  )
  const regressionKey = Math.floor(energyConsumption / resulution) * resulution

  const sigma1 = energyConsumption * 0.195
  const mu1 = energyConsumption / 3 + 50
  const sigma2 = energyConsumption * 0.1
  // const sigma2 = Math.max( -energyConsumption * (50/2000) + 500, 300 )
  const mu2 = energyConsumption + energyConsumption / 10

  // const powers = new Array(100).fill(0).map((e,i)=> i* resulution)
  const powers = new Array((regressionKey / resulution) * multiplicator)
    .fill(0)
    .map((e, i) => i * resulution)

  const unnorm = powers.map((power) => {
    const val =
      (1 / (sigma1 * Math.sqrt(2 * Math.PI))) *
        Math.exp(1) ** (-0.5 * ((power - mu1) / sigma1) ** 2) +
      (1 / (sigma2 * Math.sqrt(2 * Math.PI))) *
        Math.exp(1) ** (-0.5 * ((power - mu2) / sigma2) ** 2)
    return val
  })
  const sumUnnorm = unnorm.reduce((acc, curr) => acc + curr, 0)
  const regression = unnorm.reduce((acc, curr, i) => {
    acc[powers[i]] = curr * (1 / sumUnnorm)
    return acc
  }, {})

  return { regression, resulution, info: { sigma1, sigma2, mu1, mu2 } }
}

/**
 * Stores PV surplus in the battery (limited by free capacity and charging
 * power), the rest is fed into the grid (limited by the feed-in limit)
 */
const chargeBattery = ({
  surplus,
  batterySoc,
  batterySocMax,
  batteryLoadEfficiency,
  maxBatteryLoad,
  maxPowerFeedIn,
}) => {
  const freeCapacity = Math.max(batterySocMax - batterySoc, 0)
  const batteryCharge = Math.max(
    Math.min(surplus, freeCapacity / batteryLoadEfficiency, maxBatteryLoad),
    0,
  )
  const feedInEnergyGridBase = surplus - batteryCharge
  const feedInEnergyGrid = Math.min(feedInEnergyGridBase, maxPowerFeedIn)
  return {
    batteryCharge,
    newBatterySoc: batterySoc + batteryCharge * batteryLoadEfficiency,
    lossesLoadBattery: batteryCharge * (1 - batteryLoadEfficiency),
    feedInEnergyGrid,
    missedFeedInPowerGrid: feedInEnergyGridBase - feedInEnergyGrid,
  }
}

/**
 * Splits one hour between PV, battery and grid, taking into account that the
 * consumption is not constant within the hour.
 *
 * Why a load distribution? A household with 500 Wh in one hour does not draw
 * a constant 500 W: most of the time it draws 200 W, for a few minutes the
 * kettle draws 3000 W. PV with 1000 W covers the 200 W completely, but only
 * 1000 W of the 3000 W peak. With constant 500 W the PV would wrongly cover
 * everything, so an hourly balance overestimates the self consumption.
 *
 * The load distribution of an hour comes from regressionDb (key = hourly
 * consumption rounded down to 50 Wh, value = { loadPower: share of the hour })
 * or, above the database, from createRegression().
 *
 * Calculation for one hour (all energies in Wh, powers in W, 1 h = 1 Wh/W):
 *
 * 1. Load levels: every entry of the distribution is a load level L_i (the
 *    middle of its 50 W step) that occurs during the share w_i of the hour
 *    (Σ w_i = 1). The levels are scaled so that their mean equals the hourly
 *    consumption E:  L_i = (P_i + Δ) · E / Σ w_j (P_j + Δ),  Σ w_i · L_i = E
 * 2. PV is constant during the hour. The inverter delivers at most
 *    PV · η on the AC side (η = efficiency at this load, calcInverterEfficiency).
 *    Load level i is covered up to that power:
 *      pvAc_i = min(L_i, PV · η),  PV energy used = Σ w_i · pvAc_i,
 *      inverter losses = Σ w_i · pvAc_i · (1 / η - 1)
 * 3. The rest of each load level is wanted from the battery, limited by the
 *    discharge power (or the free power of a shared inverter):
 *      battery demand = Σ w_i · min(L_i - pvAc_i, maxDischargePower)
 *    The battery delivers this demand as far as its state of charge above the
 *    minimum allows, minus the discharge efficiency.
 * 4. PV that is not used directly (PV - Σ w_i · pvAc_i / η) charges the
 *    battery (chargeBattery), the rest is fed in or curtailed by the feed-in
 *    limit.
 * 5. Whatever is left of the consumption comes from the grid.
 *
 * Charging and discharging within the same hour is intended: the battery
 * covers the peaks while the PV surplus of the calm minutes charges it.
 *
 * Example: E = 500 Wh, PV = 10000 Wh → every load level is below PV · η, so
 * the whole consumption is covered by PV and nothing comes from the grid.
 * (The previous calculation capped the coverage at the hourly mean of
 * 500 W and still drew about 25 % from the grid.)
 *
 * @param {Object} params
 * @param {Object} params.regressionDb load distributions per hourly consumption
 * @param {number} params.energyConsumption consumption of the hour in Wh
 * @param {number} params.staticPowerGeneration PV generation of the hour in Wh (after inverter clipping)
 * @param {number} params.maxPowerStaticInverter AC power of the PV inverter in W, 0 = unlimited
 * @param {number} params.maxPowerDynamicInverter discharge power of the battery in W, 0 = unlimited
 * @param {number} params.maxPowerLoadBattery charge power of the battery in W, 0 = unlimited
 * @param {number} params.maxPowerFeedIn feed-in limit in W
 * @param {number} params.batterySoc state of charge at the start of the hour in Wh
 * @param {number} params.batterySocMin minimum state of charge in Wh
 * @param {number} params.batterySocMax capacity in Wh
 * @param {number} params.batteryLoadEfficiency charging efficiency (0..1)
 * @param {number} params.batteryUnloadEfficiency discharging efficiency (0..1)
 * @return {Object} energy flows of the hour in Wh, see energyFlow()
 */
const calcHourWithLoadDistribution = ({
  regressionDb,
  energyConsumption,
  staticPowerGeneration = 0,
  maxPowerStaticInverter = 0,
  maxPowerDynamicInverter = 0,
  batterySoc = 0,
  batteryUnloadEfficiency = 1,
  batteryLoadEfficiency = 1,
  batterySocMin = 0,
  batterySocMax,
  maxPowerLoadBattery = 0,
  maxPowerFeedIn = 9999999,
}) => {
  const pv = Math.max(staticPowerGeneration, 0)
  const maxBatteryLoad =
    maxPowerLoadBattery > 0 ? maxPowerLoadBattery : Infinity

  // no consumption in this hour: all generation is stored or fed in
  if (!(energyConsumption > 0)) {
    const charged = chargeBattery({
      surplus: pv,
      batterySoc,
      batterySocMax,
      batteryLoadEfficiency,
      maxBatteryLoad,
      maxPowerFeedIn,
    })
    return {
      selfUsedEnergy: 0,
      selfUsedEnergyPV: 0,
      selfUsedEnergyBattery: 0,
      gridUsedEnergy: 0,
      lossesUnloadBattery: 0,
      lossesPvGeneration: 0,
      batteryDischarge: 0,
      ...charged,
      losses: charged.lossesLoadBattery,
    }
  }

  // discharge power: battery inverter, or what the shared PV inverter has left
  let maxDischargePower = Infinity
  if (maxPowerDynamicInverter > 0) maxDischargePower = maxPowerDynamicInverter
  else if (maxPowerStaticInverter - pv > 0)
    maxDischargePower = maxPowerStaticInverter - pv

  // 1. load levels of this hour, scaled to the hourly consumption
  const regressionKey = Math.floor(energyConsumption / 50) * 50
  const bigConsumption = regressionDb[regressionKey]
    ? null
    : createRegression({ energyConsumption })
  const distribution = bigConsumption
    ? bigConsumption.regression
    : regressionDb[regressionKey]
  // the middle of a step, e.g. 75 W for the step 50..100 W
  const stepMiddle = bigConsumption
    ? Math.floor(bigConsumption.resulution / 2)
    : 25
  const levels = Object.entries(distribution).map(([power, share]) => ({
    share,
    power: parseInt(power) + stepMiddle,
  }))
  const meanPower = levels.reduce((sum, l) => sum + l.share * l.power, 0)
  const scale = energyConsumption / meanPower

  // 2. + 3. PV covers every load level up to its AC power, the battery
  //         is asked for the rest (limited by its discharge power)
  const inverterEfficiency = calcInverterEfficiency({
    maxPowerGenerationInverter: maxPowerStaticInverter,
    power: pv,
  })
  const pvAcPower = pv * inverterEfficiency
  let selfUsedEnergyPV = 0
  let batteryDemand = 0
  for (const level of levels) {
    const load = level.power * scale
    const fromPv = Math.min(load, pvAcPower)
    selfUsedEnergyPV += level.share * fromPv
    batteryDemand += level.share * Math.min(load - fromPv, maxDischargePower)
  }
  const pvUsedDc = selfUsedEnergyPV / inverterEfficiency
  const lossesPvGeneration = pvUsedDc - selfUsedEnergyPV

  // 3. discharge, never below the minimum state of charge
  const usableBatteryEnergy = Math.max(batterySoc - batterySocMin, 0)
  const batteryDischarge = Math.min(batteryDemand, usableBatteryEnergy)
  const selfUsedEnergyBattery = batteryDischarge * batteryUnloadEfficiency
  const lossesUnloadBattery = batteryDischarge - selfUsedEnergyBattery

  // 4. PV surplus charges the battery, the rest is fed in
  const {
    batteryCharge,
    newBatterySoc,
    lossesLoadBattery,
    feedInEnergyGrid,
    missedFeedInPowerGrid,
  } = chargeBattery({
    surplus: Math.max(pv - pvUsedDc, 0),
    batterySoc: batterySoc - batteryDischarge,
    batterySocMax,
    batteryLoadEfficiency,
    maxBatteryLoad,
    maxPowerFeedIn,
  })

  // 5. the rest comes from the grid
  const selfUsedEnergy = selfUsedEnergyPV + selfUsedEnergyBattery
  const gridUsedEnergy = energyConsumption - selfUsedEnergy

  return {
    selfUsedEnergy,
    selfUsedEnergyPV,
    selfUsedEnergyBattery,
    gridUsedEnergy,
    feedInEnergyGrid,
    missedFeedInPowerGrid,
    lossesPvGeneration,
    lossesUnloadBattery,
    lossesLoadBattery,
    losses: lossesLoadBattery + lossesUnloadBattery + lossesPvGeneration,
    newBatterySoc,
    batteryCharge,
    batteryDischarge,
    staticInverterEfficiency: inverterEfficiency,
  }
}

/*
 * DEACTIVATED (10/2026), replaced by calcHourWithLoadDistribution() above.
 * Kept for reference. Problems of this calculation:
 * - PV covered the load levels of the hour only up to min(consumption, PV),
 *   i.e. up to the hourly mean instead of the PV power. Even a large PV
 *   system drew 20 - 40 % of the consumption from the grid in sunny hours,
 *   which underestimated the self consumption and overestimated the battery.
 * - The load levels were not scaled to the hourly consumption; above about
 *   3000 Wh/h their mean is too low because the database ends at 5 kW.
 * - The inverter losses were counted as missing consumption (taken from the
 *   grid or battery) instead of as additional PV energy.
 *
const regressionCalc = ({
  regressionDb,
  energyConsumption,
  staticPowerGeneration = 0,
  maxPowerStaticInverter = 0,
  maxPowerDynamicInverter = 0,
  batterySoc = 0,
  batteryUnloadEfficiency = 1,
  batteryLoadEfficiency = 1,
  batterySocMin = 0,
  batterySocMax,
  maxPowerLoadBattery = 0,
  maxPowerFeedIn = 9999999,
}) => {
  const maxBatteryLoad =
    maxPowerLoadBattery > 0 ? maxPowerLoadBattery : Infinity

  let freePowerDynamicGeneration = 0
  if (maxPowerDynamicInverter > 0)
    freePowerDynamicGeneration = maxPowerDynamicInverter
  else if (maxPowerStaticInverter - staticPowerGeneration > 0)
    freePowerDynamicGeneration = maxPowerStaticInverter - staticPowerGeneration
  else freePowerDynamicGeneration = 99999999

  if (!(energyConsumption > 0)) {
    // no consumption in this hour: all generation is stored or fed in
    const charged = chargeBattery({
      surplus: Math.max(staticPowerGeneration, 0),
      batterySoc,
      batterySocMax,
      batteryLoadEfficiency,
      maxBatteryLoad,
      maxPowerFeedIn,
    })
    return {
      selfUsedEnergy: 0,
      selfUsedEnergyPV: 0,
      selfUsedEnergyBattery: 0,
      gridUsedEnergy: 0,
      lossesUnloadBattery: 0,
      lossesPvGeneration: 0,
      batteryDischarge: 0,
      ...charged,
      losses: charged.lossesLoadBattery,
    }
  }

  const multiplicator = Math.min(energyConsumption, staticPowerGeneration)

  const staticInverterEfficiency = calcInverterEfficiency({
    maxPowerGenerationInverter: maxPowerStaticInverter,
    power: staticPowerGeneration,
  })
  // const lastRegression = Object.keys(regressionDb)[Object.keys(regressionDb).length-1]
  const regressionKey = Math.floor(energyConsumption / 50) * 50
  const regressionBigConsumption = !regressionDb[regressionKey]
    ? createRegression({ energyConsumption })
    : null
  const regression = regressionDb[regressionKey]
    ? regressionDb[regressionKey]
    : regressionBigConsumption.regression

  const powerDelta = regressionBigConsumption
    ? Math.floor(regressionBigConsumption.resulution / 2)
    : 25 // use the mid of two regressen keys. e.g. 50,100,150 > use 75,125,175

  const {
    usedEnergyPv,
    usedEnergyPvBase,
    usedEnergyBattery,
    usedEnergyBatteryBase,
    usedPv,
  } = Object.keys(regression).reduce(
    (acc, curr) => {
      const power = parseInt(curr)
      const value = regression[curr]
      const usedPv = Math.min((power + powerDelta) / multiplicator, 1)
      const usedEnergyPvBase = usedPv * value * multiplicator
      const usedEnergyPv =
        usedPv * value * staticInverterEfficiency * multiplicator

      const splitConsumption = value * energyConsumption
      const energyForBattery = splitConsumption - usedEnergyPv
      const usedBattery = Math.min(
        freePowerDynamicGeneration / (power + powerDelta),
        1,
      )

      const usedEnergyBatteryBase = usedPv * value * staticPowerGeneration
      const usedEnergyBattery = usedBattery * energyForBattery

      return {
        usedEnergyPv: acc.usedEnergyPv + usedEnergyPv,
        usedEnergyPvBase: acc.usedEnergyPvBase + usedEnergyPvBase,
        usedEnergyBattery: acc.usedEnergyBattery + usedEnergyBattery,
        usedEnergyBatteryBase:
          acc.usedEnergyBatteryBase + usedEnergyBatteryBase,
        usedPv: acc.usedPv + usedPv,
      }
    },
    {
      usedEnergyPv: 0,
      usedEnergyPvBase: 0,
      usedEnergyBattery: 0,
      usedEnergyBatteryBase: 0,
      usedPv: 0,
    },
  )

  const selfUsedEnergyPV = usedEnergyPv
  const lossesPvGeneration = usedEnergyPvBase - selfUsedEnergyPV
  const overflowPv = Math.max(staticPowerGeneration - usedEnergyPvBase, 0)

  // discharge, the battery must not go below its minimum state of charge
  const usableBatteryEnergy = Math.max(batterySoc - batterySocMin, 0)
  const batteryDischarge = Math.min(usedEnergyBattery, usableBatteryEnergy)
  const selfUsedEnergyBattery = batteryDischarge * batteryUnloadEfficiency
  const lossesUnloadBattery = batteryDischarge - selfUsedEnergyBattery

  const {
    batteryCharge,
    newBatterySoc,
    lossesLoadBattery,
    feedInEnergyGrid,
    missedFeedInPowerGrid,
  } = chargeBattery({
    surplus: overflowPv,
    batterySoc: batterySoc - batteryDischarge,
    batterySocMax,
    batteryLoadEfficiency,
    maxBatteryLoad,
    maxPowerFeedIn,
  })

  const selfUsedEnergy = selfUsedEnergyBattery + selfUsedEnergyPV
  const gridUsedEnergy = energyConsumption - selfUsedEnergy
  const losses = lossesLoadBattery + lossesUnloadBattery + lossesPvGeneration

  return {
    selfUsedEnergy,
    selfUsedEnergyPV,
    usedEnergyPvBase,
    gridUsedEnergy,
    selfUsedEnergyBattery,
    feedInEnergyGrid,
    lossesUnloadBattery,
    lossesLoadBattery,
    lossesPvGeneration,
    missedFeedInPowerGrid,
    losses,
    newBatterySoc,
    batteryCharge,
    batteryDischarge,
    staticInverterEfficiency,
    usedPv,
    usedEnergyBatteryBase,
  }
}
*/

const calcInverterEfficiency = ({ maxPowerGenerationInverter, power }) => {
  const inverterEfficiency = {
    0: 0.8667,
    10: 0.8667,
    20: 0.9103,
    30: 0.9207,
    50: 0.9295,
    75: 0.9291,
    101: 0.9304,
  }

  if (!maxPowerGenerationInverter || maxPowerGenerationInverter == 0) {
    return inverterEfficiency[101]
  }
  const usedPower = Math.min(power / maxPowerGenerationInverter, 1) * 100
  const getCorrectEfficiencyKey =
    Object.keys(inverterEfficiency).find((val) => val >= usedPower) || 0

  return inverterEfficiency[getCorrectEfficiencyKey]
}

export {
  energyFlow,
  calculateConsumption,
  normalizeHourlyRadiation,
  mergePowerGeneration,
  shiftUtcToGermanTime,
  generateDayTimeValues,
  generateDayTimeOrder,
  calcHourWithLoadDistribution,
  createRegression,
}
