const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only images (JPEG, PNG) and PDFs are allowed'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

const verifyFileContent = async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    const { fileTypeFromBuffer } = await import('file-type');

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const detected = await fileTypeFromBuffer(req.file.buffer);

    if (!detected || !allowedTypes.includes(detected.mime)) {
        return res.status(400).json({
            message: 'File content does not match an allowed type (JPEG, PNG, PDF)'
        });
    }

    next();
};

module.exports = { upload, verifyFileContent };
