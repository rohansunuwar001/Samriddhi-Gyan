// video-server/src/controllers/TranscoderController.js
import { BaseController } from '../core/BaseController.js';
import { jobService } from '../services/JobService.js';

export class TranscoderController extends BaseController {
  constructor() {
    super('TranscoderController');
  }

  startTranscodeJob = async (req, res) => {
    try {
      const { lectureId: reqLectureId, rawKey, sectionId, courseId, type = 'lecture', rawLocalPath } = req.body;
      const lectureId = reqLectureId || (type === 'promo' && courseId ? `promo-${courseId}` : null);

      if (!lectureId || (!rawKey && !rawLocalPath)) {
        return this.sendError(res, 'lectureId (or courseId for promo) and rawKey or rawLocalPath are required', 400);
      }

      const job = await jobService.enqueueTranscodeJob({
        lectureId,
        rawKey,
        sectionId,
        courseId,
        type,
        rawLocalPath,
      });

      return this.sendSuccess(
        res,
        { job },
        'Transcoding job accepted and queued for processing.',
        202
      );
    } catch (err) {
      return this.sendError(res, err);
    }
  };

  getJobStatus = async (req, res) => {
    try {
      const { lectureId } = req.params;
      const job = jobService.getJob(lectureId);

      if (!job) {
        return this.sendError(res, 'Job not found', 404);
      }

      // Add no-store to prevent browser 304 caching confusion
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      return this.sendSuccess(res, { job });
    } catch (err) {
      return this.sendError(res, err);
    }
  };

  getHealth = async (req, res) => {
    return this.sendSuccess(res, {
      uptime: process.uptime(),
      activeWorkers: jobService.activeWorkers,
      queueLength: jobService.queue.length,
      timestamp: new Date(),
    }, 'Video Transcoder Service is healthy');
  };
}

export const transcoderController = new TranscoderController();

export default transcoderController;
