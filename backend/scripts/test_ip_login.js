const http = require('http');

function testLoginIp(host, port, path, email, password) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ email, password });
    const req = http.request({
      hostname: host,
      port: port,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: data.slice(0, 150) }));
    });

    req.on('error', err => resolve({ error: err.message }));
    req.setTimeout(3000, () => { req.destroy(); resolve({ error: 'Timeout' }); });
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('Testing localhost:5000 ...');
  console.log(await testLoginIp('127.0.0.1', 5000, '/api/auth/login', 'admin@prescole.com', 'Admin@123'));

  console.log('Testing Wi-Fi IP 10.37.189.190:5000 ...');
  console.log(await testLoginIp('10.37.189.190', 5000, '/api/auth/login', 'admin@prescole.com', 'Admin@123'));
}

run();
