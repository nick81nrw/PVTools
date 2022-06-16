const {Sequelize} = require('sequelize')

const rawCities = require('./cities.json')

const sequelize = new Sequelize(process.env.DB_NAME,process.env.DB_USER,process.env.DB_PASSWORD,{
    dialect: process.env.DB_DIALECT,
    // storage: 'C:/temp/PVGis/db.sqlite'
  })


const City = require('../models/City')(sequelize)

const filterCities = rawCities.map(e => ({...e, center_lon: parseFloat(e.center_lon.replace(',','.')), center_lat: parseFloat(e.center_lat.replace(',','.')) }))



const writeData = async () => {

    const cities = await City.bulkCreate(filterCities)
}


const readDb = async () => {
    const cities = await City.count()
    console.log(cities)

}

writeData()
    
    


