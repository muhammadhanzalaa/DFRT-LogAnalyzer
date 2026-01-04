/**
 * DFRT Log Analyzer - File Upload Middleware
 * @file upload.middleware.js
 * @author DFRT Team
 * @version 2.5.0
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = req.app.get('config').uploadDir;
        
        // Create analysis-specific directory
        const analysisId = req.body.analysisId || uuidv4();
        const analysisDir = path.join(uploadDir, analysisId);
        
        if (!fs.existsSync(analysisDir)) {
            fs.mkdirSync(analysisDir, { recursive: true });
        }
        
        req.analysisDir = analysisDir;
        req.analysisId = analysisId;
        
        cb(null, analysisDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename while preserving extension
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
        cb(new Error(`File type ${ext} not allowed. Allowed types: ${allowedExtensions.join(', ')}`), false);
    }
};

// Create multer instance
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
        files: 10
    }
});

// Middleware for single file upload
const uploadSingle = upload.single('logFile');

// Middleware for multiple file upload - accept both 'logFiles' and 'files' field names
const uploadMultiple = upload.array('files', 10);
const uploadMultipleAlt = upload.array('logFiles', 10);

// Enhanced upload middleware that handles both field names
const uploadMultipleFlexible = (req, res, next) => {
    uploadMultiple(req, res, (err) => {
        if (err && (!req.files || req.files.length === 0)) {
            // Try alternative field name
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
const handleUpload = (uploadMiddleware) => {
    return (req, res, next) => {
        uploadMiddleware(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(413).json({
                        success: false,
                        error: {
                            code: 'FILE_TOO_LARGE',
                            message: 'File size exceeds 100MB limit'
                        }
                    });
                }
                if (err.code === 'LIMIT_FILE_COUNT') {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'TOO_MANY_FILES',
                            message: 'Maximum 10 files allowed'
                        }
                    });
                }
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'UPLOAD_ERROR',
                        message: err.message
                    }
                });
            } else if (err) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'UPLOAD_ERROR',
                        message: err.message
                    }
                });
            }
            next();
        });
    };
};

module.exports = {
    uploadSingle: handleUpload(uploadSingle),
    uploadMultiple: handleUpload(uploadMultipleFlexible),
    upload
};