"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Get payments (Admin)
router.get('/', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin']), payment_controller_1.getPayments);
// Create Payment (Parent/Admin)
router.post('/', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin', 'parent']), payment_controller_1.createPayment);
exports.default = router;
