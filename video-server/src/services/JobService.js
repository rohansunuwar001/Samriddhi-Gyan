// video-server/src/services/JobService.js
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { BaseService } from '../core/BaseService.js';
import { storageService } from './StorageService.js';
import { transcoderService } from './TranscoderService.js';
import { transcriptionService } from './TranscriptionService.js';

export class JobService extends BaseService {
  constructor() {
    super('JobService');
    this.jobs = new Map();
    this.activeWorkers = 0;
    this.maxConcurrentJobs = 2; // Process up to 2 full videos in parallel
    this.queue = [];
  }

  getJob(lectureId) {
    return this.jobs.get(lectureId) || null;
  }

  updateJob(lectureId, patch) {
    const existing = this.jobs.get(lectureId) || {
      lectureId,
      status: 'pending',
      progress: 0,
      phase: 'Initialized',
      error: null,
      createdAt: new Date(),
    };
    const updated = { ...existing, ...patch, updatedAt: new Date() };
    this.jobs.set(lectureId, updated);
    this.emit('jobUpdated', updated);
    return updated;
  }

  async notifyMainServer(lectureId, payload, isPromo = false, courseId = null) {
    const mainServerUrl = process.env.MAIN_SERVER_URL || 'http://localhost:10000';
    const secret = process.env.INTERNAL_SECRET_KEY || 'transcoder_internal_secret_change_me';
    const endpoint = isPromo
      ? `${mainServerUrl}/api/v1/internal/promo/${courseId}/complete`
      : `${mainServerUrl}/api/v1/internal/lectures/${lectureId}/complete`;

    try {
      this.log(`Notifying main server at ${endpoint}...`);
      await axios.post(
        endpoint,
        payload,
        {
          headers: {
            'x-internal-secret': secret,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      this.log(`Main server successfully notified at ${endpoint}`);
    } catch (err) {
      this.warn(`Failed to notify main server at ${endpoint}: ${err.message}`);
    }
  }

  async enqueueTranscodeJob({ lectureId, rawKey, sectionId, courseId, type = 'lecture', rawLocalPath }) {
    if (!lectureId || (!rawKey && !rawLocalPath)) {
      throw new Error('lectureId and rawKey or rawLocalPath are required to start transcoding.');
    }

    this.updateJob(lectureId, {
      lectureId,
      rawKey,
      type,
      courseId,
      status: 'queued',
      progress: 0,
      phase: 'Job queued for processing…',
    });

    this.queue.push({ lectureId, rawKey, sectionId, courseId, type, rawLocalPath });
    this.processNext();

    return this.getJob(lectureId);
  }

  async processNext() {
    if (this.activeWorkers >= this.maxConcurrentJobs || this.queue.length === 0) {
      return;
    }

    const jobData = this.queue.shift();
    if (!jobData) return;

    this.activeWorkers++;
    try {
      await this.executeJob(jobData);
    } catch (err) {
      this.error(`Job execution failed for ${jobData.lectureId}: ${err.message}`);
    } finally {
      this.activeWorkers--;
      this.processNext();
    }
  }

  async executeJob({ lectureId, rawKey, courseId, type = 'lecture', rawLocalPath }) {
    const isPromo = type === 'promo' || String(lectureId).startsWith('promo-');
    const targetCourseId = courseId || (isPromo ? String(lectureId).replace(/^promo-/, '') : null);
    const tempDir = path.join(process.cwd(), 'temp', lectureId);
    const rawLocalFile = path.join(tempDir, 'raw.mp4');
    const hlsOutputDir = path.join(tempDir, 'hls');

    try {
      fs.mkdirSync(tempDir, { recursive: true });

      // Step 1: Obtain raw video (from local disk if provided/available, or B2 download)
      this.updateJob(lectureId, {
        status: 'downloading',
        progress: 5,
        phase: isPromo
          ? 'Preparing promotional video for transcoding…'
          : 'Downloading raw video from cloud storage…',
      });

      if (rawLocalPath && fs.existsSync(rawLocalPath)) {
        this.log(`Using local raw video file from: ${rawLocalPath}`);
        fs.copyFileSync(rawLocalPath, rawLocalFile);
        // Clean up local raw upload from server uploads folder
        try { fs.unlinkSync(rawLocalPath); } catch (_) {}
        // If rawKey exists in B2, clean it up
        if (rawKey) {
          storageService.deleteFile(rawKey).catch(() => {});
        }
      } else if (rawKey) {
        await storageService.downloadRawVideoToFile(rawKey, rawLocalFile, (pct) => {
          this.updateJob(lectureId, {
            status: 'downloading',
            progress: Math.round(5 + pct * 0.15),
            phase: `Downloading from cloud… ${pct}%`,
          });
        });

        // Step 1b: Delete raw upload from B2 immediately after download
        await storageService.deleteFile(rawKey);
      } else {
        throw new Error('No valid rawKey or rawLocalPath found for job.');
      }

      // Step 2: Transcode to multi-bitrate HLS (20% -> 80%)
      this.updateJob(lectureId, {
        status: 'transcoding',
        progress: 20,
        phase: 'Transcoding video to adaptive HLS…',
      });

      const { renditions, metadata } = await transcoderService.transcodeToHLS(
        rawLocalFile,
        hlsOutputDir,
        (pct) => {
          this.updateJob(lectureId, {
            status: 'transcoding',
            progress: 20 + Math.round(pct * 0.6),
            phase: `Transcoding HLS… ${pct}%`,
          });
        }
      );

      // Step 2b: Extract lightweight MP3 audio for AI Transcription (Lectures only, skip for promo)
      let tempAudioPath = null;
      if (!isPromo) {
        try {
          tempAudioPath = await transcriptionService.prepareAudio(rawLocalFile, lectureId);
        } catch (audioErr) {
          this.warn(`Audio extraction warning for ${lectureId}: ${audioErr.message}`);
        }
      }

      // Step 3: Parallel upload HLS chunks to B2 (80% -> 100%)
      this.updateJob(lectureId, {
        status: 'uploading',
        progress: 80,
        phase: 'Uploading HLS streaming segments to cloud storage…',
      });

      const concurrency = Number(process.env.B2_UPLOAD_CONCURRENCY) || 6;
      const b2Prefix = isPromo ? `promo/promo-${targetCourseId}` : `lectures/${lectureId}`;
      const { masterUrl, thumbnailUrl } = await storageService.uploadHLSParallel(
        hlsOutputDir,
        b2Prefix,
        (pct) => {
          this.updateJob(lectureId, {
            status: 'uploading',
            progress: 80 + Math.round(pct * 0.19),
            phase: `Uploading to cloud storage… ${pct}%`,
          });
        },
        concurrency
      );

      // Step 3b: Also mirror HLS segments to main server public folder for local zero-cap streaming
      const localDirName = isPromo ? `promo-${targetCourseId}` : lectureId;
      const localServerHlsDir = path.resolve(process.cwd(), '../server/public/hls', localDirName);
      try {
        fs.mkdirSync(localServerHlsDir, { recursive: true });
        fs.cpSync(hlsOutputDir, localServerHlsDir, { recursive: true });
        this.log(`Successfully mirrored HLS files to local server: ${localServerHlsDir}`);
      } catch (cpErr) {
        this.warn(`Could not mirror HLS files locally: ${cpErr.message}`);
      }

      // Determine URLs: Local server static URL takes precedence for reliable playback without B2 403 caps
      const mainServerUrl = process.env.MAIN_SERVER_URL || 'http://localhost:10000';
      const localMasterUrl = `${mainServerUrl}/hls/${localDirName}/master.m3u8`;
      const localThumbnailUrl = `${mainServerUrl}/hls/${localDirName}/thumb.jpg`;

      const effectiveVideoUrl = localMasterUrl || masterUrl;
      const effectiveThumbnailUrl = localThumbnailUrl || thumbnailUrl;

      // Step 4: Mark video as Ready immediately!
      const completionPayload = {
        videoUrl: effectiveVideoUrl,
        thumbnail: effectiveThumbnailUrl,
        b2VideoUrl: masterUrl,
        durationInSeconds: Math.round(metadata.duration),
        resolution: `${metadata.width}x${metadata.height}`,
        status: 'ready',
      };

      this.updateJob(lectureId, {
        status: 'ready',
        progress: 100,
        phase: 'Ready',
        ...completionPayload,
      });

      await this.notifyMainServer(lectureId, completionPayload, isPromo, targetCourseId);

      // Step 5: Background AI Speech Transcription using lightweight MP3 (Lectures only)
      if (!isPromo && tempAudioPath && fs.existsSync(tempAudioPath)) {
        transcriptionService.transcribeAudioAsync(tempAudioPath, lectureId, async (transcript) => {
          this.log(`Transcription completed in background for lecture ${lectureId}`);
          await this.notifyMainServer(lectureId, { transcript }, false, null);
        });
      }

    } catch (err) {
      this.error(`Error processing ${lectureId}: ${err.message}`);
      this.updateJob(lectureId, {
        status: 'failed',
        progress: 0,
        phase: 'Failed',
        error: err.message,
      });
      await this.notifyMainServer(lectureId, { status: 'failed', error: err.message }, isPromo, targetCourseId);

      // Clean up orphaned raw file and partial HLS uploads from B2
      try {
        if (rawKey) await storageService.deleteFile(rawKey);
        const b2Prefix = isPromo ? `promo/promo-${targetCourseId}` : `lectures/${lectureId}`;
        await storageService.deleteFolder(b2Prefix);
      } catch (cleanB2Err) {
        this.warn(`Failed B2 cleanup on error: ${cleanB2Err.message}`);
      }
    } finally {
      // Clean up local temp directory
      try {
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
          this.log(`Cleaned up local temp folder: ${tempDir}`);
        }
      } catch (cleanErr) {
        this.warn(`Failed to clean tempDir: ${cleanErr.message}`);
      }
    }
  }
}

export const jobService = new JobService();
export default jobService;
