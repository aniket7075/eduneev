import { Router } from 'express';
import { getTimetable, createTimetableEntry, updateTimetableEntry, deleteTimetableEntry, generateTimetable, getTeacherSubjects, addTeacherSubject, deleteTeacherSubject } from '../controllers/timetable.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);

// Auto-generation and teacher settings
router.post('/generate', authorize(['super_admin', 'school_admin']), generateTimetable);
router.get('/teachers/:grade', authorize(['super_admin', 'school_admin', 'teacher']), getTeacherSubjects);
router.post('/teachers', authorize(['super_admin', 'school_admin']), addTeacherSubject);
router.delete('/teachers/:id', authorize(['super_admin', 'school_admin']), deleteTeacherSubject);

// Standard CRUD
router.get('/:grade', getTimetable);
router.post('/', authorize(['super_admin', 'school_admin']), createTimetableEntry);
router.put('/:id', authorize(['super_admin', 'school_admin']), updateTimetableEntry);
router.delete('/:id', authorize(['super_admin', 'school_admin']), deleteTimetableEntry);

export default router;
