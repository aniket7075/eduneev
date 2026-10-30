import { Router } from 'express';
import {
  getAllBranches, getBranchById, createBranch, updateBranch, deleteBranch,
  getRoyaltyRecords, createRoyaltyRecord, markRoyaltyPaid, getFranchiseStats,
  globalPush, getSupplyRequests, createSupplyRequest, updateSupplyStatus, getInventoryStock, getBranchInventory,
  getFranchiseRevenueHistory, updateBranchGeofence
} from '../controllers/franchise.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';

const router = Router();
router.use(authenticate);

// Stats overview
router.get('/stats', getFranchiseStats);

// Branches (schools)
router.get('/branches',          getAllBranches);
router.get('/branches/:id',      getBranchById);
router.post('/branches',         authorize(['super_admin']), createBranch);
router.put('/branches/:id',      authorize(['super_admin']), updateBranch);
router.put('/branches/:id/geofence', updateBranchGeofence);
router.delete('/branches/:id',   authorize(['super_admin']), deleteBranch);

// Royalty & Revenue History
router.get('/royalty',           getRoyaltyRecords);
router.get('/revenue-history',   getFranchiseRevenueHistory);
router.post('/royalty',          createRoyaltyRecord);
router.put('/royalty/:id/pay',   authorize(['super_admin']), markRoyaltyPaid);

// Supplies & Dispatches & Head Office & Branch Inventory
router.get('/inventory',         getInventoryStock);
router.get('/branch-inventory',  getBranchInventory);
router.get('/supplies',          getSupplyRequests);
router.post('/supplies',         createSupplyRequest);
router.put('/supplies/:id/status', updateSupplyStatus);
router.put('/supplies/:id', updateSupplyStatus);

// Global Push
router.post('/global-push',      authorize(['super_admin']), globalPush);

export default router;
