"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
// Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = (0, multer_1.default)({ storage });
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
// Protect all admin routes, ensure only authenticated users can access
router.use(auth_middleware_1.authenticate);
// Telemetry & read-only student/staff endpoints accessible by super_admin, school_admin and teacher
router.get('/dashboard-stats', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher']), admin_controller_1.getDashboardStats);
router.get('/students', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher']), admin_controller_1.getAllStudents);
router.get('/staff', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher']), admin_controller_1.getAllStaff);
router.post('/upload', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher']), upload.single('profile_image'), admin_controller_1.uploadImage);
// Administrative operations restricted to super_admin and school_admin
router.use((0, rbac_middleware_1.authorize)(['super_admin', 'school_admin']));
router.post('/promote', admin_controller_1.promoteStudents);
router.post('/assign-roll-numbers', admin_controller_1.assignRollNumbers);
router.post('/staff', admin_controller_1.createStaff);
router.put('/staff/:id', admin_controller_1.updateStaff);
router.delete('/staff/:id', admin_controller_1.deleteStaff);
router.get('/next-admission-number', admin_controller_1.getNextAdmissionNumber);
router.post('/add-family', admin_controller_1.addFamily);
router.post('/family', admin_controller_1.addFamily);
router.put('/students/:id', admin_controller_1.updateStudent);
router.delete('/students/:id', admin_controller_1.deleteStudent);
exports.default = router;
