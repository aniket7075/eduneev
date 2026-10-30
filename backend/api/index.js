// Vercel Serverless Function entrypoint
// Loads precompiled dist/app if available, otherwise registers ts-node to run src/app
let app;
try {
  const mod = require('../dist/app');
  app = mod.default || mod;
} catch (e) {
  try {
    require('ts-node/register');
    const mod = require('../src/app');
    app = mod.default || mod;
  } catch (err) {
    console.error('Failed to load application:', err);
    throw err;
  }
}

module.exports = app;
