const { Client } = require('pg'); 
const client = new Client({ connectionString: 'postgresql://postgres.bdtwprnttqgptwdrghed:uhAc87OmLecevtZ2@aws-1-ap-south-1.pooler.supabase.com:5432/postgres' }); 
client.connect().then(() => client.query("SELECT * FROM users LIMIT 10")).then(res => { 
  console.log(res.rows); 
  client.end(); 
}).catch(console.error);
