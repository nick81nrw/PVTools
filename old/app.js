require('dotenv').config()

const path = require('path')
const express = require('express')
const cors = require('cors')
const { validationResult } = require('express-validator');

const {Models, Op} = require('./db')

const {getDataSchema} = require('./tools/validators');
const { urlBuilder, batterySizes, convertPowerProfile, getPVGisData } = require('./tools/pvGisTools');

const PORT = 3001
const app = express()

app.use(cors())
app.use(express.json())
app.use('/static',express.static(path.join(__dirname, "client", "build", "static")));

app.get(/^(?!\/api).*/i, (req,res,next)=> {
    console.log(path.join(__dirname, "client", "build", "index.html"))
    if (process.env.NODE_ENV === 'production') {
        return res.sendFile(path.join(__dirname, "client", "build", "index.html"))
    }
    next()
})


app.post('/api/getData/', ...getDataSchema, async (req,res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const {
        cityId,
        lon,
        lat,
        aspect,
        angle,
        peakpower,
        consumption_year,
        consumptionProfileId = 1
    } = req.body
    
    // console.log(req.body)
    // console.log(req.headers)
    const data = await Models.Data.findAll({
        where: {
            aspect,
            angle,
            peakpower,
            consumption_year,
            cityId,
            profileId: consumptionProfileId
        }
    }).catch(e => console.error(e))
    
    // console.log(data.length)
    if (data.length === 0){
        const city = await Models.City.findOne({
            where:{
                id: cityId
            }
        })
        const consumptionProfile = await Models.Profile.findOne({where: {id:consumptionProfileId}})
        const dailyConsumption = (consumption_year / 365 * 1000)
        const hourconsumption = convertPowerProfile(consumptionProfile.dataValues)
        const urls = batterySizes.map(batterySize => urlBuilder({aspect, angle, peakpower,consumption: dailyConsumption, hourconsumption, batterySize, lat: city.center_lat, lon: city.center_lon}))
        const responseData = await Promise.all(urls.map(url => getPVGisData(url,{cityId, profileId:consumptionProfileId})))
        res.json(responseData)
    } else {
        
        res.json(data)
    }
    
})

app.get('/api/getCity/:city', async (req,res) => {
    
    const {city} = req.params
    console.log(city)
    const cities = await Models.City.findAll({
        where: {
            city: {
                [Op.like] :`%${city}%`
            }
        }
    })


    res.json(cities)


})


app.get('/api/getConsumptionProfiles/', async (req,res) => {

    const profiles = await Models.Profile.findAll()
    res.json(profiles)


})

app.get('/',(req, res) => {

    res.send('ok')
})

app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });

app.listen(PORT,() => console.log('server started...'))


    
    


