import { Router } from 'express';
import {
  getFranchiseFeeStructures,
  saveFranchiseFeeStructure,
  resetFranchiseFeeStructure,
  applyStructureToStudents
} from '../controllers/feeStructure.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);

// Public/All authenticated staff can view fee structures
router.get('/', getFranchiseFeeStructures);

// Super admin and franchise school admins can update fee structures
router.post('/save', authorize(['super_admin', 'school_admin']), saveFranchiseFeeStructure);
router.put('/save', authorize(['super_admin', 'school_admin']), saveFranchiseFeeStructure);

// Reset franchise back to default master template
router.post('/reset', authorize(['super_admin', 'school_admin']), resetFranchiseFeeStructure);

// Assign/Sync this fee structure to enrolled students
router.post('/apply-to-students', authorize(['super_admin', 'school_admin']), applyStructureToStudents);

export default router;
