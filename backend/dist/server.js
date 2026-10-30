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
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const feeReminder_service_1 = require("./services/feeReminder.service");
const https_1 = __importDefault(require("https"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Verify DB Connection
        yield database_1.pool.query('SELECT 1');
        console.log('✅ Database connected successfully');
        // Register automated fee reminder scheduler (checks daily for 15 days, 2 days, 2 days overdue, 1 month overdue)
        (0, feeReminder_service_1.startFeeReminderScheduler)();
        const PORT = process.env.PORT || 5000;
        // Check if certificates exist in the root of the backend folder
        const keyPath = path_1.default.join(process.cwd(), 'key.pem');
        const certPath = path_1.default.join(process.cwd(), 'cert.pem');
        if (fs_1.default.existsSync(keyPath) && fs_1.default.existsSync(certPath)) {
            const sslOptions = {
                key: fs_1.default.readFileSync(keyPath),
                cert: fs_1.default.readFileSync(certPath),
            };
            https_1.default.createServer(sslOptions, app_1.default).listen(PORT, '0.0.0.0', () => {
                console.log(`🚀 HTTPS Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
            });
        }
        else {
            app_1.default.listen(PORT, '0.0.0.0', () => {
                console.log(`🚀 HTTP Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
            });
        }
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
});
startServer();
