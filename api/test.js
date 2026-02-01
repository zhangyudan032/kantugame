module.exports = (req, res) => {
  try {
    const app = require('../backend/src/app');
    res.status(200).json({ success: true, type: typeof app });
  } catch (err) {
    res.status(200).json({ success: false, error: err.message, stack: err.stack });
  }
};
