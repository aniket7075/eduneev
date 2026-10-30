require('dotenv').config();
const { pool } = require('./dist/config/database');
const { sendNotification, sendMulticastNotification } = require('./dist/config/firebase');

async function run() {
  const arg = process.argv[2];

  try {
    if (arg && arg.length > 50 && !arg.includes('@')) {
      // Direct FCM Token passed
      console.log(`\n🚀 Sending test push notification directly to FCM token: ${arg.slice(0, 15)}...`);
      const res = await sendNotification(
        arg,
        '🎉 Edunive Test Push Notification',
        'Hello! Push notifications are working successfully on your device!',
        { type: 'test', timestamp: new Date().toISOString() }
      );
      console.log('Result:', res);
      return;
    }

    if (arg && arg.includes('@')) {
      // Email passed
      console.log(`\n🔍 Looking up user with email: ${arg}`);
      const userRes = await pool.query('SELECT id, email, fcm_token FROM users WHERE LOWER(email) = LOWER($1)', [arg]);
      if (userRes.rows.length === 0) {
        console.error(`User with email "${arg}" not found in database.`);
        return;
      }
      const token = userRes.rows[0].fcm_token;
      if (!token) {
        console.error(`User "${arg}" exists, but has no registered FCM device token yet.`);
        console.log('👉 Please open and log into the Edunive mobile app to register the device token.');
        return;
      }
      console.log(`🚀 Sending test push to ${arg} (Token: ${token.slice(0, 15)}...)`);
      const res = await sendNotification(
        token,
        '🎉 Edunive Test Push Notification',
        `Hello ${arg}! Push notifications are working on your mobile phone!`,
        { type: 'test', timestamp: new Date().toISOString() }
      );
      console.log('Result:', res);
      return;
    }

    // No argument passed: check all users with fcm_token
    console.log('\n🔍 Checking all users with registered FCM tokens...');
    const usersWithToken = await pool.query(
      'SELECT id, email, role, fcm_token, updated_at FROM users WHERE fcm_token IS NOT NULL AND is_active = true'
    );

    if (usersWithToken.rows.length === 0) {
      console.log('\n⚠️ No registered FCM device tokens found in the database yet.');
      console.log('------------------------------------------------------------');
      console.log('To register your mobile device token:');
      console.log('1. Open the Edunive app on your phone.');
      console.log('2. Log in with your parent, teacher, or admin account.');
      console.log('3. The app will automatically request notification permission and register its FCM token.');
      console.log('------------------------------------------------------------');
      console.log('You can also send directly by token: node send_test_push.js <your_fcm_token>');
      return;
    }

    console.log(`Found ${usersWithToken.rows.length} device(s) with FCM token:`);
    console.table(usersWithToken.rows.map(u => ({ email: u.email, role: u.role, token: `${u.fcm_token.slice(0, 15)}...` })));

    const tokens = usersWithToken.rows.map(u => u.fcm_token).filter(Boolean);
    console.log(`🚀 Sending test push notification to all ${tokens.length} device(s)...`);

    const result = await sendMulticastNotification(
      tokens,
      '🎉 Edunive Test Push Notification',
      'Hello! Real-time push notifications are live and working across Edunive!',
      { type: 'test', timestamp: new Date().toISOString() }
    );
    console.log('Result:', result);
  } catch (err) {
    console.error('Error running test push:', err);
  } finally {
    await pool.end();
  }
}

run();
