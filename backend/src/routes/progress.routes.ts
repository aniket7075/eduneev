import { Router } from 'express';
import { 
  getStudentProgress, 
  saveStudentMilestone, 
  bulkSaveMilestones, 
  saveStudentNote, 
  saveStudentExamResult 
} from '../controllers/progress.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// Read progress
router.get('/my', getStudentProgress);
router.get('/my-progress', getStudentProgress);
router.get('/', getStudentProgress);
router.get('/:studentId', getStudentProgress);

// Admin & Teacher Real-Time Management
router.post('/:studentId/milestone', saveStudentMilestone);
router.put('/:studentId/milestones', bulkSaveMilestones);
router.post('/:studentId/note', saveStudentNote);
router.post('/:studentId/exam-result', saveStudentExamResult);

export default router;

