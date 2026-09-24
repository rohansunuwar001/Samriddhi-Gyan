// video-server/src/services/TranscoderService.js
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { BaseService } from '../core/BaseService.js';

ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

export class TranscoderService extends BaseService {
  constructor() {
    super('TranscoderService');

    this.allRenditions = [
      { name: '360p',  height: 360,  videoBitrate: '800k',   maxRate: '856k',   bufSize: '1200k',  audioBitrate: '96k',   bandwidth: 800000,   resolution: '640x360'   },
      { name: '480p',  height: 480,  videoBitrate: '1400k',  maxRate: '1498k',  bufSize: '2100k',  audioBitrate: '128k',  bandwidth: 1400000,  resolution: '854x480'   },
      { name: '720p',  height: 720,  videoBitrate: '2800k',  maxRate: '2996k',  bufSize: '4200k',  audioBitrate: '128k',  bandwidth: 2800000,  resolution: '1280x720'  },
      { name: '1080p', height: 1080, videoBitrate: '5000k',  maxRate: '5350k',  bufSize: '7500k',  audioBitrate: '192k',  bandwidth: 5000000,  resolution: '1920x1080' },
      { name: '1440p', height: 1440, videoBitrate: '8000k',  maxRate: '8560k',  bufSize: '12000k', audioBitrate: '192k',  bandwidth: 8000000,  resolution: '2560x1440' },
      { name: '2160p', height: 2160, videoBitrate: '15000k', maxRate: '16050k', bufSize: '22500k', audioBitrate: '320k',  bandwidth: 15000000, resolution: '3840x2160' },
    ];
  }

  async getVideoMetadata(inputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) return reject(err);
        const video = metadata.streams.find((s) => s.codec_type === 'video');
        if (!video) return reject(new Error('No video stream found in file'));
        resolve({
          width: video.width,
          height: video.height,
          duration: parseFloat(metadata.format.duration) || 0,
          codec: video.codec_name,
        });
      });
    });
  }

  buildMasterPlaylist(renditions) {
    let content = '#EXTM3U\n#EXT-X-VERSION:3\n\n';
    for (const r of renditions) {
      content += `#EXT-X-STREAM-INF:BANDWIDTH=${r.bandwidth},RESOLUTION=${r.resolution},NAME="${r.name}"\n`;
      content += `${r.name}/index.m3u8\n\n`;
    }
    return content;
  }

  async extractThumbnail(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      const args = [
        '-y',
        '-ss', '00:00:02',
        '-i', inputPath,
        '-vframes', '1',
        '-vf', 'scale=640:-1',
        '-q:v', '2',
        outputPath,
      ];

      const proc = spawn(ffmpegStatic, args);
      let stderr = '';
      proc.stderr.on('data', (d) => { stderr += d.toString(); });
      proc.on('close', (code) => {
        if (code === 0) resolve(outputPath);
        else reject(new Error(`Thumbnail extraction failed: ${stderr.slice(-300)}`));
      });
      proc.on('error', reject);
    });
  }

  async transcodeToHLS(inputPath, outputDir, onProgress) {
    return this.executeWithTimer('HLS Transcoding', async () => {
      const metadata = await this.getVideoMetadata(inputPath);
      this.log(`Source: ${metadata.width}x${metadata.height}, ${metadata.duration.toFixed(1)}s`);

      const applicableRenditions = this.allRenditions.filter((r) => r.height <= metadata.height);
      if (applicableRenditions.length === 0) {
        applicableRenditions.push(this.allRenditions[0]);
      }

      this.log(`Renditions to produce: ${applicableRenditions.map((r) => r.name).join(', ')}`);
      fs.mkdirSync(outputDir, { recursive: true });

      const total = applicableRenditions.length;
      let completedPasses = 0;
      const preset = process.env.FFMPEG_PRESET || 'veryfast';

      for (const rendition of applicableRenditions) {
        const renditionDir = path.join(outputDir, rendition.name);
        fs.mkdirSync(renditionDir, { recursive: true });

        this.log(`Starting rendition ${rendition.name} (Preset: ${preset})...`);

        const args = [
          '-i', inputPath,
          '-vcodec', 'libx264',
          '-acodec', 'aac',
          '-vf', `scale=-2:${rendition.height}`,
          '-b:v', rendition.videoBitrate,
          '-maxrate', rendition.maxRate,
          '-bufsize', rendition.bufSize,
          '-b:a', rendition.audioBitrate,
          '-preset', preset,
          '-profile:v', 'main',
          '-level', '4.1',
          '-movflags', '+faststart',
          '-hls_time', '6',
          '-hls_playlist_type', 'vod',
          '-hls_segment_filename', 'seg_%04d.ts',
          '-threads', '0',
          '-y',
          'index.m3u8',
        ];

        const passOnProgress = (pct) => {
          const overall = ((completedPasses + pct / 100) / total) * 100;
          onProgress?.(Math.min(99, Math.round(overall)));
        };

        await new Promise((resolve, reject) => {
          const proc = spawn(ffmpegStatic, args, { cwd: renditionDir });
          let stderr = '';

          let lastLogTime = 0;

          proc.stderr.on('data', (chunk) => {
            const line = chunk.toString();
            stderr += line;

            const timeMatch = line.match(/time=(\d+):(\d+):([\d.]+)/);
            const speedMatch = line.match(/speed=\s*([\d.]+x)/);
            const fpsMatch = line.match(/fps=\s*([\d.]+)/);

            if (timeMatch && metadata.duration) {
              const elapsed =
                parseInt(timeMatch[1]) * 3600 +
                parseInt(timeMatch[2]) * 60 +
                parseFloat(timeMatch[3]);
              const pct = Math.min(99, Math.round((elapsed / metadata.duration) * 100));
              passOnProgress(pct);

              const now = Date.now();
              if (now - lastLogTime >= 2000) {
                lastLogTime = now;
                const speed = speedMatch ? speedMatch[1] : '1.0x';
                const fps = fpsMatch ? Math.round(parseFloat(fpsMatch[1])) : '-';
                this.log(
                  `⚡ [${rendition.name}] Transcoding: ${pct}% • Speed: ${speed} • FPS: ${fps} • Position: ${timeMatch[0].replace('time=', '')}`
                );
              }
            }
          });

          proc.on('close', (code) => {
            if (code === 0) {
              completedPasses++;
              this.log(`Rendition ${rendition.name} complete (${completedPasses}/${total})`);
              resolve();
            } else {
              const errMsg = `FFmpeg failed with code ${code}: ${stderr.slice(-300)}`;
              this.error(errMsg);
              reject(new Error(errMsg));
            }
          });

          proc.on('error', reject);
        });
      }

      // Generate Master Playlist
      const masterContent = this.buildMasterPlaylist(applicableRenditions);
      const masterPath = path.join(outputDir, 'master.m3u8');
      fs.writeFileSync(masterPath, masterContent);

      // Extract Thumbnail
      const thumbPath = path.join(outputDir, 'thumb.jpg');
      try {
        await this.extractThumbnail(inputPath, thumbPath);
      } catch (thumbErr) {
        this.warn(`Thumbnail extraction warning: ${thumbErr.message}`);
      }

      return { masterPath, renditions: applicableRenditions, metadata };
    });
  }
}

export const transcoderService = new TranscoderService();
export default transcoderService;
