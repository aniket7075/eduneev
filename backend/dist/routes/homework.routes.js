"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const homework_controller_1 = require("../controllers/homework.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Teachers and Admins can create homework with files
router.post('/', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher']), upload_middleware_1.uploadMiddleware.array('files', 5), homework_controller_1.createHomework);
// Teachers and Admins can update homework
router.put('/:id', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher']), upload_middleware_1.uploadMiddleware.array('files', 5), homework_controller_1.updateHomework);
// Teachers and Admins can delete homework
router.delete('/:id', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher']), homework_controller_1.deleteHomework);
// Anyone can view homework for their section
router.get('/', homework_controller_1.getSectionHomework);
router.get('/:grade', homework_controller_1.getSectionHomework);
exports.default = router;
