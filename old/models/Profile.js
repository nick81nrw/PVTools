const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Profile = sequelize.define("Profile", {
    name: {
        type: DataTypes.STRING,
    },
    H_00: DataTypes.FLOAT,
    H_01: DataTypes.FLOAT,
    H_02: DataTypes.FLOAT,
    H_03: DataTypes.FLOAT,
    H_04: DataTypes.FLOAT,
    H_05: DataTypes.FLOAT,
    H_06: DataTypes.FLOAT,
    H_07: DataTypes.FLOAT,
    H_08: DataTypes.FLOAT,
    H_09: DataTypes.FLOAT,
    H_10: DataTypes.FLOAT,
    H_11: DataTypes.FLOAT,
    H_12: DataTypes.FLOAT,
    H_13: DataTypes.FLOAT,
    H_14: DataTypes.FLOAT,
    H_15: DataTypes.FLOAT,
    H_16: DataTypes.FLOAT,
    H_17: DataTypes.FLOAT,
    H_18: DataTypes.FLOAT,
    H_19: DataTypes.FLOAT,
    H_20: DataTypes.FLOAT,
    H_21: DataTypes.FLOAT,
    H_22: DataTypes.FLOAT,
    H_23: DataTypes.FLOAT,
  },
  {
    timestamps: false,
    // freezeTableName: true
    tableName: 'profiles'
  });



  // Profile.sync()
  return Profile;
};