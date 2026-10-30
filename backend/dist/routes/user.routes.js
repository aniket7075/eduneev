"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Protect all user routes
router.use(auth_middleware_1.authenticate);
router.get('/me', user_controller_1.getProfile);
router.put('/me', user_controller_1.updateProfile);
router.post('/fcm-token', user_controller_1.updateFcmToken);
router.post('/test-push', user_controller_1.sendTestPushNotification);
router.get('/children', user_controller_1.getMyChildren);
router.get('/child/:id', user_controller_1.getChildDetails);
exports.default = router;
