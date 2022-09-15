/**
 * Calculate heating curve
 * @param  {Object}  
 *      @param  {Number} maxHeatTemp        max temperature to calc
 *      @param  {Number} minHeatTemp        Optional: min temperature to calc
 *      @param  {Array[Array]}   tempMap    Array of arrays with tempratures [ [0 , 40], [10 , 30] ] | First Value: outside, temprature, second value: water temprature
 * @return {Object}                         {'-25': 55, '-24': 54,5, ... '15': 35} minHeatTemp -25, maxHeatTemp 15
 */

const calcHeatingTempMap = ({maxHeatTemp = null, minHeatTemp = -25, tempMap}) => {
    if (!maxHeatTemp) throw new Error('maxHeatTemp not given')
    if (!tempMap  ) throw new Error('tempMap is not given')
    if (!Array.isArray(tempMap) ) throw new Error('tempMap is not an array')
    if (tempMap.length == 0 ) throw new Error('tempMap length must be greater then 0')
    if (!Array.isArray(tempMap[0]) ) throw new Error('tempMap elements must be also an array')
    if (!(tempMap[0].length == 2) ) throw new Error('tempMap elements must be also an array with the length of 2')

    const temps = tempMap.sort((a,b) => a[0] - b[0])

    const newTempMap = temps.reduce((prev, curr, i, arr) => {
        const currTemp = curr[0]
        const nextTemp = arr.length > i + 1 ? arr[i + 1][0] : null
        const prevTemp = i > 0 && arr.length > i ? arr[i - 1][0] : null
        const currTargetTemp = curr[1]
        const nextTargetTemp = arr.length - 1 > i ? arr[i + 1][1] : null
        const prevTargetTemp = i > 0 && arr.length > i ? arr[i - 1][1] : null
        const factor = prevTemp == null ? 
        (nextTargetTemp - currTargetTemp) / (nextTemp - currTemp) :
        (currTargetTemp - prevTargetTemp) / (currTemp - prevTemp)
        
        console.log({currTemp,nextTemp,prevTemp,currTargetTemp,nextTargetTemp, prevTargetTemp, factor})

        if (i == 0){
            for (let i = minHeatTemp; i <= currTemp; i++) {
                prev[i] = (i-currTemp)*factor+currTargetTemp
            }
        } else if (nextTemp && prevTemp) {
            for (let i = prevTemp+1; i <= currTemp; i++) {
                prev[i] = (i - currTemp)*factor + currTargetTemp
            }
        } else if (!nextTemp){
            for (let i = prevTemp+1; i <= maxHeatTemp; i++) {
                prev[i] = (i - currTemp)*factor + currTargetTemp
            }
        }
        return prev
    }, {})  

    return newTempMap
}










module.exports = {
    calcHeatingTempMap
}