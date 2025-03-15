import sequelize from "../Config/db.js";
import productSchema from "../model/productSchema.js";
import unitSchema from "../model/unitSchema.js";
import packageSchema from "../model/packageSchema.js";
import countrySchema from "../model/countrySchema.js";
import consigneeSchema from "../model/consigneeSchema.js";
import portSchema from "../model/portSchema.js";
import currencySchema from "../model/currencySchema.js";
import quotationSchema from "../model/quotationSchema.js";
import quotationProductSchema from "../model/quotationProductSchema.js";
import '../model/index.js'

async function ProductSyncer(){
    try {
        await sequelize.sync({alter : true});
        console.log('database is synced !!!!')
    } catch (error) {
        console.error('error in a table sync',error)
    }
};

ProductSyncer();