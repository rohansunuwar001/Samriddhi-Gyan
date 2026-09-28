// video-server/src/services/TranscriptionService.js
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';
import { BaseService } from '../core/BaseService.js';

export class TranscriptionService extends BaseService {
  constructor() {
    super('TranscriptionService');
  }

  async extractAudio(videoPath, audioPath) {
    const dir = path.dirname(audioPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      const args = [
        '-y',
        '-i', videoPath,
        '-vn',
        '-acodec', 'libmp3lame',
        '-ab', '96k',
        '-ar', '16000',
        audioPath,
      ];

      const proc = spawn(ffmpegStatic, args);
      let stderr = '';
      proc.stderr.on('data', (d) => { stderr += d.toString(); });
      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg audio extraction failed: ${stderr.slice(-300)}`));
      });
      proc.on('error', reject);
    });
  }

  async transcribeAudio(audioPath, lectureId) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      this.log('Skipping transcription: No valid GEMINI_API_KEY provided.');
      return '';
    }

    const fileManager = new GoogleAIFileManager(apiKey);
    const genAI = new GoogleGenerativeAI(apiKey);

    this.log(`Uploading audio to Gemini File API for lecture ${lectureId}...`);
    const uploadResult = await fileManager.uploadFile(audioPath, {
      mimeType: 'audio/mp3',
      displayName: `Lecture Audio ${lectureId}`,
    });

    try {
      this.log(`Audio uploaded. Triggering Gemini 2.5 Flash transcription...`);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent([
        {
          fileData: {
            fileUri: uploadResult.file.uri,
            mimeType: uploadResult.file.mimeType,
          },
        },
        {
          text: 'Transcribe the audio speech word-for-word in English. Only output the transcription text, do not add headers or commentary.',
        },
      ]);

      const transcript = await result.response.text();
      this.log(`Transcription succeeded. Length: ${transcript.length} chars.`);
      return transcript;
    } finally {
      try {
        await fileManager.deleteFile(uploadResult.file.name);
      } catch (delErr) {
        this.warn(`Failed to delete temporary Gemini audio file: ${delErr.message}`);
      }
    }
  }

  /**
   * Fast audio extraction (~1-2 seconds) with FFmpeg.
   * Awaited before cleaning temp raw video so all handles on raw.mp4 are fully closed.
   */
  async prepareAudio(videoPath, lectureId) {
    const audioDir = path.join(process.cwd(), 'temp', 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }
    const tempAudioPath = path.join(audioDir, `${lectureId}.mp3`);
    this.log(`Extracting audio for speech transcription: ${lectureId}...`);
    await this.extractAudio(videoPath, tempAudioPath);
    this.log(`Audio extracted to ${tempAudioPath}`);
    return tempAudioPath;
  }

  /**
   * Run Gemini AI speech transcription in the background using the extracted MP3.
   * Completely independent of raw.mp4.
   */
  async transcribeAudioAsync(tempAudioPath, lectureId, onComplete) {
    try {
      this.log(`Starting non-blocking Gemini AI transcription for ${lectureId}...`);
      const transcript = await this.transcribeAudio(tempAudioPath, lectureId);
      if (onComplete && transcript) {
        await onComplete(transcript);
      }
      return transcript;
    } catch (err) {
      this.error(`Transcription background error for ${lectureId}: ${err.message}`);
      return '';
    } finally {
      try {
        if (fs.existsSync(tempAudioPath)) {
          fs.unlinkSync(tempAudioPath);
          this.log(`Cleaned up temporary audio file: ${tempAudioPath}`);
        }
      } catch (cleanErr) {
        this.warn(`Failed to delete temp audio file: ${cleanErr.message}`);
      }
    }
  }

  /**
   * Backwards compatible method
   */
  async processTranscriptionAsync(videoPath, lectureId, onComplete) {
    try {
      const audioPath = await this.prepareAudio(videoPath, lectureId);
      return this.transcribeAudioAsync(audioPath, lectureId, onComplete);
    } catch (err) {
      this.error(`processTranscriptionAsync error: ${err.message}`);
      return '';
    }
  }
}

export const transcriptionService = new TranscriptionService();
export default transcriptionService;
