"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inventory_controller_1 = require("../controllers/inventory.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Items
router.get('/items', inventory_controller_1.getAllItems);
router.get('/items/:id', inventory_controller_1.getItemById);
router.post('/items', inventory_controller_1.createItem);
router.put('/items/:id', inventory_controller_1.updateItem);
router.delete('/items/:id', inventory_controller_1.deleteItem);
router.post('/items/:id/adjust', inventory_controller_1.adjustStock);
// Orders
router.get('/orders', inventory_controller_1.getAllOrders);
router.post('/orders', inventory_controller_1.createOrder);
router.put('/orders/:id/status', inventory_controller_1.updateOrderStatus);
router.delete('/orders/:id', inventory_controller_1.deleteOrder);
exports.default = router;
