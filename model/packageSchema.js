import { DataTypes } from "sequelize";
import sequelize from "../Config/db.js";
import unitSchema from "./unitSchema.js";


const PackageSchema = sequelize.define("Package", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    unitId: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: unitSchema,  
            key: "id"     
        },
        onDelete: "CASCADE"
    },
    netWeight: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    grossWeight: {
        type: DataTypes.FLOAT,
        allowNull: false
    }
}, {
    timestamps: true
});

export default PackageSchema;