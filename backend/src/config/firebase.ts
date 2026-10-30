import fs from 'fs';
import path from 'path';
import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

let app: App | null = null;
let messagingInstance: Messaging | null = null;

try {
  // 1. Look for service account JSON file
  const candidatePaths = [
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH) : null,
    path.resolve(process.cwd(), 'eduneev-1f5f3-firebase-adminsdk-fbsvc-fa309deb6f.json'),
    path.resolve(__dirname, '../../eduneev-1f5f3-firebase-adminsdk-fbsvc-fa309deb6f.json'),
    path.resolve(__dirname, '../eduneev-1f5f3-firebase-adminsdk-fbsvc-fa309deb6f.json'),
  ].filter(Boolean) as string[];

  let serviceAccount: any = null;
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        serviceAccount = JSON.parse(fs.readFileSync(p, 'utf8'));
        console.log(`📄 Loaded Firebase service account from: ${p}`);
        break;
      } catch (e) {
        console.warn(`Failed reading candidate service account at ${p}`, e);
      }
    }
  }

  // 2. Fallback to environment variables if JSON file wasn't found
  if (!serviceAccount) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (privateKey && privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID || 'eduneev-1f5f3',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@eduneev-1f5f3.iam.gserviceaccount.com',
        privateKey: privateKey,
      };
    }
  }

  if (serviceAccount) {
    app = getApps().length === 0 ? initializeApp({ credential: cert(serviceAccount) }) : getApps()[0];
    messagingInstance = getMessaging(app);
    console.log(`✅ Firebase Admin Initialized for project: ${serviceAccount.project_id || app.name}`);
  } else {
    console.warn('⚠️ Firebase Admin skipped: Missing service account JSON and FIREBASE_PRIVATE_KEY');
  }
} catch (error) {
  console.error('❌ Firebase initialization error', error);
}

export const messaging = messagingInstance;

export const sendNotification = async (fcmToken: string, title: string, body: string, data?: any) => {
  if (!fcmToken || !messagingInstance) return;

  const stringData: Record<string, string> = {};
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
    const response = await messagingInstance.send(message);
    console.log(`Notification sent successfully to ${fcmToken.slice(0, 10)}...: ${response}`);
    return response;
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export const sendMulticastNotification = async (fcmTokens: string[], title: string, body: string, data?: any) => {
  if (!fcmTokens || fcmTokens.length === 0 || !messagingInstance) return;

  const validTokens = Array.from(new Set(fcmTokens.filter(Boolean)));
  if (validTokens.length === 0) return;

  const stringData: Record<string, string> = {};
  if (data) {
    for (const [k, v] of Object.entries(data)) {
      stringData[k] = typeof v === 'string' ? v : JSON.stringify(v);
    }
  }

  try {
    const response = await messagingInstance.sendEachForMulticast({
      tokens: validTokens,
      notification: { title, body },
      data: stringData,
    });
    console.log(`Multicast sent: ${response.successCount} succeeded, ${response.failureCount} failed`);
    return response;
  } catch (error) {
    console.error('Error sending multicast notification:', error);
  }
};
