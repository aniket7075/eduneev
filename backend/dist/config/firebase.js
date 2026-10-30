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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMulticastNotification = exports.sendNotification = exports.messaging = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const app_1 = require("firebase-admin/app");
const messaging_1 = require("firebase-admin/messaging");
let app = null;
let messagingInstance = null;
try {
    // 1. Look for service account JSON file
    const candidatePaths = [
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH ? path_1.default.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH) : null,
        path_1.default.resolve(process.cwd(), 'eduneev-1f5f3-firebase-adminsdk-fbsvc-fa309deb6f.json'),
        path_1.default.resolve(__dirname, '../../eduneev-1f5f3-firebase-adminsdk-fbsvc-fa309deb6f.json'),
        path_1.default.resolve(__dirname, '../eduneev-1f5f3-firebase-adminsdk-fbsvc-fa309deb6f.json'),
    ].filter(Boolean);
    let serviceAccount = null;
    for (const p of candidatePaths) {
        if (fs_1.default.existsSync(p)) {
            try {
                serviceAccount = JSON.parse(fs_1.default.readFileSync(p, 'utf8'));
                console.log(`📄 Loaded Firebase service account from: ${p}`);
                break;
            }
            catch (e) {
                console.warn(`Failed reading candidate service account at ${p}`, e);
            }
        }
    }
    // 2. Fallback to environment variables if JSON file wasn't found
    if (!serviceAccount) {
        const privateKey = (_a = process.env.FIREBASE_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, '\n');
        if (privateKey && privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
            serviceAccount = {
                projectId: process.env.FIREBASE_PROJECT_ID || 'eduneev-1f5f3',
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@eduneev-1f5f3.iam.gserviceaccount.com',
                privateKey: privateKey,
            };
        }
    }
    if (serviceAccount) {
        app = (0, app_1.getApps)().length === 0 ? (0, app_1.initializeApp)({ credential: (0, app_1.cert)(serviceAccount) }) : (0, app_1.getApps)()[0];
        messagingInstance = (0, messaging_1.getMessaging)(app);
        console.log(`✅ Firebase Admin Initialized for project: ${serviceAccount.project_id || app.name}`);
    }
    else {
        console.warn('⚠️ Firebase Admin skipped: Missing service account JSON and FIREBASE_PRIVATE_KEY');
    }
}
catch (error) {
    console.error('❌ Firebase initialization error', error);
}
exports.messaging = messagingInstance;
const sendNotification = (fcmToken, title, body, data) => __awaiter(void 0, void 0, void 0, function* () {
    if (!fcmToken || !messagingInstance)
        return;
    const stringData = {};
    if (data) {
        for (const [k, v] of Object.entries(data)) {
            stringData[k] = typeof v === 'string' ? v : JSON.stringify(v);
        }
    }
    const message = {
        notification: { title, body },
        data: stringData,
        token: fcmToken,
    };
    try {
        const response = yield messagingInstance.send(message);
        console.log(`Notification sent successfully to ${fcmToken.slice(0, 10)}...: ${response}`);
        return response;
    }
    catch (error) {
        console.error('Error sending notification:', error);
    }
});
exports.sendNotification = sendNotification;
const sendMulticastNotification = (fcmTokens, title, body, data) => __awaiter(void 0, void 0, void 0, function* () {
    if (!fcmTokens || fcmTokens.length === 0 || !messagingInstance)
        return;
    const validTokens = Array.from(new Set(fcmTokens.filter(Boolean)));
    if (validTokens.length === 0)
        return;
    const stringData = {};
    if (data) {
        for (const [k, v] of Object.entries(data)) {
            stringData[k] = typeof v === 'string' ? v : JSON.stringify(v);
        }
    }
    try {
        const response = yield messagingInstance.sendEachForMulticast({
            tokens: validTokens,
            notification: { title, body },
            data: stringData,
        });
        console.log(`Multicast sent: ${response.successCount} succeeded, ${response.failureCount} failed`);
        return response;
    }
    catch (error) {
        console.error('Error sending multicast notification:', error);
    }
});
exports.sendMulticastNotification = sendMulticastNotification;
