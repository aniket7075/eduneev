"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const result_controller_1 = require("../controllers/result.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Teacher and Admins
router.post('/exam', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher']), result_controller_1.createExam);
router.post('/', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher']), result_controller_1.addResults);
// Parents, Teachers, Admins
router.get('/student/:studentId', result_controller_1.getStudentResults);
exports.default = router;
