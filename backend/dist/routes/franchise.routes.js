"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const franchise_controller_1 = require("../controllers/franchise.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Stats overview
router.get('/stats', franchise_controller_1.getFranchiseStats);
// Branches (schools)
router.get('/branches', franchise_controller_1.getAllBranches);
router.get('/branches/:id', franchise_controller_1.getBranchById);
router.post('/branches', (0, rbac_middleware_1.authorize)(['super_admin']), franchise_controller_1.createBranch);
router.put('/branches/:id', (0, rbac_middleware_1.authorize)(['super_admin']), franchise_controller_1.updateBranch);
router.put('/branches/:id/geofence', franchise_controller_1.updateBranchGeofence);
router.delete('/branches/:id', (0, rbac_middleware_1.authorize)(['super_admin']), franchise_controller_1.deleteBranch);
// Royalty & Revenue History
router.get('/royalty', franchise_controller_1.getRoyaltyRecords);
router.get('/revenue-history', franchise_controller_1.getFranchiseRevenueHistory);
router.post('/royalty', franchise_controller_1.createRoyaltyRecord);
router.put('/royalty/:id/pay', (0, rbac_middleware_1.authorize)(['super_admin']), franchise_controller_1.markRoyaltyPaid);
// Supplies & Dispatches & Head Office & Branch Inventory
router.get('/inventory', franchise_controller_1.getInventoryStock);
router.get('/branch-inventory', franchise_controller_1.getBranchInventory);
router.get('/supplies', franchise_controller_1.getSupplyRequests);
router.post('/supplies', franchise_controller_1.createSupplyRequest);
router.put('/supplies/:id/status', franchise_controller_1.updateSupplyStatus);
router.put('/supplies/:id', franchise_controller_1.updateSupplyStatus);
// Global Push
router.post('/global-push', (0, rbac_middleware_1.authorize)(['super_admin']), franchise_controller_1.globalPush);
exports.default = router;
