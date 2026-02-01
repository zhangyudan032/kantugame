require('dotenv').config();

const express = require('express');
const cookieSession = require('cookie-session');

const authRoutes = require('./routes/auth');
const questionsRoutes = require('./routes/questions');
const answersRoutes = require('./routes/answers');

const app = express();

// Trust proxy (Vercel terminates TLS at edge, forwards via HTTP internally)
app.set('trust proxy', 1);

// Middleware
app.use(express.json());

app.use(cookieSession({
  name: 'session',
  secret: process.env.SESSION_SECRET || 'default-secret-key',
  maxAge: 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax'
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/answers', answersRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

module.exports = app;
