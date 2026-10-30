import { Router } from 'express';
import { getPtmSchedules, createPtmSchedule, bookPtmSlot } from '../controllers/ptm.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);

// Get schedules (Accessible by all roles)
router.get('/', getPtmSchedules);

// Create a PTM Schedule (Admin, Teacher)
router.post('/schedules', authorize(['super_admin', 'school_admin', 'teacher']), createPtmSchedule);

// Book a slot (Parent)
router.post('/book', authorize(['super_admin', 'school_admin', 'parent']), bookPtmSlot);

export default router;
