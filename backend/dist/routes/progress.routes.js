"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const progress_controller_1 = require("../controllers/progress.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Read progress
router.get('/my', progress_controller_1.getStudentProgress);
router.get('/my-progress', progress_controller_1.getStudentProgress);
router.get('/', progress_controller_1.getStudentProgress);
router.get('/:studentId', progress_controller_1.getStudentProgress);
// Admin & Teacher Real-Time Management
router.post('/:studentId/milestone', progress_controller_1.saveStudentMilestone);
router.put('/:studentId/milestones', progress_controller_1.bulkSaveMilestones);
router.post('/:studentId/note', progress_controller_1.saveStudentNote);
router.post('/:studentId/exam-result', progress_controller_1.saveStudentExamResult);
exports.default = router;
