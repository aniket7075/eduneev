import { Router } from 'express';
import { 
  getStudentFees, createRazorpayOrder, verifyPayment, assignFee, 
  getReceipt, getAllStudentsFeeSummary, getStudentLedger, 
  getNextReceiptNumberHandler, triggerFeeRemindersHandler, getPendingFeeRemindersHandler 
} from '../controllers/fee.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);

// Fee Reminders (Automated / Manual Trigger & Preview)
router.post('/send-reminders', authorize(['super_admin', 'school_admin']), triggerFeeRemindersHandler);
router.get('/reminders-preview', authorize(['super_admin', 'school_admin']), getPendingFeeRemindersHandler);

// Fee Summary Report (Admin/Teacher only)
router.get('/summary/all', authorize(['super_admin', 'school_admin', 'teacher']), getAllStudentsFeeSummary);

// Assign fees (Admin/Teacher only)
router.post('/assign', authorize(['super_admin', 'school_admin', 'teacher']), assignFee);

// Get student fees & ledger
router.get('/my-ledger', getStudentLedger);
router.get('/ledger', getStudentLedger);
router.get('/ledger/:student_id', getStudentLedger);
router.get('/', getStudentFees);
router.get('/:student_id', getStudentFees);

// Mock payment simulation
router.post('/create-order', authorize(['parent', 'super_admin', 'school_admin']), createRazorpayOrder);
router.post('/verify-payment', authorize(['super_admin', 'school_admin', 'teacher', 'parent']), verifyPayment);

// Receipt
router.get('/next-receipt-number', getNextReceiptNumberHandler);
router.get('/receipt/:payment_id', getReceipt);

export default router;
