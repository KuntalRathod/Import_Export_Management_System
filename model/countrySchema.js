import { DataTypes } from "sequelize";
import sequelize from "../Config/db.js";

const countrySchema = sequelize.define('Country', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    country_name: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'countries', 
    timestamps: false, 
});

export default countrySchema;