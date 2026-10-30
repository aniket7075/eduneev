"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const activity_controller_1 = require("../controllers/activity.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Get activities for a specific student (Accessible by admin, teacher, parent)
router.get('/:student_id', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher', 'parent']), activity_controller_1.getDailyActivities);
// Log daily activity for a student (Accessible by admin, teacher)
router.post('/:student_id', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher']), activity_controller_1.logDailyActivity);
exports.default = router;
