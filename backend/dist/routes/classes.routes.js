"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const classes_controller_1 = require("../controllers/classes.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Everyone authenticated can GET classes
router.get('/', classes_controller_1.getClasses);
// Only admins can modify classes
router.post('/', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin']), classes_controller_1.createClass);
router.put('/:id', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin']), classes_controller_1.updateClass);
router.delete('/:id', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin']), classes_controller_1.deleteClass);
exports.default = router;
