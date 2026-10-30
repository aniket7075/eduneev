import { Router } from 'express';
import { 
  getHealthRecords, 
  upsertHealthRecord, 
  deleteHealthRecord,
  createSickReport,
  updateSickReportStatus,
  addMedicalCheckup
} from '../controllers/health.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);

// Sick Reports (Parent and Staff)
router.post('/sick-report', authorize(['super_admin', 'school_admin', 'teacher', 'parent']), createSickReport);
router.patch('/sick-report/:id', authorize(['super_admin', 'school_admin', 'teacher']), updateSickReportStatus);

// Medical Checkups (Staff)
router.post('/checkup/:student_id', authorize(['super_admin', 'school_admin', 'teacher']), addMedicalCheckup);

// Get health records for a specific student (Accessible by admin, teacher, parent)
router.get('/:student_id', authorize(['super_admin', 'school_admin', 'teacher', 'parent']), getHealthRecords);

// Create or update health records (Accessible by admin, teacher)
router.post('/:student_id', authorize(['super_admin', 'school_admin', 'teacher']), upsertHealthRecord);

// Delete health records (Admin only)
router.delete('/:student_id', authorize(['super_admin', 'school_admin']), deleteHealthRecord);

export default router;
