const http = require('http');

function testLogin(email, password) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ email, password });
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
    });

    req.on('error', err => resolve({ error: err.message }));
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('Testing Admin Login (admin@prescole.com)...');
  const adminRes = await testLogin('admin@prescole.com', 'Admin@123');
  console.log('Admin Login Result:', adminRes);

  console.log('Testing Teacher Login (dhanshree@gmail.com)...');
  const teacherRes = await testLogin('dhanshree@gmail.com', 'Password@123');
  console.log('Teacher Login Result:', teacherRes);

  console.log('Testing Parent Login (kavyamaheshnandi@gmail.com)...');
  const parentRes = await testLogin('kavyamaheshnandi@gmail.com', 'Password@123');
  console.log('Parent Login Result:', parentRes);
}

run();
