import productRouter from "./ProductRouter.js"
import unitRouter from "./unitRouter.js"
import packageRouter from "./packageRouter.js"
import quotationRouter from "./quotationRouter.js"

const loadRoute = (app) => {
    app.use('/',quotationRouter)
    app.use('/',packageRouter)
    app.use('/',unitRouter)
    app.use('/',productRouter)
}

export default loadRoute