import { Router } from 'express';
import {
  getDaycareLogs, getDaycareLogById, createDaycareLog,
  updateDaycareLog, deleteDaycareLog, bulkCreateDaycareLogs,
  getDaycareSchedules, createDaycareSchedule, deleteDaycareSchedule,
  getDaycareRatio, getMonthlyReport, getDaycareStudents
} from '../controllers/daycare.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

// Students
router.get('/students', getDaycareStudents);

// Dashboard / Analytics
router.get('/ratio',            getDaycareRatio);
router.get('/report/:studentId', getMonthlyReport);

// Logs
router.get('/logs',          getDaycareLogs);
router.get('/logs/:id',      getDaycareLogById);
router.post('/logs',         createDaycareLog);
router.post('/logs/bulk',    bulkCreateDaycareLogs);
router.put('/logs/:id',      updateDaycareLog);
router.delete('/logs/:id',   deleteDaycareLog);

// Schedules
router.get('/schedules',        getDaycareSchedules);
router.post('/schedules',       createDaycareSchedule);
router.delete('/schedules/:id', deleteDaycareSchedule);

export default router;
