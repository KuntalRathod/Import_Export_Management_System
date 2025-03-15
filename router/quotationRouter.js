import {
  getform,
  quotationCreate,
  listQuotation,
  getQuotationById,
  generateQuotationPDF,
  renderQuotationInvoice,
  editQuotation,
  updateQuotation,
  deleteQuotation,
  generateQuotationExcel,
  sendQuotationEmail,
  // viewQuotationPDF,
} from "../controller/quotationController.js"

import express from "express"

const quotationRouter = express.Router()

quotationRouter.get("/quotation", getform)
quotationRouter.post("/quotation/create", quotationCreate)
quotationRouter.get("/quotation/list", listQuotation)
quotationRouter.get("/quotation/:id", getQuotationById) // New route for get by ID
quotationRouter.get("/quotation/:id/pdf", generateQuotationPDF) // New route for PDF generation
quotationRouter.get("/quotation/:id/invoice", renderQuotationInvoice) // New route for HTML invoice
quotationRouter.get("/quotation/:id/edit", editQuotation) // New route for HTML invoice
quotationRouter.post("/quotation/:id/update", updateQuotation) // Add this route for update submission
quotationRouter.delete("/quotation/:id", deleteQuotation) // Add this route for delete
// quotationRouter.get("/quotation/:id/pdf/view", viewQuotationPDF) // Add this route for view PDF
quotationRouter.get("/quotation/:id/excel", generateQuotationExcel) // New route
quotationRouter.post("/quotation/send-email", sendQuotationEmail)

export default quotationRouter
