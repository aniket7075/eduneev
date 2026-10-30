import { Router } from 'express';
import { getEvents, createEvent, deleteEvent } from '../controllers/event.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);

// Get all events (Accessible by all roles)
router.get('/', getEvents);

// Create an event (Super Admin & School Admin only)
router.post('/', authorize(['super_admin', 'school_admin']), createEvent);

// Delete an event (Admin)
router.delete('/:id', authorize(['super_admin', 'school_admin']), deleteEvent);

export default router;
