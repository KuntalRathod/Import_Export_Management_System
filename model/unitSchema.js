import { DataTypes } from "sequelize";
import sequelize from "../Config/db.js"; // Adjust the path as per your project

const unitSchema = sequelize.define("Unit", {
    id:{
        type : DataTypes.INTEGER,
        autoIncrement : true,
        primaryKey : true
    },
    orderUnit: {
        type: DataTypes.ENUM("MT", "TON", "KG", "PIECE", "LTR","BAGS","PCS","BOX","CAN","JAR","BOTTELS"),
        allowNull: false,
    },
    packingUnit: {
        type: DataTypes.ENUM("MT", "TON", "KG", "PIECE", "LTR"),
        allowNull: false,
    },
    weight: {
        type: DataTypes.FLOAT, 
        allowNull: false,
    },
    noteForMe: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt
});

export default unitSchema;