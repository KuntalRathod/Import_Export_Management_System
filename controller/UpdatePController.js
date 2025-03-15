import path from "path";
import fs from "fs";
import productSchema from "../model/productSchema.js";

// Function to Render Edit Product Page
export const getEditProduct = async (req, res) => {
    try {
        const {id} = req.params;
        const product = await productSchema.findByPk(id);

        if (!product) {
            return res.status(404).send("Product not found");
        }

        res.render("ProductEdit", { product });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

// Function to Handle Product Update
export const updateProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const product = await productSchema.findByPk(id);

        if (!product) {
            return res.status(404).send("Product not found");
        }

        // Extract form data
        const {
            productName, hsnSac, gst, productDescription,
            inventory, productTag, unit, netWeight, grossWeight,
            dimensionLength, dimensionWidth, dimensionHeight, sellPrice
        } = req.body;

        // Check if a new product image is uploaded
        let productImage = product.productImage;
        if (req.file) {
            // Delete old image if new one is uploaded
            if (productImage) {
                fs.unlinkSync(path.join("public/uploads", productImage));
            }
            productImage = req.file.filename;
        }

        // Parse Variants JSON (if provided)
        let variants = [];
        if (req.body.variants) {
            
            for (const key in req.body.variants) {
                let variantImage = null;
                
                // Check if an image was uploaded for this variant
                if (req.files && req.files["variants[" + key + "][image]"]) {
                    variantImage = req.files["variants[" + key + "][image]"][0].filename;
                }

                variants.push({
                    id: parseInt(key) + 1,
                    name: req.body.variants[key].name,
                    image: variantImage || null 
                });
            }
        }
        
        await product.update({
            productName, hsnSac, gst, productDescription,
            inventory, productTag, unit, netWeight, grossWeight,
            dimension: { length: dimensionLength, width: dimensionWidth, height: dimensionHeight },
            sellPrice, productImage, variants
        });

        res.redirect("/find-all");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

export const deleteProduct = async(req,res) => {
    try {
        const { id } = req.params;
        const product = await productSchema.findByPk(id);

        if (!product) {
            return res.status(404).send("Product not found");
        }

        
        if (product.productImage) {
            fs.unlinkSync(path.join("public/uploads", product.productImage));
        }

        await product.destroy();

        res.redirect("/find-all");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
}
