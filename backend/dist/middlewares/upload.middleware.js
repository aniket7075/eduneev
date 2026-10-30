"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure uploads directory exists
const uploadDir = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const fileFilter = (req, file, cb) => {
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    // Standard video, image, and document extensions
    const allowedExtensions = [
        '.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif',
        '.pdf',
        '.mp4', '.mov', '.mkv', '.3gp', '.3gpp', '.avi', '.webm', '.mpeg', '.ogg'
    ];
    const allowedMimeTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif',
        'application/pdf',
        'video/mp4', 'video/quicktime', 'video/3gpp', 'video/x-msvideo', 'video/x-matroska', 'video/webm', 'video/mpeg', 'video/ogg'
    ];
    const isAllowedMimeType = allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');
    const isAllowedExtension = allowedExtensions.includes(ext);
    if (isAllowedMimeType || isAllowedExtension) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only standard images, videos, and PDFs are allowed.'), false);
    }
};
exports.uploadMiddleware = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});
