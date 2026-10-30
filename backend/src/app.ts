import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { pool } from './config/database';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import attendanceRoutes from './routes/attendance.routes';
import feeRoutes from './routes/fee.routes';
import transportRoutes from './routes/transport.routes';
import chatRoutes from './routes/chat.routes';
import adminRoutes from './routes/admin.routes';
import resultRoutes from './routes/result.routes';
import progressRoutes from './routes/progress.routes';
import homeworkRoutes from './routes/homework.routes';
import noticeRoutes from './routes/notice.routes';
import leaveRoutes from './routes/leave.routes';
import timetableRoutes from './routes/timetable.routes';
import galleryRoutes from './routes/gallery.routes';
import examRoutes from './routes/exam.routes';
import lessonPlanRoutes from './routes/lesson_plan.routes';
import libraryRoutes from './routes/library.routes';
import certificateRoutes from './routes/certificate.routes';
import classesRoutes from './routes/classes.routes';

// ── New Module Routes ──────────────────────────────────────────────────────────
import enquiryRoutes from './routes/enquiry.routes';
import daycareRoutes from './routes/daycare.routes';
import expensesRoutes from './routes/expenses.routes';
import inventoryRoutes from './routes/inventory.routes';
import franchiseRoutes from './routes/franchise.routes';
import hrRoutes from './routes/hr.routes';
import cctvRoutes from './routes/cctv.routes';
import feeStructureRoutes from './routes/feeStructure.routes';

dotenv.config();

const app = express();

// ─── Security & Utilities ──────────────────────────────────────────────────────
// CORS – allow configured origins or reflect request origin safely
const rawCorsOrigin = process.env.CORS_ORIGIN;
const configuredOrigins = rawCorsOrigin ? rawCorsOrigin.split(',').map((o) => o.trim()) : ['*'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || configuredOrigins.includes('*') || configuredOrigins.includes(origin)) {
      return callback(null, true);
    }
    if (origin.endsWith('.vercel.app') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 204,
}));

// Preflight handler
app.options(/(.*)/, cors());

// Body parsers
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Global Request Logger
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

// Static uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health-check', async (_req, res) => {
  let dbStatus = 'disconnected';
  let dbError = null;
  try {
    await pool.query('SELECT 1');
    dbStatus = 'connected';
  } catch (err: any) {
    dbStatus = 'error';
    dbError = err?.message || String(err);
  }

  res.status(200).json({ 
    status: 'success', 
    message: 'Pre-School API is running',
    version: '2.0.0',
    database: dbStatus,
    dbError: dbError,
    hasDbUrl: Boolean(process.env.DATABASE_URL),
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/fee-structures', feeStructureRoutes);
app.use('/api/fees/structures', feeStructureRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/lesson-plans', lessonPlanRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/classes', classesRoutes);

import notesRoutes from './routes/notes.routes';

// ── New Modules ────────────────────────────────────────────────────────────────

import healthRoutes from './routes/health.routes';
import activityRoutes from './routes/activity.routes';
import eventRoutes from './routes/event.routes';
import paymentRoutes from './routes/payment.routes';
import ptmRoutes from './routes/ptm.routes';
import foodRoutes from './routes/food.routes';

app.use('/api/enquiries', enquiryRoutes);
app.use('/api/daycare', daycareRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/franchise', franchiseRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/cctv', cctvRoutes);
app.use('/api/notes', notesRoutes);

app.use('/api/health', healthRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ptm', ptmRoutes);
app.use('/api/food', foodRoutes);

import storyRoutes from './routes/story.routes';
app.use('/api/stories', storyRoutes);

// ─── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.stack);
  res.status(err.status || 500).json({ 
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message 
  });
});

export default app;
