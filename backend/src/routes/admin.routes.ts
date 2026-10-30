import { Router } from 'express';
import { getAllStaff, createStaff, updateStaff, deleteStaff, getAllStudents, addFamily, updateStudent, deleteStudent, uploadImage, getDashboardStats, promoteStudents, assignRollNumbers, getNextAdmissionNumber } from '../controllers/admin.controller';
import multer from 'multer';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    cb(null, uploadDir);
  },
  filename: (req: any, file: any, cb: any) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';

const router = Router();

// Protect all admin routes, ensure only authenticated users can access
router.use(authenticate);

// Telemetry & read-only student/staff endpoints accessible by super_admin, school_admin and teacher
router.get('/dashboard-stats', authorize(['super_admin', 'school_admin', 'teacher']), getDashboardStats);
router.get('/students', authorize(['super_admin', 'school_admin', 'teacher']), getAllStudents);
router.get('/staff', authorize(['super_admin', 'school_admin', 'teacher']), getAllStaff);
router.post('/upload', authorize(['super_admin', 'school_admin', 'teacher']), upload.single('profile_image'), uploadImage);

// Administrative operations restricted to super_admin and school_admin
router.use(authorize(['super_admin', 'school_admin']));

router.post('/promote', promoteStudents);
router.post('/assign-roll-numbers', assignRollNumbers);

router.post('/staff', createStaff);
router.put('/staff/:id', updateStaff);
router.delete('/staff/:id', deleteStaff);

router.get('/next-admission-number', getNextAdmissionNumber);
router.post('/add-family', addFamily);
router.post('/family', addFamily);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

export default router;
