import '../Config/db.js';
import unitSchema from '../model/unitSchema.js';


export const listUnit = async(req,res) => {
    try {
        const units = await unitSchema.findAll();
        res.render('unit',{units})
    } catch (error) {
        console.error('Error fetcing Unitdata',error)
    }
} 
export const createUnit = async(req,res) => {
    console.log('reciving data in Unit Creation :', req.body)

    try {
        const newUnit = await unitSchema.create({
            orderUnit: req.body.orderUnit,
            packingUnit: req.body.packingUnit,
            weight: req.body.weight,
            noteForMe: req.body.noteForMe,
        });
        res.json({ success: true, message: "Unit created successfully!", unit: newUnit });
    } catch (error) {
        console.error("Error saving unit:", error);
        res.status(500).send("Error saving unit");
    }
} 

export const deleteUnit = async(req,res) => {
    try {
        const unitId = req.params.id;
        const deleted = await unitSchema.destroy({ where: { id: unitId } });

        if (deleted) {
            return res.json({ success: true, message: 'Unit deleted successfully' });
        } else {
            return res.status(404).json({ success: false, message: 'Unit not found' });
        }
    } catch (error) {
        console.error('Error deleting unit:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const updateUnit = async (req, res) => {
    try {
        const unitId = req.params.id;
        const { orderUnit, packingUnit, weight, noteForMe } = req.body;

        const updated = await unitSchema.update(
            { orderUnit, packingUnit, weight, noteForMe },
            { where: { id: unitId } }
        );

        if (updated[0] > 0) {
            res.json({ success: true, message: "Unit updated successfully" });
        } else {
            res.status(404).json({ success: false, message: "Unit not found" });
        }
    } catch (error) {
        console.error("Error updating unit:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};