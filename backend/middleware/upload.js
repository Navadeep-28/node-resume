// backend/middleware/upload.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Ensure upload directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueId}${ext}`);
  }
});

// Allowed MIME types
const allowedMimeTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'text/plain', // .txt
  'application/rtf', // .rtf
];

// Allowed extensions
const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt', '.rtf'];

// File filter
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;

  // Check extension
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error(`Invalid file extension. Allowed: ${allowedExtensions.join(', ')}`), false);
  }

  // Check MIME type
  if (!allowedMimeTypes.includes(mimeType)) {
    return cb(new Error(`Invalid file type. Allowed: PDF, DOCX, DOC, TXT, RTF`), false);
  }

  cb(null, true);
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 50 // Max 50 files per upload
  }
});

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          error: 'File too large',
          message: 'Maximum file size is 10MB'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          error: 'Too many files',
          message: 'Maximum 50 files per upload'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          error: 'Unexpected field',
          message: 'Invalid form field name'
        });
      default:
        return res.status(400).json({
          error: 'Upload error',
          message: err.message
        });
    }
  }
  
  if (err) {
    return res.status(400).json({
      error: 'Upload failed',
      message: err.message
    });
  }
  
  next();
};

// Clean up uploaded files utility
const cleanupFiles = async (files) => {
  if (!files) return;
  
  const fileArray = Array.isArray(files) ? files : [files];
  
  for (const file of fileArray) {
    try {
      if (fs.existsSync(file.path)) {
        await fs.promises.unlink(file.path);
      }
    } catch (error) {
      console.error(`Error deleting file ${file.path}:`, error);
    }
  }
};

// Validate file exists middleware
const validateFileExists = (req, res, next) => {
  if (!req.file && (!req.files || req.files.length === 0)) {
    return res.status(400).json({
      error: 'No file uploaded',
      message: 'Please select a file to upload'
    });
  }
  next();
};

// Single file upload
const uploadSingle = upload.single('resume');

// Multiple files upload
const uploadMultiple = upload.array('resumes', 50);

// Fields upload (for different file types)
const uploadFields = upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'coverLetter', maxCount: 1 },
  { name: 'documents', maxCount: 5 }
]);

export {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  handleUploadError,
  validateFileExists,
  cleanupFiles,
  allowedMimeTypes,
  allowedExtensions
};

export default upload;