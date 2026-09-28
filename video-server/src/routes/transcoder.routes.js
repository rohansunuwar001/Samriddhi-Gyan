// video-server/src/routes/transcoder.routes.js
import express from 'express';
import { transcoderController } from '../controllers/TranscoderController.js';

const router = express.Router();

router.get('/health', transcoderController.getHealth);
router.post('/jobs/transcode', transcoderController.startTranscodeJob);
router.get('/jobs/:lectureId/status', transcoderController.getJobStatus);

export default router;
