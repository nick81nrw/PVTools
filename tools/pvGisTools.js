
const { default: axios } = require('axios')
const { ConcurrencyManager } = require("axios-concurrency");


const MAX_CONCURRENT_REQUESTS = 8;
const PVGisApi = axios.create()
const manager = ConcurrencyManager(PVGisApi, MAX_CONCURRENT_REQUESTS);

const aspects = [-90,-75,-60,-45,-30,-15,0,15,30,45,60,75,90]
const angles = [0,15,30,35,40,45]
const peakpowers = [2000,4000,6000,8000,10000,12000,14000,16000]
const batterySizes = [1,1000,2000,4000,6000,8000,10000,12000,14000,16000,18000,20000]
const consumptionOnYear = [2000,3000,4000,5000,6000,7000,8000]


const getPVGisData = (url,{CityId, ProfileId}) => {
    
    return PVGisApi.get(url).then(response => {
        // console.log(response)
        const inputs = response.data.inputs
        const outputs = response.data.outputs
        const dbData = {
            aspect: inputs['mounting_system'].fixed.azimuth.value,
            angle: inputs['mounting_system'].fixed.slope.value,
            peakpower: inputs['pv_module']['peak_power'],
            battery_size: inputs.battery.capacity,
            self_used_power: outputs.monthly.reduce((p,c) => p + c.E_d,0) * 30.4 / 1000, 
            fed_in_power: outputs.monthly.reduce((p,c) => p + c.E_lost_d,0) * 30.4 / 1000,
            consumption_avg_day: inputs.consumption.daily,
            total_avg_lost: outputs.totals.E_lost,
            total_avg_miss: outputs.totals.E_miss,
            ...convertMonthly(outputs.monthly),
            CityId,
            ProfileId
        }
        return dbData
    })
}


const convertPowerProfile = (profile, dailyConsumtion) => {
    const keys = Object.keys(profile)
        .filter(e => e.startsWith('H_'))
    
    return keys.map(key => profile[key]).join(',')
}

const convertMonthly = arr => {

    return arr.reduce((p, c) => {
        const mon = (c.month < 10 ? '0' + c.month : c.month)
        return {...p,
                [`mon${mon}_avg_prod`]: c.E_d,
                [`mon${mon}_avg_lost`]: c.E_lost_d,
                [`mon${mon}_percentage_days_full`]: c.f_f,
                [`mon${mon}_percentage_days_empty`]: c.f_e
            }

    }, {})
}



const urlBuilder = ({aspect,angle,peakpower,batterySize,consumption, lat, lon, hourconsumption}) => {
    return ['https://re.jrc.ec.europa.eu/api/SHScalc?',
                'outputformat=json&raddatabase=PVGIS-SARAH&',
                `angle=${angle}&aspect=${aspect}&lat=${lat}&lon=${lon}&`,
                `peakpower=${peakpower}&batterysize=${batterySize}&consumptionday=${consumption}&cutoff=1&`,
                `hourconsumption=${hourconsumption}`
            ].join('')
    
}


const createUrls = ({hourconsumption, lat, lng}) => {
    const urls = []
    aspects.map(aspect=>{
        angles.map(angle =>{
            peakpowers.map(peakpower=>{
                batterySizes.map(batterySize =>{
                    consumptionOnYear.map(consumption => {
                        urls.push(urlBuilder({
                            aspect,angle,peakpower,batterySize,consumption, lat, lng, hourconsumption
                        }))
                    })
                })
            })
        })
    })
    return urls

}


module.exports = {
    createUrls,
    urlBuilder,
    convertMonthly,
    convertPowerProfile,
    batterySizes,
    getPVGisData
}