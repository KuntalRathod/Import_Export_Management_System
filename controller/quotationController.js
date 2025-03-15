import fetch from "node-fetch"
import puppeteer from "puppeteer"
import dotenv from "dotenv"
import ExcelJS from "exceljs"
import AWS from "aws-sdk"
import consigneeSchema from "../model/consigneeSchema.js"
import countrySchema from "../model/countrySchema.js"
import currencySchema from "../model/currencySchema.js"
import PackageSchema from "../model/packageSchema.js"
import portSchema from "../model/portSchema.js"
import productSchema from "../model/productSchema.js"
import unitSchema from "../model/unitSchema.js"
import quotationSchema from "../model/quotationSchema.js"
import quotationProductSchema from "../model/quotationProductSchema.js"
import nodemailer from "nodemailer"
import upload from "../utlis/multer.js"

dotenv.config()

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_BUCKET_REGION,
})

const s3 = new AWS.S3()

const splitProductId = (productIdString) => {
  if (typeof productIdString === "string" && productIdString.includes("-")) {
    const [product_id, variant_id] = productIdString
      .split("-")
      .map((num) => parseInt(num, 10))
    return { product_id, variant_id }
  }
  return { product_id: parseInt(productIdString, 10), variant_id: null }
}
export const getQuotationById = async (req, res) => {
  try {
    const { id } = req.params

    const quotation = await quotationSchema.findByPk(id, {
      include: [
        {
          model: quotationProductSchema,
          include: [
            {
              model: productSchema,
              attributes: ["productName"],
            },
          ],
        },
        {
          model: consigneeSchema,
          attributes: ["name", "address"],
        },
        {
          model: countrySchema,
          attributes: ["country_name"],
        },
        {
          model: portSchema,
          attributes: ["portName"],
        },
        {
          model: currencySchema,
          attributes: ["currency", "conversion_rate"],
        },
      ],
    })

    if (!quotation) {
      return res.status(404).json({ error: "Quotation not found" })
    }

    res.status(200).json({ quotation })
  } catch (error) {
    console.error("Error fetching quotation by ID:", error)
    res.status(500).json({ error: "Internal Server Error" })
  }
}

export const renderQuotationInvoice = async (req, res) => {
  try {
    const { id } = req.params

    const quotation = await quotationSchema.findByPk(id, {
      include: [
        {
          model: quotationProductSchema,
          include: [
            { model: productSchema, attributes: ["productName"] },
            { model: unitSchema, attributes: ["orderUnit", "packingUnit"] },
            { model: PackageSchema, attributes: ["netWeight", "grossWeight"] },
          ],
        },
        { model: consigneeSchema, attributes: ["name", "address"] },
        { model: countrySchema, attributes: ["country_name"] },
        { model: portSchema, attributes: ["portName"] },
        { model: currencySchema, attributes: ["currency", "conversion_rate"] },
      ],
    })

    if (!quotation) {
      return res.status(404).send("Quotation not found")
    }

    res.render("invoice", { quotation })
  } catch (error) {
    console.error("Error rendering invoice:", error)
    res.status(500).send("Internal Server Error")
  }
}

export const generateQuotationPDF = async (req, res) => {
  try {
    const { id } = req.params

    const quotation = await quotationSchema.findByPk(id, {
      include: [
        {
          model: quotationProductSchema,
          include: [
            { model: productSchema, attributes: ["productName"] },
            { model: unitSchema, attributes: ["orderUnit", "packingUnit"] },
            { model: PackageSchema, attributes: ["netWeight", "grossWeight"] },
          ],
        },
        { model: consigneeSchema, attributes: ["name", "address"] },
        { model: countrySchema, attributes: ["country_name"] },
        { model: portSchema, attributes: ["portName"] },
        { model: currencySchema, attributes: ["currency", "conversion_rate"] },
      ],
    })

    if (!quotation) {
      return res.status(404).json({ error: "Quotation not found" })
    }

    const invoiceHTML = await new Promise((resolve, reject) => {
      res.render("invoice", { quotation }, (err, html) => {
        if (err) return reject(err)
        resolve(html)
      })
    })

    console.log("Generated HTML Length:", invoiceHTML.length)

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
    const page = await browser.newPage()
    await page.setContent(invoiceHTML, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
    })

    console.log("PDF Buffer Length:", pdfBuffer.length)

    await browser.close()

    const fileName = `quotations-Kuntal-${id}.pdf`
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: pdfBuffer,
      ContentType: "application/pdf",
    }

    await s3.upload(uploadParams).promise()

    const pdfUrl = s3.getSignedUrl("getObject", {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Expires: 3600,
    })

    console.log("Pre-signed URL Generated:", pdfUrl)

    res.status(200).json({
      message: "PDF generated and uploaded successfully",
      pdfUrl: pdfUrl,
    })
  } catch (error) {
    console.error("Error generating and uploading PDF:", error)
    res.status(500).json({ error: "Internal Server Error" })
  }
}

export const getform = async (req, res) => {
  try {
    const consignees = await consigneeSchema.findAll()
    const ports = await portSchema.findAll()
    const countries = await countrySchema.findAll()
    const currencies = await currencySchema.findAll()
    const products = await productSchema.findAll()
    const units = await unitSchema.findAll()
    const packages = await PackageSchema.findAll()

    res.render("quotation", {
      consignees,
      ports,
      countries,
      currencies,
      products,
      units,
      packages,
      quotation: null,
      isEdit: false,
    })
  } catch (error) {
    console.error("Error fetching data for quotation form:", error)
    res.status(500).send("Internal Server Error")
  }
}

export const quotationCreate = async (req, res) => {
  try {
    let {
      date,
      consignee_id,
      country_id,
      port_id,
      currency_id,
      conversion_rate,
      totalNetWeight,
      totalGrossWeight,
      total_native,
      total_inr,
      products,
      product_id,
      quantity,
      price,
      total,
      unit_id,
      netWeight,
      grossWeight,
      totalPackage,
      package_id,
    } = req.body

    console.log("full body log :", req.body)

    if (!products || !Array.isArray(products)) {
      if (!Array.isArray(product_id)) {
        product_id = [product_id]
        quantity = [quantity]
        price = [price]
        total = [total]
        unit_id = [unit_id]
        netWeight = [netWeight]
        grossWeight = [grossWeight]
        totalPackage = [totalPackage]
        package_id = [package_id]
      }

      products = product_id.map((id, index) => ({
        product_id: id,
        quantity: quantity[index],
        price: price[index],
        total: total[index],
        unit_id: unit_id[index],
        netWeight: netWeight[index],
        grossWeight: grossWeight[index],
        totalPackage: totalPackage[index],
        package_id: package_id[index],
      }))
    }

    console.log("Processed Products Array:", products)

    const newQuotation = await quotationSchema.create({
      date,
      consignee_id,
      country_id,
      port_id,
      currency_id,
      conversion_rate,
      totalNetWeight,
      totalGrossWeight,
      total_native,
      total_inr,
    })

    console.log("New Quotation:", newQuotation)

    if (products && Array.isArray(products) && products.length > 0) {
      const quotationProducts = products.map((product) => {
        let { product_id, variant_id } = splitProductId(product.product_id)

        product_id = parseInt(product_id, 10)
        variant_id = variant_id ? parseInt(variant_id, 10) : null

        if (isNaN(product_id)) {
          console.error(
            `Invalid product_id at index ${index}:`,
            product.product_id
          )
          return null
        }

        return {
          quotation_id: newQuotation.id,
          product_id,
          variant_id,
          quantity: parseFloat(product.quantity),
          price: parseFloat(product.price),
          total: parseFloat(product.total),
          totalSingleProduct: parseFloat(product.total),
          unit_id: parseInt(product.unit_id, 10),
          net_weight: parseFloat(product.netWeight),
          gross_weight: parseFloat(product.grossWeight),
          total_package: parseInt(product.totalPackage, 10),
          package_id: parseInt(product.package_id, 10),
        }
      })

      console.log("quotation products :", quotationProducts)

      await quotationProductSchema.bulkCreate(quotationProducts)
    }

    res.redirect("/quotation/list")
  } catch (error) {
    console.error("Error creating quotation:", error)
    res.status(500).json({ error: "Internal Server Error" })
  }
}
export const listQuotation = async (req, res) => {
  try {
    const quotations = await quotationSchema.findAll({
      include: [
        {
          model: quotationProductSchema,
          include: [{ model: productSchema, attributes: ["productName"] }],
        },
        { model: consigneeSchema, attributes: ["name"] },
        { model: countrySchema, attributes: ["country_name"] },
        { model: portSchema, attributes: ["portName"] },
        { model: currencySchema, attributes: ["currency"] },
      ],
    })

    res.render("quotationList", { quotations })
  } catch (error) {
    console.error("Error fetching quotations:", error)
    res.status(500).json({ error: "Internal Server Error" })
  }
}

export const editQuotation = async (req, res) => {
  try {
    const { id } = req.params

    const quotation = await quotationSchema.findByPk(id, {
      include: [
        {
          model: quotationProductSchema,
          include: [
            { model: productSchema, attributes: ["productName"] },
            { model: unitSchema, attributes: ["orderUnit", "packingUnit"] },
            { model: PackageSchema, attributes: ["netWeight", "grossWeight"] },
          ],
        },
        { model: consigneeSchema, attributes: ["name", "address"] },
        { model: countrySchema, attributes: ["country_name"] },
        { model: portSchema, attributes: ["portName"] },
        { model: currencySchema, attributes: ["currency", "conversion_rate"] },
      ],
    })

    if (!quotation) {
      return res.status(404).send("Quotation not found")
    }

    const consignees = await consigneeSchema.findAll()
    const ports = await portSchema.findAll()
    const countries = await countrySchema.findAll()
    const currencies = await currencySchema.findAll()
    const products = await productSchema.findAll()
    const units = await unitSchema.findAll()
    const packages = await PackageSchema.findAll()

    res.render("quotation", {
      consignees,
      ports,
      countries,
      currencies,
      products,
      units,
      packages,
      quotation,
      isEdit: true,
    })
  } catch (error) {
    console.error("Error fetching quotation for edit:", error)
    res.status(500).send("Internal Server Error")
  }
}

export const updateQuotation = async (req, res) => {
  try {
    const { id } = req.params
    let {
      date,
      consignee_id,
      country_id,
      port_id,
      currency_id,
      conversion_rate,
      totalNetWeight,
      totalGrossWeight,
      total_native,
      total_inr,
      product_id,
      quantity,
      price,
      total,
      unit_id,
      netWeight,
      grossWeight,
      totalPackage,
      package_id,
    } = req.body

    await quotationSchema.update(
      {
        date,
        consignee_id: parseInt(consignee_id, 10),
        country_id: parseInt(country_id, 10),
        port_id: parseInt(port_id, 10),
        currency_id: parseInt(currency_id, 10),
        conversion_rate: parseFloat(conversion_rate),
        totalNetWeight: parseFloat(totalNetWeight),
        totalGrossWeight: parseFloat(totalGrossWeight),
        total_native: parseFloat(total_native),
        total_inr: parseFloat(total_inr),
      },
      { where: { id } }
    )

    await quotationProductSchema.destroy({ where: { quotation_id: id } })

    const products = product_id.map((pid, index) => {
      const { product_id: prodId, variant_id } = splitProductId(pid)
      return {
        quotation_id: id,
        product_id: prodId,
        variant_id: variant_id || null,
        quantity: parseFloat(quantity[index]),
        price: parseFloat(price[index]),
        total: parseFloat(total[index]),
        unit_id: parseInt(unit_id[index], 10),
        net_weight: parseFloat(netWeight[index]),
        gross_weight: parseFloat(grossWeight[index]),
        total_package: parseInt(totalPackage[index], 10),
        package_id: parseInt(package_id[index], 10),
      }
    })

    await quotationProductSchema.bulkCreate(products)

    res.redirect("/quotation/list")
  } catch (error) {
    console.error("Error updating quotation:", error)
    res.status(500).json({ error: "Internal Server Error" })
  }
}

export const deleteQuotation = async (req, res) => {
  try {
    const { id } = req.params

    // Delete PDF from S3
    try {
      const pdfFileName = `quotations/quotation-${id}.pdf`
      const deletePdfParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: pdfFileName,
      }
      await s3.deleteObject(deletePdfParams).promise()
      console.log(`Deleted PDF for quotation ${id} from S3`)
    } catch (s3Error) {
      console.log(`Note: Failed to delete PDF from S3: ${s3Error.message}`)
    }

    // Delete Excel from S3 (if it exists)
    try {
      const excelFileName = `quotations/quotation-${id}.xlsx`
      const deleteExcelParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: excelFileName,
      }
      await s3.deleteObject(deleteExcelParams).promise()
      console.log(`Deleted Excel for quotation ${id} from S3`)
    } catch (s3Error) {
      console.log(`Note: Failed to delete Excel from S3: ${s3Error.message}`)
    }

    await quotationProductSchema.destroy({ where: { quotation_id: id } })

    const deletedRows = await quotationSchema.destroy({ where: { id } })

    if (deletedRows === 0) {
      return res.status(404).json({ error: "Quotation not found" })
    }

    res.status(200).json({
      message: "Quotation and associated PDF/Excel deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting quotation:", error)
    res.status(500).json({ error: "Internal Server Error" })
  }
}

export const generateQuotationExcel = async (req, res) => {
  try {
    const { id } = req.params

    const quotation = await quotationSchema.findByPk(id, {
      include: [
        {
          model: quotationProductSchema,
          include: [
            { model: productSchema, attributes: ["productName"] },
            { model: unitSchema, attributes: ["orderUnit", "packingUnit"] },
            { model: PackageSchema, attributes: ["netWeight", "grossWeight"] },
          ],
        },
        { model: consigneeSchema, attributes: ["name", "address"] },
        { model: countrySchema, attributes: ["country_name"] },
        { model: portSchema, attributes: ["portName"] },
        { model: currencySchema, attributes: ["currency", "conversion_rate"] },
      ],
    })

    if (!quotation) {
      return res.status(404).json({ error: "Quotation not found" })
    }

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Quotation")

    worksheet.pageSetup = {
      paperSize: 9, // A4
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        top: 0.7,
        right: 0.7,
        bottom: 0.7,
        left: 0.7,
        header: 0.3,
        footer: 0.3,
      },
    }

    // Define global styling colors to match HTML template
    const headerBgColor = "0F766E" // Teal Green
    const headerTextColor = "FEF9C3" // Soft Yellow
    const labelTextColor = "4A5568" // Dark Gray
    const tableBorderColor = "8B5CF6" // Purple
    const tableHeaderBgColor = "D97706" // Warm Orange
    const totalsRowBgColor = "FDE68A" // Pastel Yellow

    const borderStyle = "medium"

    // Set column widths
    worksheet.columns = [
      { width: 8 }, // SR. NO.
      { width: 30 }, // DESCRIPTION
      { width: 10 }, // QUANTITY
      { width: 10 }, // UNIT
      { width: 15 }, // PRICE
      { width: 25 }, // NET WEIGHT
      { width: 25 }, // GROSS WEIGHT
      { width: 25 }, // TOTAL
    ]

    let rowIndex = 1
    const contentStartRow = rowIndex

    // Header row - "QUOTATION"
    worksheet.mergeCells(`A${rowIndex}:H${rowIndex}`)
    const headerCell = worksheet.getCell(`A${rowIndex}`)
    headerCell.value = "QUOTATION"
    headerCell.font = { size: 16, bold: true, color: { argb: headerTextColor } }
    headerCell.alignment = { horizontal: "center", vertical: "middle" }
    headerCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: headerBgColor },
    }
    headerCell.border = {
      top: { style: borderStyle, color: { argb: tableBorderColor } },
      left: { style: borderStyle, color: { argb: tableBorderColor } },
      bottom: { style: borderStyle, color: { argb: tableBorderColor } },
      right: { style: borderStyle, color: { argb: tableBorderColor } },
    }
    worksheet.getRow(rowIndex).height = 30
    rowIndex++

    // Company Logo and Quotation Details row
    // Logo cell
    worksheet.mergeCells(`A${rowIndex}:A${rowIndex + 2}`)
    const logoCell = worksheet.getCell(`A${rowIndex}`)

    try {
      // Download the logo image
      const logoUrl =
        "https://cdn.pixabay.com/photo/2023/03/06/13/58/logo-7833520_1280.png"
      const response = await fetch(logoUrl)
      const arrayBuffer = await response.arrayBuffer()
      const logoBuffer = Buffer.from(arrayBuffer)

      // Add the image to the workbook
      const imageId = workbook.addImage({
        buffer: logoBuffer,
        extension: "jpeg",
      })

      // Add the image to the worksheet
      worksheet.addImage(imageId, {
        tl: { col: 0, row: rowIndex - 1 },
        br: { col: 1, row: rowIndex + 2 },
        editAs: "oneCell",
      })
    } catch (error) {
      console.error("Error adding logo:", error)
    }

    logoCell.border = {
      top: { style: borderStyle, color: { argb: tableBorderColor } },
      left: { style: borderStyle, color: { argb: tableBorderColor } },
      bottom: { style: borderStyle, color: { argb: tableBorderColor } },
      right: { style: borderStyle, color: { argb: tableBorderColor } },
    }

    // Company details
    const companyRow = rowIndex
    worksheet.getCell(`B${companyRow}`).value = "COMPANY NAME"
    worksheet.getCell(`B${companyRow}`).font = { bold: true }
    worksheet.getCell(`B${companyRow + 1}`).value =
      "COMPANY ADDRESS LINE 1\nCOMPANY ADDRESS LINE 2"
    worksheet.getCell(`B${companyRow + 2}`).value =
      "CITY, STATE, COUNTRY - POSTAL CODE"

    // Add borders to company info cells
    for (let r = companyRow; r < companyRow + 3; r++) {
      worksheet.getCell(`B${r}`).border = {
        top: { style: "thin", color: { argb: tableBorderColor } },
        left: { style: "thin", color: { argb: tableBorderColor } },
        bottom: { style: "thin", color: { argb: tableBorderColor } },
        right: { style: "thin", color: { argb: tableBorderColor } },
      }
    }

    // Quotation Details on the right side
    worksheet.mergeCells(`C${rowIndex}:E${rowIndex}`)
    worksheet.getCell(`C${rowIndex}`).value = "QUOTATION NO."
    worksheet.getCell(`C${rowIndex}`).font = {
      bold: true,
      color: { argb: labelTextColor },
    }

    worksheet.mergeCells(`F${rowIndex}:H${rowIndex}`)
    worksheet.getCell(`F${rowIndex}`).value = "DATE"
    worksheet.getCell(`F${rowIndex}`).font = {
      bold: true,
      color: { argb: labelTextColor },
    }
    worksheet.getCell(`F${rowIndex}`).alignment = { horizontal: "right" }

    rowIndex++

    worksheet.mergeCells(`C${rowIndex}:E${rowIndex}`)
    worksheet.getCell(`C${rowIndex}`).value = `QUT/${quotation.id}/24-25`

    worksheet.mergeCells(`F${rowIndex}:H${rowIndex}`)
    worksheet.getCell(`F${rowIndex}`).value =
      quotation.date || new Date().toISOString().split("T")[0]
    worksheet.getCell(`F${rowIndex}`).alignment = { horizontal: "right" }

    rowIndex++

    worksheet.mergeCells(`C${rowIndex}:E${rowIndex}`)
    worksheet.getCell(`C${rowIndex}`).value = "CURRENCY"
    worksheet.getCell(`C${rowIndex}`).font = {
      bold: true,
      color: { argb: labelTextColor },
    }

    worksheet.mergeCells(`F${rowIndex}:H${rowIndex}`)
    worksheet.getCell(`F${rowIndex}`).value = "CONVERSION RATE"
    worksheet.getCell(`F${rowIndex}`).font = {
      bold: true,
      color: { argb: labelTextColor },
    }
    worksheet.getCell(`F${rowIndex}`).alignment = { horizontal: "right" }

    rowIndex++

    worksheet.mergeCells(`C${rowIndex}:E${rowIndex}`)
    worksheet.getCell(`C${rowIndex}`).value = quotation.Currency
      ? quotation.Currency.currency
      : "N/A"

    worksheet.mergeCells(`F${rowIndex}:H${rowIndex}`)
    worksheet.getCell(`F${rowIndex}`).value =
      `${quotation.conversion_rate || "N/A"} INR`
    worksheet.getCell(`F${rowIndex}`).alignment = { horizontal: "right" }

    // Add borders to quotation details cells
    for (let r = companyRow; r <= rowIndex; r++) {
      for (let c = 3; c <= 8; c++) {
        worksheet.getCell(r, c).border = {
          top: { style: "thin", color: { argb: tableBorderColor } },
          left: { style: "thin", color: { argb: tableBorderColor } },
          bottom: { style: "thin", color: { argb: tableBorderColor } },
          right: { style: "thin", color: { argb: tableBorderColor } },
        }
      }
    }

    rowIndex++

    // Consignee Details
    worksheet.mergeCells(`A${rowIndex}:H${rowIndex}`)
    const consigneeHeaderCell = worksheet.getCell(`A${rowIndex}`)
    consigneeHeaderCell.value = "CONSIGNEE DETAILS:"
    consigneeHeaderCell.font = {
      size: 12,
      bold: true,
      color: { argb: labelTextColor },
    }
    consigneeHeaderCell.border = {
      top: { style: borderStyle, color: { argb: tableBorderColor } },
      left: { style: borderStyle, color: { argb: tableBorderColor } },
      bottom: { style: borderStyle, color: { argb: tableBorderColor } },
      right: { style: borderStyle, color: { argb: tableBorderColor } },
    }
    worksheet.getRow(rowIndex).height = 20
    rowIndex++

    // Consignee Name
    worksheet.mergeCells(`A${rowIndex}:B${rowIndex}`)
    worksheet.getCell(`A${rowIndex}`).value = "Name:"
    worksheet.getCell(`A${rowIndex}`).font = { bold: true }
    worksheet.getCell(`A${rowIndex}`).border = {
      top: { style: "thin", color: { argb: tableBorderColor } },
      left: { style: borderStyle, color: { argb: tableBorderColor } },
      bottom: { style: "thin", color: { argb: tableBorderColor } },
      right: { style: "thin", color: { argb: tableBorderColor } },
    }

    worksheet.mergeCells(`C${rowIndex}:H${rowIndex}`)
    worksheet.getCell(`C${rowIndex}`).value = quotation.Consignee
      ? quotation.Consignee.name
      : "N/A"
    worksheet.getCell(`C${rowIndex}`).border = {
      top: { style: "thin", color: { argb: tableBorderColor } },
      left: { style: "thin", color: { argb: tableBorderColor } },
      bottom: { style: "thin", color: { argb: tableBorderColor } },
      right: { style: borderStyle, color: { argb: tableBorderColor } },
    }
    rowIndex++

    // Consignee Address
    worksheet.mergeCells(`A${rowIndex}:B${rowIndex}`)
    worksheet.getCell(`A${rowIndex}`).value = "Address:"
    worksheet.getCell(`A${rowIndex}`).font = { bold: true }
    worksheet.getCell(`A${rowIndex}`).border = {
      top: { style: "thin", color: { argb: tableBorderColor } },
      left: { style: borderStyle, color: { argb: tableBorderColor } },
      bottom: { style: "thin", color: { argb: tableBorderColor } },
      right: { style: "thin", color: { argb: tableBorderColor } },
    }

    worksheet.mergeCells(`C${rowIndex}:H${rowIndex}`)
    worksheet.getCell(`C${rowIndex}`).value = quotation.Consignee
      ? quotation.Consignee.address
      : "N/A"
    worksheet.getCell(`C${rowIndex}`).border = {
      top: { style: "thin", color: { argb: tableBorderColor } },
      left: { style: "thin", color: { argb: tableBorderColor } },
      bottom: { style: "thin", color: { argb: tableBorderColor } },
      right: { style: borderStyle, color: { argb: tableBorderColor } },
    }
    rowIndex++

    // Consignee Country
    worksheet.mergeCells(`A${rowIndex}:B${rowIndex}`)
    worksheet.getCell(`A${rowIndex}`).value = "Country:"
    worksheet.getCell(`A${rowIndex}`).font = { bold: true }
    worksheet.getCell(`A${rowIndex}`).border = {
      top: { style: "thin", color: { argb: tableBorderColor } },
      left: { style: borderStyle, color: { argb: tableBorderColor } },
      bottom: { style: "thin", color: { argb: tableBorderColor } },
      right: { style: "thin", color: { argb: tableBorderColor } },
    }

    worksheet.mergeCells(`C${rowIndex}:H${rowIndex}`)
    worksheet.getCell(`C${rowIndex}`).value = quotation.Country
      ? quotation.Country.country_name
      : "N/A"
    worksheet.getCell(`C${rowIndex}`).border = {
      top: { style: "thin", color: { argb: tableBorderColor } },
      left: { style: "thin", color: { argb: tableBorderColor } },
      bottom: { style: "thin", color: { argb: tableBorderColor } },
      right: { style: borderStyle, color: { argb: tableBorderColor } },
    }
    rowIndex++

    // Shipping Details
    worksheet.mergeCells(`A${rowIndex}:H${rowIndex}`)
    const shippingHeaderCell = worksheet.getCell(`A${rowIndex}`)
    shippingHeaderCell.value = "SHIPPING DETAILS:"
    shippingHeaderCell.font = {
      size: 12,
      bold: true,
      color: { argb: labelTextColor },
    }
    shippingHeaderCell.border = {
      top: { style: borderStyle, color: { argb: tableBorderColor } },
      left: { style: borderStyle, color: { argb: tableBorderColor } },
      bottom: { style: borderStyle, color: { argb: tableBorderColor } },
      right: { style: borderStyle, color: { argb: tableBorderColor } },
    }
    worksheet.getRow(rowIndex).height = 20
    rowIndex++

    // Port Destination
    worksheet.mergeCells(`A${rowIndex}:B${rowIndex}`)
    worksheet.getCell(`A${rowIndex}`).value = "Port Destination:"
    worksheet.getCell(`A${rowIndex}`).font = { bold: true }
    worksheet.getCell(`A${rowIndex}`).border = {
      top: { style: "thin", color: { argb: tableBorderColor } },
      left: { style: borderStyle, color: { argb: tableBorderColor } },
      bottom: { style: borderStyle, color: { argb: tableBorderColor } },
      right: { style: "thin", color: { argb: tableBorderColor } },
    }

    worksheet.mergeCells(`C${rowIndex}:H${rowIndex}`)
    worksheet.getCell(`C${rowIndex}`).value = quotation.Port
      ? quotation.Port.portName
      : "N/A"
    worksheet.getCell(`C${rowIndex}`).border = {
      top: { style: "thin", color: { argb: tableBorderColor } },
      left: { style: "thin", color: { argb: tableBorderColor } },
      bottom: { style: borderStyle, color: { argb: tableBorderColor } },
      right: { style: borderStyle, color: { argb: tableBorderColor } },
    }
    rowIndex++

    // Add a little space before the goods table
    rowIndex++

    // Goods Table Header
    const tableHeaderRow = rowIndex
    worksheet.getCell(`A${rowIndex}`).value = "SR. NO."
    worksheet.getCell(`B${rowIndex}`).value = "DESCRIPTION"
    worksheet.getCell(`C${rowIndex}`).value = "QUANTITY"
    worksheet.getCell(`D${rowIndex}`).value = "UNIT"
    worksheet.getCell(`E${rowIndex}`).value = "PRICE"
    worksheet.getCell(`F${rowIndex}`).value = "NET WEIGHT"
    worksheet.getCell(`G${rowIndex}`).value = "GROSS WEIGHT"
    worksheet.getCell(`H${rowIndex}`).value = "TOTAL"

    // Style all header cells
    for (let col = 1; col <= 8; col++) {
      const cell = worksheet.getCell(rowIndex, col)
      cell.font = { bold: true, color: { argb: headerTextColor } }
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: tableHeaderBgColor },
      }
      cell.border = {
        top: { style: "thin", color: { argb: tableBorderColor } },
        left: { style: "thin", color: { argb: tableBorderColor } },
        bottom: { style: "thin", color: { argb: tableBorderColor } },
        right: { style: "thin", color: { argb: tableBorderColor } },
      }
      cell.alignment = { horizontal: "center", vertical: "middle" }
    }
    worksheet.getRow(rowIndex).height = 20
    rowIndex++

    // Goods Table Data
    if (quotation.QuotationProducts && quotation.QuotationProducts.length > 0) {
      quotation.QuotationProducts.forEach((product, index) => {
        worksheet.getCell(`A${rowIndex}`).value = index + 1
        worksheet.getCell(`B${rowIndex}`).value = product.Product
          ? product.Product.productName
          : "N/A"
        worksheet.getCell(`C${rowIndex}`).value = product.quantity || 0
        worksheet.getCell(`D${rowIndex}`).value = product.Unit
          ? product.Unit.orderUnit
          : "N/A"
        worksheet.getCell(`E${rowIndex}`).value =
          `${product.price || 0} ${quotation.Currency ? quotation.Currency.currency : ""}`
        worksheet.getCell(`F${rowIndex}`).value = product.net_weight || 0
        worksheet.getCell(`G${rowIndex}`).value = product.gross_weight || 0
        worksheet.getCell(`H${rowIndex}`).value = product.total || 0

        // Style all data cells
        for (let col = 1; col <= 8; col++) {
          const cell = worksheet.getCell(rowIndex, col)
          cell.border = {
            top: { style: "thin", color: { argb: tableBorderColor } },
            left: { style: "thin", color: { argb: tableBorderColor } },
            bottom: { style: "thin", color: { argb: tableBorderColor } },
            right: { style: "thin", color: { argb: tableBorderColor } },
          }
          cell.alignment = { horizontal: "center", vertical: "middle" }
        }
        rowIndex++
      })
    } else {
      // No products message
      worksheet.mergeCells(`A${rowIndex}:H${rowIndex}`)
      worksheet.getCell(`A${rowIndex}`).value = "No products found"
      worksheet.getCell(`A${rowIndex}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      }
      worksheet.getCell(`A${rowIndex}`).border = {
        top: { style: "thin", color: { argb: tableBorderColor } },
        left: { style: "thin", color: { argb: tableBorderColor } },
        bottom: { style: "thin", color: { argb: tableBorderColor } },
        right: { style: "thin", color: { argb: tableBorderColor } },
      }
      rowIndex++
    }

    // Calculate totals
    let totalNetWeight = 0
    let totalGrossWeight = 0
    let totalPackages = 0

    if (quotation.QuotationProducts && quotation.QuotationProducts.length > 0) {
      quotation.QuotationProducts.forEach((product) => {
        totalNetWeight += parseFloat(product.net_weight || 0)
        totalGrossWeight += parseFloat(product.gross_weight || 0)
        totalPackages += parseInt(product.total_package || 0)
      })
    }

    // Net Weight / Gross Weight row
    worksheet.mergeCells(`A${rowIndex}:E${rowIndex}`)
    worksheet.getCell(`F${rowIndex}`).value =
      `Total Net Weight: ${totalNetWeight || quotation.totalNetWeight || 0}`
    worksheet.getCell(`G${rowIndex}`).value =
      `Total Gross Weight: ${totalGrossWeight || quotation.totalGrossWeight || 0}`

    // Style this row as a totals row
    for (let col = 1; col <= 8; col++) {
      const cell = worksheet.getCell(rowIndex, col)
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: totalsRowBgColor },
      }
      cell.border = {
        top: { style: "medium", color: { argb: tableBorderColor } },
        left: { style: "thin", color: { argb: tableBorderColor } },
        bottom: { style: "thin", color: { argb: tableBorderColor } },
        right: { style: "thin", color: { argb: tableBorderColor } },
      }
      if (col === 6 || col === 7) {
        cell.font = { bold: true }
      }
    }
    rowIndex++

    // Total Package row
    worksheet.mergeCells(`A${rowIndex}:G${rowIndex}`)
    worksheet.getCell(`A${rowIndex}`).value = "Total Package:"
    worksheet.getCell(`A${rowIndex}`).alignment = {
      horizontal: "right",
      vertical: "middle",
    }
    worksheet.getCell(`A${rowIndex}`).font = { bold: true }
    worksheet.getCell(`H${rowIndex}`).value = totalPackages
    worksheet.getCell(`H${rowIndex}`).alignment = {
      horizontal: "center",
      vertical: "middle",
    }

    // Style this row
    for (let col = 1; col <= 8; col++) {
      const cell = worksheet.getCell(rowIndex, col)
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: totalsRowBgColor },
      }
      cell.border = {
        top: { style: "thin", color: { argb: tableBorderColor } },
        left: { style: "thin", color: { argb: tableBorderColor } },
        bottom: { style: "thin", color: { argb: tableBorderColor } },
        right: { style: "thin", color: { argb: tableBorderColor } },
      }
    }
    rowIndex++

    // Package row - only if there are products with packages
    if (
      quotation.QuotationProducts &&
      quotation.QuotationProducts.length > 0 &&
      quotation.QuotationProducts[0].Package
    ) {
      worksheet.mergeCells(`A${rowIndex}:G${rowIndex}`)
      worksheet.getCell(`A${rowIndex}`).value = "Package:"
      worksheet.getCell(`A${rowIndex}`).alignment = {
        horizontal: "right",
        vertical: "middle",
      }
      worksheet.getCell(`A${rowIndex}`).font = { bold: true }

      // Format package info as in the HTML template
      const packageInfo = `${quotation.QuotationProducts[0].Package.netWeight} (${quotation.QuotationProducts[0].Package.grossWeight})`
      worksheet.getCell(`H${rowIndex}`).value = packageInfo
      worksheet.getCell(`H${rowIndex}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      }

      // Style this row
      for (let col = 1; col <= 8; col++) {
        const cell = worksheet.getCell(rowIndex, col)
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: totalsRowBgColor },
        }
        cell.border = {
          top: { style: "thin", color: { argb: tableBorderColor } },
          left: { style: "thin", color: { argb: tableBorderColor } },
          bottom: { style: "thin", color: { argb: tableBorderColor } },
          right: { style: "thin", color: { argb: tableBorderColor } },
        }
      }
      rowIndex++
    }

    // Total (Native Currency) row
    worksheet.mergeCells(`A${rowIndex}:G${rowIndex}`)
    worksheet.getCell(`A${rowIndex}`).value = "Total (Native Currency):"
    worksheet.getCell(`A${rowIndex}`).alignment = {
      horizontal: "right",
      vertical: "middle",
    }
    worksheet.getCell(`A${rowIndex}`).font = { bold: true }
    worksheet.getCell(`H${rowIndex}`).value =
      `${quotation.total_native || 0} ${quotation.Currency ? quotation.Currency.currency : ""}`
    worksheet.getCell(`H${rowIndex}`).alignment = {
      horizontal: "center",
      vertical: "middle",
    }

    // Style this row
    for (let col = 1; col <= 8; col++) {
      const cell = worksheet.getCell(rowIndex, col)
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: totalsRowBgColor },
      }
      cell.border = {
        top: { style: "thin", color: { argb: tableBorderColor } },
        left: { style: "thin", color: { argb: tableBorderColor } },
        bottom: { style: "thin", color: { argb: tableBorderColor } },
        right: { style: "thin", color: { argb: tableBorderColor } },
      }
    }
    rowIndex++

    // Total (INR) row
    worksheet.mergeCells(`A${rowIndex}:G${rowIndex}`)
    worksheet.getCell(`A${rowIndex}`).value = "Total (INR):"
    worksheet.getCell(`A${rowIndex}`).alignment = {
      horizontal: "right",
      vertical: "middle",
    }
    worksheet.getCell(`A${rowIndex}`).font = { bold: true }
    worksheet.getCell(`H${rowIndex}`).value = `${quotation.total_inr || 0} INR`
    worksheet.getCell(`H${rowIndex}`).alignment = {
      horizontal: "center",
      vertical: "middle",
    }

    // Style this row
    for (let col = 1; col <= 8; col++) {
      const cell = worksheet.getCell(rowIndex, col)
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: totalsRowBgColor },
      }
      cell.border = {
        top: { style: "thin", color: { argb: tableBorderColor } },
        left: { style: "thin", color: { argb: tableBorderColor } },
        bottom: { style: "thin", color: { argb: tableBorderColor } },
        right: { style: "thin", color: { argb: tableBorderColor } },
      }
    }
    rowIndex++

    // Add space for signature
    rowIndex += 1

    // Add Signature
    worksheet.mergeCells(`A${rowIndex}:H${rowIndex}`)
    const signatureCell = worksheet.getCell(`A${rowIndex}`)
    signatureCell.value = "AUTHORISED SIGNATORY"
    signatureCell.font = { bold: true, color: { argb: headerBgColor } }
    signatureCell.alignment = { horizontal: "right", vertical: "middle" }

    // Update content end row for border
    const contentEndRow = rowIndex

    // Add outer border around the entire table
    for (let row = contentStartRow; row <= contentEndRow; row++) {
      for (let col = 1; col <= 8; col++) {
        const cell = worksheet.getCell(row, col)

        // Add thick border only to the outer edges
        if (row === contentStartRow) {
          // Top row
          cell.border = {
            ...(cell.border || {}),
            top: { style: "thick", color: { argb: tableBorderColor } },
          }
        }

        if (row === contentEndRow) {
          // Bottom row
          cell.border = {
            ...(cell.border || {}),
            bottom: { style: "thick", color: { argb: tableBorderColor } },
          }
        }

        if (col === 1) {
          // Leftmost column
          cell.border = {
            ...(cell.border || {}),
            left: { style: "thick", color: { argb: tableBorderColor } },
          }
        }

        if (col === 8) {
          // Rightmost column
          cell.border = {
            ...(cell.border || {}),
            right: { style: "thick", color: { argb: tableBorderColor } },
          }
        }
      }
    }

    // Generate Excel buffer
    const excelBuffer = await workbook.xlsx.writeBuffer()

    // Upload to S3
    const fileName = `quotations-Kuntal/${id}.xlsx`
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: excelBuffer,
      ContentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ContentDisposition: `attachment; filename="Quotation-${id}.xlsx"`,
    }

    await s3.upload(uploadParams).promise()

    const excelUrl = s3.getSignedUrl("getObject", {
      Bucket: "shipzy-test-bucket",
      Key: fileName,
      Expires: 3600,
    })

    res.status(200).json({
      message: "Excel generated and uploaded successfully",
      excelUrl: excelUrl,
    })
  } catch (error) {
    console.error("Error generating and uploading Excel:", error)
    res.status(500).json({ error: "Internal Server Error" })
  }
}

// export const sendQuotationEmail = async (req, res) => {
//   try {
//     const { quotationId, subject, receiverEmail, ccEmail, replyTo, content } =
//       req.body

//     // Fetch quotation details
//     const quotation = await quotationSchema.findByPk(quotationId, {
//       include: [
//         { model: consigneeSchema, attributes: ["name", "address"] },
//         { model: currencySchema, attributes: ["currency"] },
//       ],
//     })

//     if (!quotation) {
//       return res.status(404).json({ error: "Quotation not found" })
//     }

//     // Generate PDF if not already available
//     const fileName = `quotations-Kuntal-${quotationId}.pdf`
//     const pdfUrl = s3.getSignedUrl("getObject", {
//       Bucket: "shipzy-test-bucket",
//       Key: fileName,
//       Expires: 3600,
//     })

//     // Download PDF from S3
//     const pdfResponse = await fetch(pdfUrl)
//     const pdfBuffer = await pdfResponse.buffer()

//     // Configure nodemailer
//     const transporter = nodemailer.createTransport({
//       service: "gmail", // or your email service
//       auth: {
//         user: "icebear7327@gmail.com", // Add to .env
//         pass: "ysnluqpijofchdzj", // Add to .env
//       },
//     })

//     // Email options
//     const mailOptions = {
//       from: "icebear7327@gmail.com",
//       to: receiverEmail,
//       cc: ccEmail || "",
//       replyTo: replyTo,
//       subject: subject,
//       text: content,
//       attachments: [
//         {
//           filename: `Quotation-${quotationId}.pdf`,
//           content: pdfBuffer,
//           contentType: "application/pdf",
//         },
//       ],
//     }

//     // Send email
//     await transporter.sendMail(mailOptions)

//     res.status(200).json({ success: true, message: "Email sent successfully" })
//   } catch (error) {
//     console.error("Error sending email:", error)
//     res.status(500).json({ success: false, error: "Failed to send email" })
//   }
// }

export const sendQuotationEmail = async (req, res) => {
  // Use Multer middleware to handle file uploads
  upload(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err)
      return res.status(400).json({ success: false, error: err.message })
    }

    try {
      const { quotationId, subject, receiverEmail, ccEmail, replyTo, content } =
        req.body

      // Fetch quotation details
      const quotation = await quotationSchema.findByPk(quotationId, {
        include: [
          { model: consigneeSchema, attributes: ["name", "address"] },
          { model: currencySchema, attributes: ["currency"] },
        ],
      })

      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" })
      }

      // Generate or fetch PDF
      const fileName = `quotations-Kuntal-${quotationId}.pdf`
      const pdfUrl = s3.getSignedUrl("getObject", {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Expires: 3600,
      })

      // Download PDF from S3
      const pdfResponse = await fetch(pdfUrl)
      if (!pdfResponse.ok) {
        throw new Error("Failed to fetch PDF from S3")
      }
      const pdfBuffer = await pdfResponse.buffer()

      // Configure nodemailer
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "icebear7327@gmail.com",
          pass: "ysnluqpijofchdzj",
        },
      })

      // Prepare attachments
      const attachments = [
        {
          filename: `Quotation-${quotationId}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ]

      // Add additional uploaded files (if any)
      if (req.files && req.files.length > 0) {
        req.files.forEach((file) => {
          attachments.push({
            filename: file.originalname,
            path: file.path, // Use the temporary file path from Multer
            contentType: file.mimetype,
          })
        })
      }

      // Email options
      const mailOptions = {
        from: "icebear7327@gmail.com",
        to: receiverEmail,
        cc: ccEmail || "",
        replyTo: replyTo,
        subject: subject,
        text: content,
        attachments: attachments,
      }

      // Send email
      await transporter.sendMail(mailOptions)

      // Clean up uploaded files (optional, if you don't want to keep them on disk)
      // const fs = require('fs').promises;
      // if (req.files) {
      //   await Promise.all(req.files.map(file => fs.unlink(file.path)));
      // }

      res
        .status(200)
        .json({ success: true, message: "Email sent successfully" })
    } catch (error) {
      console.error("Error sending email:", error)
      res.status(500).json({ success: false, error: "Failed to send email" })
    }
  })
}
