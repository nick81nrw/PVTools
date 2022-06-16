const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const City = sequelize.define("City", {
    city: {
        type: DataTypes.STRING,
    },
    population: {
        type: DataTypes.INTEGER,
    },
    center_lon: {
        type: DataTypes.FLOAT,
    },
    center_lat: {
        type: DataTypes.FLOAT,
    }
  },
  {
    timestamps: false,
    // freezeTableName: true
    tableName: 'cities'
  });
  // City.sync()
  
  return City;
};