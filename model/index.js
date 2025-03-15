import unitSchema from "./unitSchema.js";
import PackageSchema from "./packageSchema.js";

unitSchema.hasMany(PackageSchema, { foreignKey: "unitId", onDelete: "CASCADE" });
PackageSchema.belongsTo(unitSchema, { foreignKey: "unitId" });


export {unitSchema,PackageSchema}