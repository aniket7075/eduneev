import { Router } from 'express';
import {
  getAllEnquiries,
  getEnquiryById,
  createEnquiry,
  updateEnquiry,
  deleteEnquiry,
  addFollowUp,
  convertToAdmission,
  getEnquiryStats,
  submitPublicEnquiry,
  getConversionAnalytics,
  getFollowUpReminders,
} from '../controllers/enquiry.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Public Routes (No authentication required)
router.post('/public', submitPublicEnquiry);

// All routes require authentication
router.use(authenticate);

// Stats & Analytics
router.get('/stats', getEnquiryStats);
router.get('/conversion-analytics', getConversionAnalytics);
router.get('/reminders', getFollowUpReminders);

// CRUD
router.get('/',      getAllEnquiries);
router.get('/:id',   getEnquiryById);
router.post('/',     createEnquiry);
router.put('/:id',   updateEnquiry);
router.delete('/:id', deleteEnquiry);

// Follow-ups
router.post('/:id/follow-up', addFollowUp);

// Convert to admission
router.post('/:id/convert', convertToAdmission);

export default router;
