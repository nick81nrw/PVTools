const {Sequelize} = require('sequelize')


const sequelize = new Sequelize(process.env.DB_NAME,process.env.DB_USER,process.env.DB_PASSWORD,{
    dialect: process.env.DB_DIALECT,
  })

const Profile = require('../models/Profile')(sequelize)


const createProfile = async () => {
    await Profile.sync()
    
    const profile = await Profile.create({
        name: "Standardlastprofil H0",
        H_00: 0.028,
        H_01: 0.022,
        H_02: 0.019,
        H_03: 0.018,
        H_04: 0.018,
        H_05: 0.021,
        H_06: 0.03,
        H_07: 0.039,
        H_08: 0.042,
        H_09: 0.045,
        H_10: 0.047,
        H_11: 0.049,
        H_12: 0.052,
        H_13: 0.051,
        H_14: 0.049,
        H_15: 0.047,
        H_16: 0.048,
        H_17: 0.051,
        H_18: 0.058,
        H_19: 0.063,
        H_20: 0.061,
        H_21: 0.053,
        H_22: 0.049,
        H_23: 0.04,
    })
}

createProfile()