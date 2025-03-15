import { unitSchema,PackageSchema } from "../model/index.js";


export const getPackagePage = async (req, res) => {
    try {
        
        const units = await unitSchema.findAll();
        const packages = await PackageSchema.findAll({
            include: [
                {
                    model: unitSchema,
                    attributes: ["id","orderUnit", "packingUnit"],
                },
            ],
            attributes: ["id","netWeight", "grossWeight", "createdAt"],
            order: [["createdAt", "DESC"]],
            raw: true,
            nest: true
        });

        // console.log(packages)


        res.render("package", { units, packages });
    } catch (error) {
        console.error("Error fetching package data:", error);
        res.status(500).send("Error retrieving package data");
    }
};


export const createPackage = async(req,res) => {
    try {
        const { unitId, netWeight, grossWeight } = req.body;

        if (!unitId || !netWeight || !grossWeight) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }
        const newPackage = await PackageSchema.create({
            unitId,
            netWeight,
            grossWeight
        });

        const unit = await unitSchema.findByPk(unitId, {
            attributes: ["orderUnit", "packingUnit"]
        });


        res.json({ 
            orderUnit: unit.dataValues.orderUnit, 
            packingUnit: unit.dataValues.packingUnit,
            netWeight, 
            grossWeight, 
            createdAt: newPackage.createdAt 
        });
    } catch (error) {
        console.error("Error creating package:", error);
        res.status(500).json({ success: false, message: "Failed to create package." });
    }
}   

export const updatePackage = async(req,res) => {
    try {
        const { id } = req.params;
        const { netWeight, grossWeight, unitId } = req.body;

        // Update the package
        const updatedPackage = await PackageSchema.update(
            { netWeight, grossWeight, unitId },
            { where: { id } }
        );
        
        if (updatedPackage[0] === 1) {
            // Fetch the updated package with unit details
            const unit = await unitSchema.findByPk(unitId, {
                attributes: ["orderUnit", "packingUnit"]
            });

            console.log(unit)
            
            if (!unit) {
                return res.status(404).json({ success: false, message: "Unit not found" });
            }

            res.json({
                success: true,
                message: "Package updated successfully",
                orderUnit: unit.dataValues.orderUnit,
                packingUnit: unit.dataValues.packingUnit,
                netWeight,
                grossWeight
            });
        } else {
            res.status(404).json({ success: false, message: "Package not found" });
        }
    } catch (error) {
        console.error("Error updating package:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const deletePackage = async(req,res) => {
    try {
        const { id } = req.params;

        const deleted = await PackageSchema.destroy({ where: { id } });

        if (deleted) {
            res.json({ success: true, message: "Package deleted successfully" });
        } else {
            res.status(404).json({ success: false, message: "Package not found" });
        }
    } catch (error) {
        console.error("Error deleting package:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}