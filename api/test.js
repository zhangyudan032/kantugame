module.exports = (req, res) => {
  res.status(200).json({ test: 'ok', path: req.url });
};
