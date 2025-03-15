import { getProductCreate,postProuduct,getallProduct,dropDownHandler } from "../controller/productController.js";
import express from 'express'
import { updateProduct,getEditProduct,deleteProduct } from "../controller/UpdatePController.js"; 
import multer from "multer";

const productRouter = express.Router();

const upload = multer({dest : 'public/uploads'})

productRouter.get('/product',getProductCreate);
productRouter.post('/product',postProuduct);
productRouter.get('/find-all',getallProduct)
productRouter.get('/edit/:id',getEditProduct);
productRouter.get('/dropdown',dropDownHandler)
productRouter.post('/update/:id',upload.array('productImage',2),updateProduct)
productRouter.post('/delete/:id',deleteProduct)

export default productRouter;