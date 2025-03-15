import { DataTypes } from "sequelize";
import sequelize from "../Config/db.js";

import PackageSchema from "./packageSchema.js";
import unitSchema from "./unitSchema.js";
import productSchema from "./productSchema.js";
import quotationSchema from "./quotationSchema.js";

const quotationProductSchema = sequelize.define('QuotationProduct', {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    quotation_id: { 
        type: DataTypes.BIGINT, 
        allowNull: false, 
        references: { model: quotationSchema, key: 'id' }, 
        onDelete: 'CASCADE'
    },
    product_id: { 
        type: DataTypes.BIGINT.UNSIGNED, 
        allowNull: false, 
        references: { model: productSchema, key: 'id' }
    },
    variant_id: {  
        type: DataTypes.INTEGER,
        allowNull: true  
    },
    quantity: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    price: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    total: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    
    unit_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: unitSchema, key: 'id' }
    },

    package_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: PackageSchema, key: 'id' }
    },

    net_weight: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    gross_weight: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    total_package: { type: DataTypes.INTEGER, allowNull: false }
});

// Relationships
quotationSchema.hasMany(quotationProductSchema, { foreignKey: 'quotation_id' });
quotationProductSchema.belongsTo(quotationSchema, { foreignKey: 'quotation_id' });

productSchema.hasMany(quotationProductSchema, { foreignKey: 'product_id' });
quotationProductSchema.belongsTo(productSchema, { foreignKey: 'product_id' });

unitSchema.hasMany(quotationProductSchema, { foreignKey: 'unit_id' });
quotationProductSchema.belongsTo(unitSchema, { foreignKey: 'unit_id' });

PackageSchema.hasMany(quotationProductSchema, { foreignKey: 'package_id' });
quotationProductSchema.belongsTo(PackageSchema, { foreignKey: 'package_id' });

export default quotationProductSchema;
