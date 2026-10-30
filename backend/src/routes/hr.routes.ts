import { Router } from 'express';
import {
  getAllStaff, getStaffById, upsertStaffProfile, getNextEmployeeId, autoAssignAllEmployeeIds,
  getStaffAttendance, markStaffAttendance,
  getStaffLeaves, createStaffLeave, updateLeaveStatus, deleteStaffLeave,
  getPayroll, generatePayroll, markPayrollPaid, deletePayroll,
} from '../controllers/hr.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

// Staff profiles & Employee IDs
router.get('/staff/next-employee-id', getNextEmployeeId);
router.post('/staff/auto-assign-ids', autoAssignAllEmployeeIds);
router.get('/staff',         getAllStaff);
router.get('/staff/:id',     getStaffById);
router.post('/staff/profile', upsertStaffProfile);

// Staff attendance
router.get('/attendance',        getStaffAttendance);
router.post('/attendance/mark',  markStaffAttendance);

// Staff leaves
router.get('/leaves',              getStaffLeaves);
router.post('/leaves',             createStaffLeave);
router.put('/leaves/:id/status',   updateLeaveStatus);
router.delete('/leaves/:id',       deleteStaffLeave);

// Payroll
router.get('/payroll',              getPayroll);
router.post('/payroll/generate',    generatePayroll);
router.put('/payroll/:id/pay',      markPayrollPaid);
router.delete('/payroll/:id',       deletePayroll);

export default router;
