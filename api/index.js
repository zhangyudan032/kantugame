let app;
try {
  app = require('../backend/src/app');
} catch (err) {
  // If app fails to load, export a handler that returns the error
  module.exports = (req, res) => {
    res.status(500).json({ error: err.message, stack: err.stack });
  };
}

if (app) {
  module.exports = app;
}
