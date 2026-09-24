// video-server/src/server.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import transcoderRoutes from './routes/transcoder.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8081;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-internal-secret'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api/v1', transcoderRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Samriddhi Gyan Video Transcoder Microservice',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/v1/health',
      transcode: 'POST /api/v1/jobs/transcode',
      status: 'GET /api/v1/jobs/:lectureId/status',
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[VideoServer] Uncaught Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`═══════════════════════════════════════════════════════════`);
  console.log(`🎬 Dedicated Video Transcoder Server running on port ${PORT}`);
  console.log(`   Healthcheck: http://localhost:${PORT}/api/v1/health`);
  console.log(`═══════════════════════════════════════════════════════════`);
});
