import { DataTypes } from "sequelize"
import sequelize from "../Config/db.js"
import consigneeSchema from "./consigneeSchema.js"
import countrySchema from "./countrySchema.js"
import currencySchema from "./currencySchema.js"
import PackageSchema from "./packageSchema.js"
import portSchema from "./portSchema.js"
import productSchema from "./productSchema.js"
import unitSchema from "./unitSchema.js"

const quotationSchema = sequelize.define(
  "Quotation",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    consignee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: consigneeSchema,
        key: "id",
      },
    },
    country_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: countrySchema,
        key: "id",
      },
    },
    port_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: portSchema,
        key: "id",
      },
    },
    currency_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: currencySchema,
        key: "id",
      },
    },
    conversion_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    totalNetWeight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    totalGrossWeight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    total_native: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    total_inr: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    pdf_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: "quotations", // Explicitly set to match your database table
  }
)

consigneeSchema.hasMany(quotationSchema, { foreignKey: "consignee_id" })
quotationSchema.belongsTo(consigneeSchema, { foreignKey: "consignee_id" })

countrySchema.hasMany(portSchema, { foreignKey: "country_id" })
portSchema.belongsTo(countrySchema, { foreignKey: "country_id" })

portSchema.hasMany(quotationSchema, { foreignKey: "port_id" })
quotationSchema.belongsTo(portSchema, { foreignKey: "port_id" })

currencySchema.hasMany(quotationSchema, { foreignKey: "currency_id" })
quotationSchema.belongsTo(currencySchema, { foreignKey: "currency_id" })

countrySchema.hasMany(quotationSchema, { foreignKey: "country_id" })
quotationSchema.belongsTo(countrySchema, { foreignKey: "country_id" })

export default quotationSchema
