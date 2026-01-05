/**
 * DFRT Log Analyzer - File Upload Middleware
 * @file upload.middleware.js
 * @author DFRT Team
 * @version 3.0.0 (Phase 4 - Backend Optimization)
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { AppError } = require('./error.middleware');

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const analysisId = req.body.analysisId || Date.now().toString();
    const analysisDir = path.join(uploadDir, analysisId);
    
    if (!fs.existsSync(analysisDir)) {
      fs.mkdirSync(analysisDir, { recursive: true });
    }
    
    req.analysisDir = analysisDir;
    req.analysisId = analysisId;
    
    cb(null, analysisDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const uniqueName = `${basename}-${Date.now()}${ext}`;
    
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.log', '.txt', '.csv', '.json', '.evtx', '.xml'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type ${ext} not allowed. Allowed types: ${allowedExtensions.join(', ')}`, 400), false);
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || 104857600), // 100MB
    files: parseInt(process.env.MAX_FILES || 10)
  }
});

// Middleware for single file upload
const uploadSingle = upload.single('logFile');

// Middleware for multiple file upload
const uploadMultiple = upload.array('files', 10);
const uploadMultipleAlt = upload.array('logFiles', 10);

// Enhanced upload middleware that handles both field names
const uploadMultipleFlexible = (req, res, next) => {
  uploadMultiple(req, res, (err) => {
    if (err && (!req.files || req.files.length === 0)) {
      uploadMultipleAlt(req, res, (err2) => {
        if (err2) {
          next(err2);
        } else {
          next();
        }
      });
    } else {
      next(err);
    }
  });
};

// Wrapper to handle multer errors
const fileUploadValidator = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('File size exceeds limit', 413));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(new AppError('Maximum file limit exceeded', 400));
        }
        return next(new AppError(err.message, 400));
      } else if (err) {
        return next(err);
      }
      next();
    });
  };
};

module.exports = {
  uploadSingle: fileUploadValidator(uploadSingle),
  uploadMultiple: fileUploadValidator(uploadMultipleFlexible),
  fileUploadValidator,
  upload
};