const serverless = require('serverless-http');
const app = require('./src/app');

exports.main = serverless(app);
