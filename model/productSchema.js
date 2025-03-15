import { DataTypes } from "sequelize"
import sequelize from "../Config/db.js"

const productSchema = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    productName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },

    hsnSac: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    gst: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0.0,
    },

    productImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    productDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    inventory: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    variants: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      get() {
        const value = this.getDataValue("variants")
        return value && typeof value === "string"
          ? JSON.parse(value)
          : value || []
      },
      set(value) {
        this.setDataValue("variants", Array.isArray(value) ? value : [])
      },
    },

    productTag: {
      type: DataTypes.STRING(255),
      allowNull: true,
      get() {
        const value = this.getDataValue("productTag")
        return value ? value.split(",") : []
      },
      set(val) {
        this.setDataValue(
          "productTag",
          Array.isArray(val) ? val.join(",") : val || ""
        )
      },
    },

    unit: {
      type: DataTypes.ENUM("MT", "LT", "TON", "Pieces", "KG"), // Standard units
      allowNull: false,
    },

    netWeight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    grossWeight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    dimension: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: { length: 0, width: 0, height: 0 },
      get() {
        const value = this.getDataValue("dimension")
        return value && typeof value === "string"
          ? JSON.parse(value)
          : value || { length: 0, width: 0, height: 0 }
      },
      set(value) {
        this.setDataValue(
          "dimension",
          typeof value === "object" ? value : { length: 0, width: 0, height: 0 }
        )
      },
    },

    sellPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "products",
    timestamps: true,
    indexes: [
      { fields: ["productName"] },
      { fields: ["hsnSac"] },
      { fields: ["sellPrice"] },
    ],
  }
)

export default productSchema
