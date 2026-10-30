import 'dotenv/config';
import app from './app';
import { pool } from './config/database';
import { startFeeReminderScheduler } from './services/feeReminder.service';

import https from 'https';
import fs from 'fs';
import path from 'path';

const startServer = async () => {
  try {
    // Verify DB Connection
    await pool.query('SELECT 1');
    console.log('✅ Database connected successfully');

    // Register automated fee reminder scheduler (checks daily for 15 days, 2 days, 2 days overdue, 1 month overdue)
    startFeeReminderScheduler();

    const PORT = process.env.PORT || 5000;
    
    // Check if certificates exist in the root of the backend folder
    const keyPath = path.join(process.cwd(), 'key.pem');
    const certPath = path.join(process.cwd(), 'cert.pem');

    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      const sslOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
      https.createServer(sslOptions, app).listen(PORT as number, '0.0.0.0', () => {
        console.log(`🚀 HTTPS Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      });
    } else {
      app.listen(PORT as number, '0.0.0.0', () => {
        console.log(`🚀 HTTP Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      });
    }
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
