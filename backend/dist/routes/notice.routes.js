"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notice_controller_1 = require("../controllers/notice.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Anyone authenticated can view notices
router.get('/', notice_controller_1.getNotices);
// Teachers and Admins can create notices
router.post('/', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher']), notice_controller_1.createNotice);
// Teachers and Admins can update notices
router.put('/:id', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher']), notice_controller_1.updateNotice);
// Teachers and Admins can delete notices
router.delete('/:id', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher']), notice_controller_1.deleteNotice);
exports.default = router;
