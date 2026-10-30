import { Router } from 'express';
import { getClasses, createClass, updateClass, deleteClass } from '../controllers/classes.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);

// Everyone authenticated can GET classes
router.get('/', getClasses);

// Only admins can modify classes
router.post('/', authorize(['super_admin', 'school_admin']), createClass);
router.put('/:id', authorize(['super_admin', 'school_admin']), updateClass);
router.delete('/:id', authorize(['super_admin', 'school_admin']), deleteClass);

export default router;
