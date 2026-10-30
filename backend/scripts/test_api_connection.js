const http = require('http');
const https = require('https');

function testUrl(urlStr) {
  return new Promise((resolve) => {
    const client = urlStr.startsWith('https') ? https : http;
    const req = client.get(urlStr, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: data.slice(0, 200) }));
    });
    req.on('error', (err) => resolve({ error: err.message }));
    req.setTimeout(5000, () => { req.destroy(); resolve({ error: 'Timeout' }); });
  });
}

async function run() {
  console.log('Testing render URL https://pre-n3cv.onrender.com/api/notices ...');
  const renderRes = await testUrl('https://pre-n3cv.onrender.com/api/notices');
  console.log('Render Result:', renderRes);

  console.log('Testing local URL http://localhost:5000/api/notices ...');
  const localRes = await testUrl('http://localhost:5000/api/notices');
  console.log('Local Result:', localRes);
}

run();
