const bcrypt = require('bcrypt');
const hash = '$2b$10$vJSbaQcyJiC1AkH5yH1oRu5gsWVfsOWnRjCj6bgWyOQwmW3WF8a.i';
const passwords = ['admin123', 'password', '123456', 'admin', 'password123', 'admin@123', 'Admin@123'];

async function test() {
  for (const pwd of passwords) {
    if (await bcrypt.compare(pwd, hash)) {
      console.log('Match found:', pwd);
      return;
    }
  }
  console.log('No match');
}

test();
