import { Router } from 'express';
import { getLessonPlans, createLessonPlan } from '../controllers/lesson_plan.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/:grade', getLessonPlans);
router.post('/', createLessonPlan);

export default router;
