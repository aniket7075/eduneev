"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const event_controller_1 = require("../controllers/event.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Get all events (Accessible by all roles)
router.get('/', event_controller_1.getEvents);
// Create an event (Super Admin & School Admin only)
router.post('/', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin']), event_controller_1.createEvent);
// Delete an event (Admin)
router.delete('/:id', (0, rbac_middleware_1.authorize)(['super_admin', 'school_admin']), event_controller_1.deleteEvent);
exports.default = router;
