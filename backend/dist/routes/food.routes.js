"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const food_controller_1 = require("../controllers/food.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Get menus (Accessible by all roles)
router.get('/', food_controller_1.getFoodMenus);
// Create a Menu (Admin)
router.post('/', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin']), food_controller_1.createFoodMenu);
// Delete a Menu (Admin)
router.delete('/:id', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin']), food_controller_1.deleteFoodMenu);
exports.default = router;
