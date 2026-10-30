"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./config/database");
// Routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const attendance_routes_1 = __importDefault(require("./routes/attendance.routes"));
const fee_routes_1 = __importDefault(require("./routes/fee.routes"));
const transport_routes_1 = __importDefault(require("./routes/transport.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const result_routes_1 = __importDefault(require("./routes/result.routes"));
const progress_routes_1 = __importDefault(require("./routes/progress.routes"));
const homework_routes_1 = __importDefault(require("./routes/homework.routes"));
const notice_routes_1 = __importDefault(require("./routes/notice.routes"));
const leave_routes_1 = __importDefault(require("./routes/leave.routes"));
const timetable_routes_1 = __importDefault(require("./routes/timetable.routes"));
const gallery_routes_1 = __importDefault(require("./routes/gallery.routes"));
const exam_routes_1 = __importDefault(require("./routes/exam.routes"));
const lesson_plan_routes_1 = __importDefault(require("./routes/lesson_plan.routes"));
const library_routes_1 = __importDefault(require("./routes/library.routes"));
const certificate_routes_1 = __importDefault(require("./routes/certificate.routes"));
const classes_routes_1 = __importDefault(require("./routes/classes.routes"));
// ── New Module Routes ──────────────────────────────────────────────────────────
const enquiry_routes_1 = __importDefault(require("./routes/enquiry.routes"));
const daycare_routes_1 = __importDefault(require("./routes/daycare.routes"));
const expenses_routes_1 = __importDefault(require("./routes/expenses.routes"));
const inventory_routes_1 = __importDefault(require("./routes/inventory.routes"));
const franchise_routes_1 = __importDefault(require("./routes/franchise.routes"));
const hr_routes_1 = __importDefault(require("./routes/hr.routes"));
const cctv_routes_1 = __importDefault(require("./routes/cctv.routes"));
const feeStructure_routes_1 = __importDefault(require("./routes/feeStructure.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// ─── Security & Utilities ──────────────────────────────────────────────────────
// CORS – allow configured origins or reflect request origin safely
const rawCorsOrigin = process.env.CORS_ORIGIN;
const configuredOrigins = rawCorsOrigin ? rawCorsOrigin.split(',').map((o) => o.trim()) : ['*'];
app.use((0, cors_1.default)({
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
app.options(/(.*)/, (0, cors_1.default)());
// Body parsers
app.use(express_1.default.json({ limit: '100mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '100mb' }));
// Global Request Logger
app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.originalUrl}`);
    next();
});
// Static uploads
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health-check', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let dbStatus = 'disconnected';
    let dbError = null;
    try {
        yield database_1.pool.query('SELECT 1');
        dbStatus = 'connected';
    }
    catch (err) {
        dbStatus = 'error';
        dbError = (err === null || err === void 0 ? void 0 : err.message) || String(err);
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
}));
// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/attendance', attendance_routes_1.default);
app.use('/api/fees', fee_routes_1.default);
app.use('/api/fee-structures', feeStructure_routes_1.default);
app.use('/api/fees/structures', feeStructure_routes_1.default);
app.use('/api/transport', transport_routes_1.default);
app.use('/api/chat', chat_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/results', result_routes_1.default);
app.use('/api/progress', progress_routes_1.default);
app.use('/api/homework', homework_routes_1.default);
app.use('/api/notices', notice_routes_1.default);
app.use('/api/leaves', leave_routes_1.default);
app.use('/api/timetable', timetable_routes_1.default);
app.use('/api/gallery', gallery_routes_1.default);
app.use('/api/exams', exam_routes_1.default);
app.use('/api/lesson-plans', lesson_plan_routes_1.default);
app.use('/api/library', library_routes_1.default);
app.use('/api/certificates', certificate_routes_1.default);
app.use('/api/classes', classes_routes_1.default);
const notes_routes_1 = __importDefault(require("./routes/notes.routes"));
// ── New Modules ────────────────────────────────────────────────────────────────
const health_routes_1 = __importDefault(require("./routes/health.routes"));
const activity_routes_1 = __importDefault(require("./routes/activity.routes"));
const event_routes_1 = __importDefault(require("./routes/event.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const ptm_routes_1 = __importDefault(require("./routes/ptm.routes"));
const food_routes_1 = __importDefault(require("./routes/food.routes"));
app.use('/api/enquiries', enquiry_routes_1.default);
app.use('/api/daycare', daycare_routes_1.default);
app.use('/api/expenses', expenses_routes_1.default);
app.use('/api/inventory', inventory_routes_1.default);
app.use('/api/franchise', franchise_routes_1.default);
app.use('/api/hr', hr_routes_1.default);
app.use('/api/cctv', cctv_routes_1.default);
app.use('/api/notes', notes_routes_1.default);
app.use('/api/health', health_routes_1.default);
app.use('/api/activity', activity_routes_1.default);
app.use('/api/events', event_routes_1.default);
app.use('/api/payments', payment_routes_1.default);
app.use('/api/ptm', ptm_routes_1.default);
app.use('/api/food', food_routes_1.default);
const story_routes_1 = __importDefault(require("./routes/story.routes"));
app.use('/api/stories', story_routes_1.default);
// ─── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
    console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: 'Route not found' });
});
// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err.stack);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
    });
});
exports.default = app;
