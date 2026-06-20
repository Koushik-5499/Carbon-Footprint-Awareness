require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

if (process.env.NODE_ENV !== 'test' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your_super_secret_jwt_key_here')) {
    console.error('ERROR: JWT_SECRET is not set or is using the default insecure value.');
    process.exit(1);
}

// Route imports
const authRoutes = require('./routes/authRoutes');
const calculatorRoutes = require('./routes/calculatorRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(morgan('dev'));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use(limiter);

app.use(cors());
app.use(bodyParser.json());

// Explicitly serve static subdirectories first
app.use('/css', express.static(path.join(__dirname, '../frontend/css')));
app.use('/js', express.static(path.join(__dirname, '../frontend/js')));
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets')));

// Serve root static files (like dashboard.html, index.html etc.)
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/calculator', calculatorRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// Explicit page serving to guarantee Render loads them correctly
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});
app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});
app.get('/calculator.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/calculator.html'));
});
app.get('/challenges.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/challenges.html'));
});
app.get('/leaderboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/leaderboard.html'));
});
app.get('/ai-assistant.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/ai-assistant.html'));
});
app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

// Fallback to index.html for SPA-like behavior or unhandled routes (excluding api and static files)
app.use((req, res, next) => {
    const isApi = req.path.startsWith('/api');
    const isStatic = req.path.startsWith('/css') || req.path.startsWith('/js') || req.path.startsWith('/assets') || req.path.includes('.');
    
    if (req.method === 'GET' && !isApi && !isStatic) {
        return res.sendFile(path.join(__dirname, '../frontend/index.html'));
    }
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.url} - ${err.message}`);
    console.error(err.stack);
    
    const isProduction = process.env.NODE_ENV === 'production';
    const sanitizedMessage = isProduction ? 'An unexpected server error occurred.' : err.message;
    
    res.status(err.status || 500).json({ 
        error: 'Something went wrong!', 
        message: sanitizedMessage
    });
});

app.listen(PORT, () => {
    console.log(`EcoTrack server running on http://localhost:${PORT}`);
});

module.exports = app;
