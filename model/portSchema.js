import { DataTypes } from "sequelize";
import sequelize from "../Config/db.js";
import countrySchema from "./countrySchema.js";

const portSchema = sequelize.define('Port', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },

    portName: {
      type: DataTypes.STRING,
      allowNull: false
    },

    country_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: countrySchema, // Foreign Key reference
        key: 'id'
      },
      
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    }
  }, {
    tableName: 'ports',
    timestamps: false
  });
  
  
  countrySchema.hasMany(portSchema, { foreignKey: 'country_id' });
  portSchema.belongsTo(countrySchema, { foreignKey: 'country_id' });
  
export default portSchema;