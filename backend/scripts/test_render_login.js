const https = require('https');

function testRenderLogin(email, password) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ email, password });
    const req = https.request({
      hostname: 'pre-n3cv.onrender.com',
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: data }));
    });

    req.on('error', err => resolve({ error: err.message }));
    req.setTimeout(15000, () => { req.destroy(); resolve({ error: 'Timeout after 15s' }); });
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('Testing Render Login for admin@prescole.com ...');
  console.log(await testRenderLogin('admin@prescole.com', 'Admin@123'));

  console.log('Testing Render Login for dhanshree@gmail.com ...');
  console.log(await testRenderLogin('dhanshree@gmail.com', 'Password@123'));
}

run();
