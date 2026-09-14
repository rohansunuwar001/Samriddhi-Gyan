import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * Health check endpoint providing real-time operational status,
 * database connectivity check, and basic process metrics.
 */
router.get('/', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const isDbConnected = dbState === 1;

  const healthData = {
    status: isDbConnected ? 'healthy' : 'degraded',
    service: 'Samriddhi Gyan Core API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatusMap[dbState] || 'unknown',
      connected: isDbConnected,
    },
    system: {
      memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      nodeVersion: process.version,
    },
  };

  return res.status(isDbConnected ? 200 : 503).json(healthData);
});

export default router;
