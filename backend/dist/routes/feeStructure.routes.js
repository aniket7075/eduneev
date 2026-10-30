"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const feeStructure_controller_1 = require("../controllers/feeStructure.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Public/All authenticated staff can view fee structures
router.get('/', feeStructure_controller_1.getFranchiseFeeStructures);
// Super admin and franchise school admins can update fee structures
router.post('/save', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin']), feeStructure_controller_1.saveFranchiseFeeStructure);
router.put('/save', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin']), feeStructure_controller_1.saveFranchiseFeeStructure);
// Reset franchise back to default master template
router.post('/reset', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin']), feeStructure_controller_1.resetFranchiseFeeStructure);
// Assign/Sync this fee structure to enrolled students
router.post('/apply-to-students', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin']), feeStructure_controller_1.applyStructureToStudents);
exports.default = router;
