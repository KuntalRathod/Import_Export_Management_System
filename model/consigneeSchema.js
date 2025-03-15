import { DataTypes } from "sequelize";
import sequelize from "../Config/db.js";
import countrySchema from "./countrySchema.js";

const consigneeSchema = sequelize.define('Consignee', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    address: {
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
    tableName: 'consignees',
    timestamps: false
  });
  
  // Define the association (One Country -> Many Consignees)
  countrySchema.hasMany(consigneeSchema, { foreignKey: 'country_id' });
  consigneeSchema.belongsTo(countrySchema, { foreignKey: 'country_id' });
  
 export default consigneeSchema;