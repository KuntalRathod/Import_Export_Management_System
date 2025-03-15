import { listUnit,createUnit,deleteUnit,updateUnit } from "../controller/unitController.js";
import express from 'express'

const unitRouter = express.Router();

unitRouter.get('/unit',listUnit)
unitRouter.post('/unit/create',createUnit)
unitRouter.delete('/unit/delete/:id',deleteUnit)
unitRouter.put("/unit/update/:id", updateUnit);

export default unitRouter;