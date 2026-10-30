import { Router } from 'express';
import { getPayments, createPayment } from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);

// Get payments (Admin)
router.get('/', authorize(['super_admin', 'school_admin']), getPayments);

// Create Payment (Parent/Admin)
router.post('/', authorize(['super_admin', 'school_admin', 'parent']), createPayment);

export default router;
