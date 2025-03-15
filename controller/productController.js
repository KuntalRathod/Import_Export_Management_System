import productSchema from '../model/productSchema.js';
import '../Config/db.js';


export const getProductCreate =  (req, res) => {
    const activeTab = req.query.tab || "details"; 
    res.render("CreateProduct", { activeTab });
}

export const postProuduct = async(req,res) => {
    try {
        const {
            productName,hsnSac,gst,productDescription,inventory,productTag,unit,netWeight,
            grossWeight,dimensionLength,dimensionWidth,dimensionHeight,sellPrice,
        } = req.body;

        const productTags = productTag ? productTag.split(",") : [];

        const dimension = {
            length: req.body.dimensionLength ? parseFloat(req.body.dimensionLength) : null,
            width: req.body.dimensionWidth ? parseFloat(req.body.dimensionWidth) : null,
            height: req.body.dimensionHeight ? parseFloat(req.body.dimensionHeight) : null,
        };

        const variants = [];
        if (req.body.variants) {
            for (const key in req.body.variants) {
                variants.push({
                    id: parseInt(key) + 1, 
                    name: req.body.variants[key].name,
                    image: req.body.variants[key].image || null
                });
            }
        }

        await productSchema.create({
            productName,
            hsnSac,
            gst: gst || 0.0,
            productDescription,
            inventory,
            productTag: productTags,
            unit,
            netWeight,
            grossWeight,
            dimension,
            sellPrice,
            variants
        });

        console.log("Product saved successfully!");
        res.redirect("/find-all");
    } catch (error) {
        console.error("Error saving product:", error);
        res.status(500).send("Failed to save product.");
    }
}

export const getallProduct = async (req, res) => {
    try {
        const products = await productSchema.findAll();
        res.render('viewPage',{products}); 
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "Failed to fetch products." });
    }
};

export const dropDownHandler = async(req,res) => {
    try {
        const products = await productSchema.findAll(); // Fetch all products

        // Transform products to include variant options
        const formattedProducts = products.map(product => {
            let variants = product.variants; // Use directly, no need for JSON.parse()

            return {
                id: product.id,
                name: product.productName,
                variants: variants.map(variant => ({
                    id: variant.id,
                    name: `${product.productName} - ${variant.name}` 
                }))
            };
        });

        res.render("dropDown", { products: formattedProducts }); // Pass to EJS
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).send("Server Error");
    }
}



