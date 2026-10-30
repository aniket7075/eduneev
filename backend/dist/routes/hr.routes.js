"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const hr_controller_1 = require("../controllers/hr.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Staff profiles & Employee IDs
router.get('/staff/next-employee-id', hr_controller_1.getNextEmployeeId);
router.post('/staff/auto-assign-ids', hr_controller_1.autoAssignAllEmployeeIds);
router.get('/staff', hr_controller_1.getAllStaff);
router.get('/staff/:id', hr_controller_1.getStaffById);
router.post('/staff/profile', hr_controller_1.upsertStaffProfile);
// Staff attendance
router.get('/attendance', hr_controller_1.getStaffAttendance);
router.post('/attendance/mark', hr_controller_1.markStaffAttendance);
// Staff leaves
router.get('/leaves', hr_controller_1.getStaffLeaves);
router.post('/leaves', hr_controller_1.createStaffLeave);
router.put('/leaves/:id/status', hr_controller_1.updateLeaveStatus);
router.delete('/leaves/:id', hr_controller_1.deleteStaffLeave);
// Payroll
router.get('/payroll', hr_controller_1.getPayroll);
router.post('/payroll/generate', hr_controller_1.generatePayroll);
router.put('/payroll/:id/pay', hr_controller_1.markPayrollPaid);
router.delete('/payroll/:id', hr_controller_1.deletePayroll);
exports.default = router;
