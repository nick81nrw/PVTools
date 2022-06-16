const {Op} = require('sequelize')

const { default: axios } = require('axios')
const { ConcurrencyManager } = require("axios-concurrency");

const {Models} = require('./db')
const {createUrls, convertPowerProfile, convertMonthly} = require('./tools/pvGisTools')

const MAX_CONCURRENT_REQUESTS = 8;
const api = axios.create()
const manager = ConcurrencyManager(api, MAX_CONCURRENT_REQUESTS);

const getMainData = async () => {
    const cities = await Models.City.findAll({where: {
                                                    population: {[Op.between]:[100000, 200000]}
                                                
                                                
                                            }}) 
    const profile = await Models.Profile.findOne()
    const profileString = convertPowerProfile(profile)
    console.log(cities.map(v=> v.dataValues.city))
    console.log(cities.length)
    const connections = cities.map(city => {
        const urls = createUrls({lat:city.center_lat, lng:city.center_lon, hourconsumption: profileString})
        return {
            urls,
            CityId:city.id,
            ProfileId:profile.id
        }
    })

    console.log(connections.reduce((p,c)=> p + c.urls.length,0))
    // return
    connections.forEach(conn => {
        setTimeout(()=>{

            getPVGisData(conn)
        },15000)
    })
    
}



const getPVGisData = async (conn) => {


    conn.urls.forEach(url => {
        api.get(url).then(async response => {
            // console.log(response)
            const inputs = response.data.inputs
            const outputs = response.data.outputs
            const dbData = await Models.Data.create({
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
                CityId:conn.CityId,
                ProfileId: conn.ProfileId
            })
        })
    })

}
getMainData()