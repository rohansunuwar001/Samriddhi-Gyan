// client/src/utils/chunkedUploader.js

export class ChunkedUploader {
  constructor({
    file,
    lectureId,
    baseUrl = "",
    token = "",
    chunkSize = 10 * 1024 * 1024, // 10MB default chunk size
    concurrency = 3,             // 3 chunks in parallel for optimal throughput
    onProgress = () => {},
    onStatusChange = () => {},
  }) {
    this.file = file;
    this.lectureId = lectureId;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.token = token;
    this.chunkSize = chunkSize;
    this.concurrency = concurrency;
    this.onProgress = onProgress;
    this.onStatusChange = onStatusChange;

    this.isAborted = false;
    this.activeXhrs = new Set();
    this.completedParts = [];
    this.chunkProgressMap = new Map();
  }

  abort() {
    this.isAborted = true;
    for (const xhr of this.activeXhrs) {
      try {
        xhr.abort();
      } catch {}
    }
    this.activeXhrs.clear();
  }

  async upload() {
    if (!this.file || !this.lectureId) {
      throw new Error("File and lectureId are required for upload.");
    }

    this.onStatusChange("Initiating direct cloud upload…");

    // 1. Initiate Multipart Upload
    const initRes = await fetch(
      `${this.baseUrl}/api/v1/lectures/${this.lectureId}/multipart/initiate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          fileName: this.file.name,
          fileType: this.file.type || "video/mp4",
          fileSize: this.file.size,
          chunkSize: this.chunkSize,
        }),
      }
    );

    const initData = await initRes.json();
    if (!initData.success) {
      throw new Error(initData.message || "Failed to initiate chunked upload.");
    }

    const { uploadId, key, totalParts, parts } = initData;

    this.onStatusChange(`Uploading ${totalParts} chunks directly to cloud…`);

    // 2. Upload chunks with concurrency
    const queue = [...parts];
    const totalBytes = this.file.size;

    const uploadPartWithRetry = async (partInfo, retries = 3) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        if (this.isAborted) throw new Error("Upload cancelled");
        try {
          return await this.uploadSingleChunk(partInfo, totalParts, totalBytes);
        } catch (err) {
          if (this.isAborted) throw err;
          if (attempt === retries) throw err;
          console.warn(`Chunk ${partInfo.partNumber} failed (attempt ${attempt}), retrying...`);
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }
    };

    const worker = async () => {
      while (queue.length > 0) {
        if (this.isAborted) break;
        const partInfo = queue.shift();
        if (!partInfo) break;

        const uploadedPart = await uploadPartWithRetry(partInfo);
        this.completedParts.push(uploadedPart);
      }
    };

    const workers = Array.from(
      { length: Math.min(this.concurrency, parts.length) },
      () => worker()
    );

    await Promise.all(workers);

    if (this.isAborted) {
      // Abort on server
      try {
        await fetch(`${this.baseUrl}/api/v1/lectures/${this.lectureId}/multipart/abort`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify({ uploadId, key }),
        });
      } catch {}
      throw new Error("Upload aborted");
    }

    // 3. Complete Multipart Upload
    this.onStatusChange("Assembling chunks in cloud storage…");
    this.onProgress(100);

    const completeRes = await fetch(
      `${this.baseUrl}/api/v1/lectures/${this.lectureId}/multipart/complete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          uploadId,
          key,
          parts: this.completedParts,
        }),
      }
    );

    const completeData = await completeRes.json();
    if (!completeData.success) {
      throw new Error(completeData.message || "Failed to finalize chunked upload.");
    }

    return completeData;
  }

  uploadSingleChunk(partInfo, totalParts, totalBytes) {
    return new Promise((resolve, reject) => {
      const partNumber = partInfo.partNumber;
      const start = (partNumber - 1) * this.chunkSize;
      const end = Math.min(start + this.chunkSize, this.file.size);
      const chunkBlob = this.file.slice(start, end);

      const xhr = new XMLHttpRequest();
      this.activeXhrs.add(xhr);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          this.chunkProgressMap.set(partNumber, e.loaded);
          this.calculateOverallProgress(totalBytes);
        }
      };

      xhr.onload = () => {
        this.activeXhrs.delete(xhr);
        if (xhr.status >= 200 && xhr.status < 300) {
          // Extract ETag header (B2 returns ETag enclosed in quotes, e.g. "9b2cf5...")
          const rawETag =
            xhr.getResponseHeader("ETag") ||
            xhr.getResponseHeader("etag") ||
            "";

          const cleanETag = rawETag.replace(/['"]/g, "").trim();

          this.chunkProgressMap.set(partNumber, chunkBlob.size);
          this.calculateOverallProgress(totalBytes);

          resolve({
            PartNumber: partNumber,
            ETag: cleanETag,
          });
        } else {
          reject(new Error(`Chunk ${partNumber} upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        this.activeXhrs.delete(xhr);
        reject(new Error(`Network error uploading chunk ${partNumber}`));
      };

      xhr.onabort = () => {
        this.activeXhrs.delete(xhr);
        reject(new Error(`Chunk ${partNumber} aborted`));
      };

      xhr.open("PUT", partInfo.url);
      // S3/B2 presigned PUT for multipart parts does not require Content-Type header unless specified
      xhr.send(chunkBlob);
    });
  }

  calculateOverallProgress(totalBytes) {
    if (!totalBytes || totalBytes <= 0) return;
    if (!this.startTime) this.startTime = Date.now();

    let loaded = 0;
    for (const bytes of this.chunkProgressMap.values()) {
      loaded += bytes;
    }

    const now = Date.now();
    const elapsedSec = (now - this.startTime) / 1000;
    const bytesPerSec = elapsedSec > 0.5 ? loaded / elapsedSec : 0;

    let speedFormatted = "";
    if (bytesPerSec >= 1024 * 1024) {
      speedFormatted = `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
    } else if (bytesPerSec >= 1024) {
      speedFormatted = `${Math.round(bytesPerSec / 1024)} KB/s`;
    }

    let etaFormatted = "";
    if (bytesPerSec > 0) {
      const remainingBytes = Math.max(0, totalBytes - loaded);
      const secondsLeft = Math.round(remainingBytes / bytesPerSec);
      etaFormatted =
        secondsLeft < 60
          ? `${secondsLeft}s left`
          : `${Math.floor(secondsLeft / 60)}m ${secondsLeft % 60}s left`;
    }

    const percent = Math.min(99, Math.round((loaded / totalBytes) * 100));

    this.onProgress(percent, {
      percent,
      loaded,
      total: totalBytes,
      speed: bytesPerSec,
      speedFormatted,
      etaFormatted,
    });
  }
}

export default ChunkedUploader;
