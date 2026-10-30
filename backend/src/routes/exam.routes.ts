import { Router } from 'express';
import { createExam, getExams, enterMarks, getReportCard } from '../controllers/exam.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/:grade', getExams);
router.post('/', createExam);
router.post('/marks', enterMarks);
router.get('/marks/:student_id', getReportCard);

export default router;
