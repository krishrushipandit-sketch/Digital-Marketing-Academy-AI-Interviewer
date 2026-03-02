require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const interviewRoutes = require('./routes/interview');
const adminRoutes = require('./routes/admin');
const webhookRoutes = require('./routes/webhook');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS — allow dev localhost + production Vercel frontend
const allowedOrigins = (process.env.CORS_ORIGIN || 'https://localhost:5173')
    .split(',')
    .map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Retell webhook, Postman)
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: ${origin} not allowed`));
    },
    credentials: true,
}));

app.use(express.json());

// Health check — used by VPS monitoring & CI
app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhook', webhookRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
