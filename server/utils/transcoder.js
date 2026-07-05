import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import path from 'path';
import fs from 'fs';

ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

const ALL_RENDITIONS = [
  { name: '360p',  height: 360,  videoBitrate: '800k',   maxRate: '856k',   bufSize: '1200k',  audioBitrate: '96k',   bandwidth: 800000,   resolution: '640x360'   },
  { name: '480p',  height: 480,  videoBitrate: '1400k',  maxRate: '1498k',  bufSize: '2100k',  audioBitrate: '128k',  bandwidth: 1400000,  resolution: '854x480'   },
  { name: '720p',  height: 720,  videoBitrate: '2800k',  maxRate: '2996k',  bufSize: '4200k',  audioBitrate: '128k',  bandwidth: 2800000,  resolution: '1280x720'  },
  { name: '1080p', height: 1080, videoBitrate: '5000k',  maxRate: '5350k',  bufSize: '7500k',  audioBitrate: '192k',  bandwidth: 5000000,  resolution: '1920x1080' },
  { name: '1440p', height: 1440, videoBitrate: '8000k',  maxRate: '8560k',  bufSize: '12000k', audioBitrate: '192k',  bandwidth: 8000000,  resolution: '2560x1440' },
  { name: '2160p', height: 2160, videoBitrate: '15000k', maxRate: '16050k', bufSize: '22500k', audioBitrate: '320k',  bandwidth: 15000000, resolution: '3840x2160' },
];

export const getVideoMetadata = (inputPath) =>
  new Promise((resolve, reject) => {
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

const buildMasterPlaylist = (renditions) => {
  let content = '#EXTM3U\n#EXT-X-VERSION:3\n\n';
  for (const r of renditions) {
    content += `#EXT-X-STREAM-INF:BANDWIDTH=${r.bandwidth},RESOLUTION=${r.resolution},NAME="${r.name}"\n`;
    content += `${r.name}/index.m3u8\n\n`;
  }
  return content;
};

/**
 * Run ffmpeg as a raw child process so we have full control over how
 * arguments are passed — no fluent-ffmpeg string parsing in between.
 * This is the only reliable way to handle paths with spaces on Windows.
 */
import { spawn } from 'child_process';

const runFFmpeg = (args, onProgress, duration) =>
  new Promise((resolve, reject) => {
    const proc = spawn(ffmpegStatic, args);

    let stderr = '';
    proc.stderr.on('data', (chunk) => {
      const line = chunk.toString();
      stderr += line;

      // Parse progress from ffmpeg stderr: "time=HH:MM:SS.xx"
      const match = line.match(/time=(\d+):(\d+):([\d.]+)/);
      if (match && duration && onProgress) {
        const elapsed = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseFloat(match[3]);
        const pct = Math.min(99, Math.round((elapsed / duration) * 100));
        onProgress(pct);
      }
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}:\n${stderr.slice(-500)}`));
      }
    });

    proc.on('error', reject);
  });

export const transcodeToHLS = async (inputPath, outputDir, onProgress) => {
  const metadata = await getVideoMetadata(inputPath);
  console.log(`[Transcoder] Source: ${metadata.width}x${metadata.height}, ${metadata.duration.toFixed(1)}s`);

  const applicableRenditions = ALL_RENDITIONS.filter((r) => r.height <= metadata.height);
  if (applicableRenditions.length === 0) applicableRenditions.push(ALL_RENDITIONS[0]);

  console.log(`[Transcoder] Producing: ${applicableRenditions.map((r) => r.name).join(', ')}`);

  fs.mkdirSync(outputDir, { recursive: true });

  const total = applicableRenditions.length;
  let completedPasses = 0;

  for (const rendition of applicableRenditions) {
    const renditionDir = path.join(outputDir, rendition.name);
    fs.mkdirSync(renditionDir, { recursive: true });

    console.log(`[Transcoder] Starting ${rendition.name} in dir: ${renditionDir}`);

    // By using only filenames (no paths) for output and segment pattern,
    // and setting cwd to renditionDir, we completely avoid spaces-in-path issues.
    // FFmpeg writes files relative to its working directory.
    const args = [
      '-i', inputPath,
      '-vcodec', 'libx264',
      '-acodec', 'aac',
      '-vf', `scale=-2:${rendition.height}`,
      '-b:v', rendition.videoBitrate,
      '-maxrate', rendition.maxRate,
      '-bufsize', rendition.bufSize,
      '-b:a', rendition.audioBitrate,
      '-preset', 'fast',
      '-profile:v', 'main',
      '-level', '4.1',
      '-movflags', '+faststart',
      '-hls_time', '6',
      '-hls_playlist_type', 'vod',
      '-hls_segment_filename', 'seg_%04d.ts',  // relative — no path, no spaces issue
      '-threads', '0',
      '-y',                                     // overwrite without asking
      'index.m3u8',                             // relative output
    ];

    const passOnProgress = (pct) => {
      const overall = ((completedPasses + pct / 100) / total) * 100;
      onProgress?.(Math.min(99, Math.round(overall)));
    };

    // spawn with cwd = renditionDir so all relative paths resolve correctly
    await new Promise((resolve, reject) => {
      const proc = spawn(ffmpegStatic, args, { cwd: renditionDir });

      let stderr = '';
      proc.stderr.on('data', (chunk) => {
        const line = chunk.toString();
        stderr += line;

        const match = line.match(/time=(\d+):(\d+):([\d.]+)/);
        if (match && metadata.duration) {
          const elapsed =
            parseInt(match[1]) * 3600 +
            parseInt(match[2]) * 60 +
            parseFloat(match[3]);
          const pct = Math.min(99, Math.round((elapsed / metadata.duration) * 100));
          passOnProgress(pct);
        }
      });

      proc.on('close', (code) => {
        if (code === 0) {
          completedPasses++;
          console.log(`[Transcoder] ${rendition.name} done (${completedPasses}/${total})`);
          resolve();
        } else {
          const errMsg = `ffmpeg exited with code ${code}: ${stderr.slice(-300)}`;
          console.error(`[Transcoder] ${rendition.name} failed:`, errMsg);
          reject(new Error(errMsg));
        }
      });

      proc.on('error', reject);
    });
  }

  const masterContent = buildMasterPlaylist(applicableRenditions);
  const masterPath = path.join(outputDir, 'master.m3u8');
  fs.writeFileSync(masterPath, masterContent);

  console.log(`[Transcoder] Master playlist written: ${masterPath}`);
  return { masterPath, renditions: applicableRenditions, metadata };
};

export const extractThumbnail = (inputPath, outputPath) =>
  new Promise((resolve, reject) => {
    const args = [
      '-ss', '00:00:01.00',
      '-i', inputPath,
      '-vframes', '1',
      '-vf', 'scale=640:-1',
      '-q:v', '2',
      '-y',
      outputPath
    ];
    const proc = spawn(ffmpegStatic, args);
    let stderr = '';
    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Failed to extract thumbnail: ffmpeg exited with code ${code}:\n${stderr}`));
      }
    });
    proc.on('error', reject);
  });