import { getPackagePage,createPackage,updatePackage,deletePackage } from "../controller/packageController.js";
import express from 'express'

const packageRouter = express.Router();

packageRouter.get('/package',getPackagePage)
packageRouter.post('/package/create',createPackage)
packageRouter.put('/package/:id',updatePackage)
packageRouter.delete('/package/:id',deletePackage)

export default packageRouter;