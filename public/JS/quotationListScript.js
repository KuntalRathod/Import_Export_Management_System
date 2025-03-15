function viewQuotation(id) {
  fetch(`/quotation/${id}/pdf`)
    .then((response) => response.json())
    .then((data) => {
      if (data.pdfUrl) {
        window.open(data.pdfUrl, "_blank")
      } else {
        console.error("No PDF URL returned")
        alert("Failed to retrieve quotation PDF")
      }
    })
    .catch((error) => {
      console.error("Error fetching PDF URL:", error)
      alert("Error retrieving quotation PDF")
    })
}

function downloadPDF(id) {
  fetch(`/quotation/${id}/pdf`)
    .then((response) => response.json())
    .then((data) => {
      if (data.pdfUrl) {
        const link = document.createElement("a")
        link.href = data.pdfUrl
        link.download = `quotation-${id}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        console.error("No PDF URL returned")
      }
    })
    .catch((error) => console.error("Error fetching PDF URL:", error))
}

function viewExcel(id) {
  fetch(`/quotation/${id}/excel`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}: ${response.statusText}`
        )
      }
      return response.json()
    })
    .then((data) => {
      if (data.excelUrl) {
        console.log("Fetching Excel from:", data.excelUrl)
        fetch(data.excelUrl, {
          method: "GET",
          headers: {
            Accept:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error(
                `Failed to fetch Excel file: ${res.status} ${res.statusText}`
              )
            }
            console.log("Excel file response headers:", res.headers)
            return res.arrayBuffer()
          })
          .then((arrayBuffer) => {
            console.log("ArrayBuffer length:", arrayBuffer.byteLength)
            if (arrayBuffer.byteLength === 0) {
              throw new Error("Received empty Excel file")
            }
            const workbook = XLSX.read(new Uint8Array(arrayBuffer), {
              type: "array",
            })
            const firstSheetName = workbook.SheetNames[0]
            console.log("Sheet name:", firstSheetName)
            const worksheet = workbook.Sheets[firstSheetName]
            const htmlString = XLSX.utils.sheet_to_html(worksheet, {
              editable: false,
            })

            const newWindow = window.open("", "_blank")
            newWindow.document.write(`
                <html>
                  <head>
                    <title>Quotation ${id} - Excel View</title>
                    <style>
                      body { font-family: Arial, sans-serif; padding: 20px; }
                      table { border-collapse: collapse; width: 100%; }
                      th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                      th { background-color: #4CAF50; color: white; }
                      tr:nth-child(even) { background-color: #f2f2f2; }
                    </style>
                  </head>
                  <body>
                    <h2>Quotation ${id} - Excel View</h2>
                    ${htmlString}
                  </body>
                </html>
              `)
            newWindow.document.close()
          })
          .catch((error) => {
            console.error("Error parsing Excel file:", error)
            alert("Failed to parse Excel file: " + error.message)
          })
      } else {
        console.error("No Excel URL returned")
        alert("Failed to retrieve quotation Excel")
      }
    })
    .catch((error) => {
      console.error("Error fetching Excel URL:", error)
      alert("Error retrieving quotation Excel: " + error.message)
    })
}
function downloadExcel(id) {
  fetch(`/quotation/${id}/excel`)
    .then((response) => response.json())
    .then((data) => {
      if (data.excelUrl) {
        const link = document.createElement("a")
        link.href = data.excelUrl
        link.download = `quotation-${id}.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        console.error("No Excel URL returned")
      }
    })
    .catch((error) => console.error("Error fetching Excel URL:", error))
}

function editQuotation(id) {
  window.location.href = `/quotation/${id}/edit`
}

function deleteQuotation(id) {
  if (confirm("Are you sure you want to delete this quotation?")) {
    fetch(`/quotation/${id}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to delete quotation")
        }
        return response.json()
      })
      .then((data) => {
        console.log(data.message)
        window.location.reload()
      })
      .catch((error) => {
        console.error("Error deleting quotation:", error)
        alert("Failed to delete quotation")
      })
  }
}
let currentQuotationId

function showSendMailModal(id) {
  currentQuotationId = id
  document.getElementById("quotationId").value = id
  document.getElementById("subject").value = `Quotation ${id} - Details`
  document.getElementById("content").value =
    `Dear Customer,\n\nPlease find attached Quotation ${id} for your reference.\n\nBest regards,\nYour Company Name`
  document.getElementById("attachmentId").textContent = id
  const modal = new bootstrap.Modal(document.getElementById("sendMailModal"))
  modal.show()
}

function viewAttachment() {
  if (currentQuotationId) {
    fetch(`/quotation/${currentQuotationId}/pdf`)
      .then((response) => response.json())
      .then((data) => {
        if (data.pdfUrl) {
          window.open(data.pdfUrl, "_blank")
        } else {
          alert("PDF not available")
        }
      })
      .catch((error) => {
        console.error("Error fetching PDF:", error)
        alert("Error retrieving PDF")
      })
  }
}

function sendEmail() {
  const form = document.getElementById("sendMailForm")
  const formData = new FormData(form)

  fetch("/quotation/send-email", {
    method: "POST",
    body: formData, // Send FormData directly, including files
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert("Email sent successfully!")
        bootstrap.Modal.getInstance(
          document.getElementById("sendMailModal")
        ).hide()
      } else {
        alert("Failed to send email: " + data.error)
      }
    })
    .catch((error) => {
      console.error("Error sending email:", error)
      alert("Error sending email")
    })
}
