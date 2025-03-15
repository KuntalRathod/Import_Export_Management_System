import multer from "multer"
import path from "path"

// Set storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/") // Directory where files will be temporarily stored
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    )
  },
})

// File filter to allow only specific file types (e.g., PDF, Excel, images)
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/jpeg",
    "image/png",
  ]
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(
      new Error(
        "Invalid file type. Only PDF, Excel, JPEG, and PNG are allowed."
      )
    )
  }
}

// Multer configuration
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: fileFilter,
}).array("attachments", 10) // Allow up to 10 files with field name "attachments"

export default upload
