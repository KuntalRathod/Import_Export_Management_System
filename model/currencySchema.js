import { DataTypes } from "sequelize";
import sequelize from "../Config/db.js";

const currencySchema = sequelize.define('Currency', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    conversion_rate: {
      type: DataTypes.FLOAT,
      allowNull: false
    }
  }, {
    tableName: 'currencies',
    timestamps: false
  });


export default currencySchema;