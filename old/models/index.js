
module.exports = sequelize => {

    const Data = require('./Data')(sequelize)
    const Profile = require('./Profile')(sequelize)
    const City = require('./City')(sequelize)

    City.Data = City.hasMany(Data)
    Data.City = Data.belongsTo(City)
    Data.Profile = Data.belongsTo(Profile)
    Profile.Data = Profile.hasMany(Data)
    
    // sequelize.sync({alter: true})    
    
    
    
    return {
        Data,
        Profile,
        City
    }
}