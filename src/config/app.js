const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const errorHandler = require('../middlewares/errorHandler');
const app = express();

// ─────────────────────────────────────────
//  Security & Utility Middleware
// ─────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────
//  Swagger Docs
// ─────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─────────────────────────────────────────
//  Routes
// ─────────────────────────────────────────
const authRoutes = require('../routes/authRoutes');
const userRoutes = require('../routes/userRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// ─────────────────────────────────────────
//  Health Check
// ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// ─────────────────────────────────────────
//  404 Handler
// ───────────────────────────────────────── 
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ─────────────────────────────────────────
//  Global Error Handler
// ─────────────────────────────────────────
app.use(errorHandler);

module.exports = app;