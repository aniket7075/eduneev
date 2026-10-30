import { Router } from 'express';
import { createExam, addResults, getStudentResults } from '../controllers/result.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);

// Teacher and Admins
router.post('/exam', authorize(['super_admin', 'school_admin', 'teacher']), createExam);
router.post('/', authorize(['super_admin', 'school_admin', 'teacher']), addResults);

// Parents, Teachers, Admins
router.get('/student/:studentId', getStudentResults);

export default router;
