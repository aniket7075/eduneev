import { Router } from 'express';
import { getDailyActivities, logDailyActivity } from '../controllers/activity.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);

// Get activities for a specific student (Accessible by admin, teacher, parent)
router.get('/:student_id', authorize(['super_admin', 'school_admin', 'teacher', 'parent']), getDailyActivities);

// Log daily activity for a student (Accessible by admin, teacher)
router.post('/:student_id', authorize(['super_admin', 'school_admin', 'teacher']), logDailyActivity);

export default router;
