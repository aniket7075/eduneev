import { Router } from 'express';
import { getCameras, addCamera, updateCamera, deleteCamera } from '../controllers/cctv.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);

// Get cameras (Accessible by admin and teachers)
router.get('/', authorize(['super_admin', 'school_admin', 'teacher']), getCameras);

// Add camera (Admin only)
router.post('/', authorize(['super_admin', 'school_admin']), addCamera);

// Update camera (Admin only)
router.put('/:id', authorize(['super_admin', 'school_admin']), updateCamera);

// Delete camera (Admin only)
router.delete('/:id', authorize(['super_admin', 'school_admin']), deleteCamera);

export default router;
