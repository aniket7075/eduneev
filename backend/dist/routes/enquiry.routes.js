"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const enquiry_controller_1 = require("../controllers/enquiry.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Public Routes (No authentication required)
router.post('/public', enquiry_controller_1.submitPublicEnquiry);
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// Stats & Analytics
router.get('/stats', enquiry_controller_1.getEnquiryStats);
router.get('/conversion-analytics', enquiry_controller_1.getConversionAnalytics);
router.get('/reminders', enquiry_controller_1.getFollowUpReminders);
// CRUD
router.get('/', enquiry_controller_1.getAllEnquiries);
router.get('/:id', enquiry_controller_1.getEnquiryById);
router.post('/', enquiry_controller_1.createEnquiry);
router.put('/:id', enquiry_controller_1.updateEnquiry);
router.delete('/:id', enquiry_controller_1.deleteEnquiry);
// Follow-ups
router.post('/:id/follow-up', enquiry_controller_1.addFollowUp);
// Convert to admission
router.post('/:id/convert', enquiry_controller_1.convertToAdmission);
exports.default = router;
