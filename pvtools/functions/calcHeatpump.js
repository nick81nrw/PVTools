/**
 * Calculate heating curve
 * @param  {Object}
 *      @param  {Number} maxHeatTemp        max temperature to calc
 *      @param  {Number} minHeatTemp        Optional: min temperature to calc
 *      @param  {Array[Array]}   tempMap    Array of arrays with tempratures [ [0 , 40], [10 , 30] ] | First Value: outside, temprature, second value: water temprature
 * @return {Object}                         {'-25': 55, '-24': 54,5, ... '15': 35} minHeatTemp -25, maxHeatTemp 15
 */

const calcHeatingTempMap = ({
  maxHeatTemp = null,
  minHeatTemp = -25,
  tempMap,
}) => {
  if (!maxHeatTemp) throw new Error('maxHeatTemp not given')
  if (!tempMap) throw new Error('tempMap is not given')
  if (!Array.isArray(tempMap)) throw new Error('tempMap is not an array')
  if (tempMap.length == 0)
    throw new Error('tempMap length must be greater then 0')
  if (!Array.isArray(tempMap[0]))
    throw new Error('tempMap elements must be also an array')
  if (!(tempMap[0].length == 2))
    throw new Error(
      'tempMap elements must be also an array with the length of 2',
    )

  const temps = tempMap.sort((a, b) => a[0] - b[0])

  const newTempMap = temps.reduce((prev, curr, i, arr) => {
    const currTemp = curr[0]
    const nextTemp = arr.length > i + 1 ? arr[i + 1][0] : null
    const prevTemp = i > 0 && arr.length > i ? arr[i - 1][0] : null
    const currTargetTemp = curr[1]
    const nextTargetTemp = arr.length - 1 > i ? arr[i + 1][1] : null
    const prevTargetTemp = i > 0 && arr.length > i ? arr[i - 1][1] : null
    const factor =
      prevTemp == null
        ? (nextTargetTemp - currTargetTemp) / (nextTemp - currTemp)
        : (currTargetTemp - prevTargetTemp) / (currTemp - prevTemp)

    // console.log({currTemp,nextTemp,prevTemp,currTargetTemp,nextTargetTemp, prevTargetTemp, factor})

    if (i == 0) {
      for (let i = minHeatTemp; i <= currTemp; i++) {
        prev[i] = (i - currTemp) * factor + currTargetTemp
      }
    } else if (nextTemp && prevTemp) {
      for (let i = prevTemp + 1; i <= currTemp; i++) {
        prev[i] = (i - currTemp) * factor + currTargetTemp
      }
    } else if (!nextTemp) {
      for (let i = prevTemp + 1; i <= maxHeatTemp; i++) {
        prev[i] = (i - currTemp) * factor + currTargetTemp
      }
    }
    return prev
  }, {})

  return newTempMap
}

const calcHeatEfficiencyMap = ({
  maxHeatTemp,
  minHeatTemp,
  maxTargetTemp,
  minTargetTemp,
  efficiencyMap,
}) => {
  if (!maxHeatTemp) throw new Error('maxHeatTemp not given')
  if (!minHeatTemp) throw new Error('minHeatTemp not given')
  if (!maxTargetTemp) throw new Error('maxTargetTemp not given')
  if (!minTargetTemp) throw new Error('minTargetTemp not given')
  if (!efficiencyMap) throw new Error('efficiencyMap is not given')
  if (!Array.isArray(efficiencyMap))
    throw new Error('efficiencyMap is not an array')

  const sameTemp = efficiencyMap
    .filter((val, i, arr) => arr.filter((v) => v[0] == val[0]).length > 1)
    .sort((a, b) => a[1] - b[1])
  const sameHeatTemp = efficiencyMap
    .filter((val, i, arr) => arr.filter((v) => v[1] == val[1]).length > 1)
    .sort((a, b) => a[0] - b[0])

  if (sameTemp.length < 2)
    throw new Error(
      'efficiencyMap need two efficiency values with same temprature',
    )
  if (sameHeatTemp.length < 2)
    throw new Error(
      'efficiencyMap need two efficiency values with same heat temprature',
    )

  const tempBase = sameTemp[0][0]
  const tempBaseEfficiency = sameTemp[0][2]
  const tempBaseEfficiencyHigh = sameTemp[1][2]
  const tempTargetBase = sameTemp[0][1]
  const tempTargetBaseHigh = sameTemp[1][1]
  const efficiencyPerTemp =
    (sameHeatTemp[sameTemp.length - 1][2] - sameHeatTemp[0][2]) /
    (sameHeatTemp[sameTemp.length - 1][0] - sameHeatTemp[0][0])
  const efficiencyPerTargetTemp =
    (sameTemp[0][2] - sameTemp[sameTemp.length - 1][2]) /
    (sameTemp[sameTemp.length - 1][1] - sameTemp[0][1])

  // console.log({
  //     tempBase,
  //     tempBaseEfficiency,
  //     tempTargetBase,
  //     tempTargetBaseHigh,
  //     tempBaseEfficiencyHigh,
  //     efficiencyPerTemp,
  //     efficiencyPerTargetTemp,
  //     sameTemp,
  //     sameHeatTemp
  // })

  let tempTargetBaseMap = {}
  for (let i = minHeatTemp; i <= maxHeatTemp; i++) {
    tempTargetBaseMap[i] =
      (i - tempBase) * efficiencyPerTemp + tempBaseEfficiency
  }

  let newEfficiencyMap = Object.keys(tempTargetBaseMap).reduce((prev, curr) => {
    for (let temp = minTargetTemp; temp <= maxTargetTemp; temp++) {
      let efficiencyLow =
        tempBaseEfficiency + (curr - tempBase) * efficiencyPerTemp
      let efficiencyHigh =
        tempBaseEfficiencyHigh + (curr - tempBase) * efficiencyPerTargetTemp
      let efficiencyDelta =
        (efficiencyLow - efficiencyHigh) / (tempTargetBaseHigh - tempTargetBase)

      prev[temp] = {
        ...prev[temp],
        [curr]: efficiencyLow - (temp - tempTargetBase) * efficiencyDelta,
      }

      // console.log(curr, obj, efficiencyLow, efficiencyHigh, efficiencyDelta)
      // console.log(tempBaseEfficiency, temp, tempBase, efficiencyPerTemp)
    }
    // console.log(prev, curr)
    return prev
  }, {})

  return newEfficiencyMap
}

const calcDayHeat = ({ tempArr, yearlyHeatConsumption }) => {}

module.exports = {
  calcHeatingTempMap,
  calcHeatEfficiencyMap,
  calcDayHeat,
}
