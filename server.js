import express from "express"
import path from "path"
import "./Config/db.js"

import consigneeSchema from "./model/consigneeSchema.js"
import countrySchema from "./model/countrySchema.js"
import currencySchema from "./model/currencySchema.js"
import PackageSchema from "./model/packageSchema.js"
import portSchema from "./model/portSchema.js"
import productSchema from "./model/productSchema.js"
import unitSchema from "./model/unitSchema.js"  
import quotationSchema from "./model/quotationSchema.js"
import quotationProductSchema from "./model/quotationProductSchema.js"
import loadRoute from "./router/index.js"
import cors from "cors"

const app = express()

app.use(cors())

const __dirname = path.resolve()
app.use(express.json())
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
app.use(express.static(path.join(__dirname, "public")))
app.use(express.urlencoded({ extended: true }))

loadRoute(app)

const port = process.env.PORT || 8000

app.listen(8000, () => {
  console.log("server is a running on a 8000")
})
