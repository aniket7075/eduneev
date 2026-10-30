"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ptm_controller_1 = require("../controllers/ptm.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Get schedules (Accessible by all roles)
router.get('/', ptm_controller_1.getPtmSchedules);
// Create a PTM Schedule (Admin, Teacher)
router.post('/schedules', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher']), ptm_controller_1.createPtmSchedule);
// Book a slot (Parent)
router.post('/book', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'parent']), ptm_controller_1.bookPtmSlot);
exports.default = router;
