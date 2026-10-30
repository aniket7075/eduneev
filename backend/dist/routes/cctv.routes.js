"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cctv_controller_1 = require("../controllers/cctv.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Get cameras (Accessible by admin and teachers)
router.get('/', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'teacher']), cctv_controller_1.getCameras);
// Add camera (Admin only)
router.post('/', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin']), cctv_controller_1.addCamera);
// Update camera (Admin only)
router.put('/:id', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin']), cctv_controller_1.updateCamera);
// Delete camera (Admin only)
router.delete('/:id', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin']), cctv_controller_1.deleteCamera);
exports.default = router;
