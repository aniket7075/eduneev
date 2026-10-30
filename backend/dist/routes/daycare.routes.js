"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const daycare_controller_1 = require("../controllers/daycare.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Students
router.get('/students', daycare_controller_1.getDaycareStudents);
// Dashboard / Analytics
router.get('/ratio', daycare_controller_1.getDaycareRatio);
router.get('/report/:studentId', daycare_controller_1.getMonthlyReport);
// Logs
router.get('/logs', daycare_controller_1.getDaycareLogs);
router.get('/logs/:id', daycare_controller_1.getDaycareLogById);
router.post('/logs', daycare_controller_1.createDaycareLog);
router.post('/logs/bulk', daycare_controller_1.bulkCreateDaycareLogs);
router.put('/logs/:id', daycare_controller_1.updateDaycareLog);
router.delete('/logs/:id', daycare_controller_1.deleteDaycareLog);
// Schedules
router.get('/schedules', daycare_controller_1.getDaycareSchedules);
router.post('/schedules', daycare_controller_1.createDaycareSchedule);
router.delete('/schedules/:id', daycare_controller_1.deleteDaycareSchedule);
exports.default = router;
