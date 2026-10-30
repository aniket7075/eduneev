"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fee_controller_1 = require("../controllers/fee.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Fee Reminders (Automated / Manual Trigger & Preview)
router.post('/send-reminders', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin']), fee_controller_1.triggerFeeRemindersHandler);
router.get('/reminders-preview', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin']), fee_controller_1.getPendingFeeRemindersHandler);
// Fee Summary Report (Admin/Teacher only)
router.get('/summary/all', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher']), fee_controller_1.getAllStudentsFeeSummary);
// Assign fees (Admin/Teacher only)
router.post('/assign', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher']), fee_controller_1.assignFee);
// Get student fees & ledger
router.get('/my-ledger', fee_controller_1.getStudentLedger);
router.get('/ledger', fee_controller_1.getStudentLedger);
router.get('/ledger/:student_id', fee_controller_1.getStudentLedger);
router.get('/', fee_controller_1.getStudentFees);
router.get('/:student_id', fee_controller_1.getStudentFees);
// Mock payment simulation
router.post('/create-order', (0, rbac_middleware_1.authorize)(['parent', 'super_admin', 'school_admin']), fee_controller_1.createRazorpayOrder);
router.post('/verify-payment', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher', 'parent']), fee_controller_1.verifyPayment);
// Receipt
router.get('/next-receipt-number', fee_controller_1.getNextReceiptNumberHandler);
router.get('/receipt/:payment_id', fee_controller_1.getReceipt);
exports.default = router;
