/**
 * Persistent LRU Cache Engine for Offline Lecture Videos
 *
 * v3 — Segments are stored individually so we can reconstruct a valid HLS
 * playlist with blob: segment URLs that hls.js can actually play.
 *
 * Storage layout:
 *   STORE_VIDEOS    { id, title, type:"hls", variantText, segCount, timestamp }
 *   STORE_SEGMENTS  { id: `${lectureId}:${segIndex}`, data: ArrayBuffer }
 *   STORE_METADATA  { key:"lru_order", order:[...lectureIds] }
 */

const DB_NAME     = "OfflineVideoDB";
const STORE_VIDEOS   = "videos";
const STORE_SEGMENTS = "segments";
const STORE_METADATA = "metadata";
const CACHE_LIMIT    = 3;

// ─── DB open ────────────────────────────────────────────────────────────────

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 3); // v3: segments store, wipes v1/v2

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      // Drop every old store so stale data from v1/v2 is wiped
      for (const name of ["videos", "segments", "metadata"]) {
        if (db.objectStoreNames.contains(name)) db.deleteObjectStore(name);
      }
      db.createObjectStore(STORE_VIDEOS,   { keyPath: "id" });
      db.createObjectStore(STORE_SEGMENTS, { keyPath: "id" });
      db.createObjectStore(STORE_METADATA, { keyPath: "key" });
    };

    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror  = (e) => reject(e.target.error);
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function runQuery(storeName, mode, callback) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const req   = callback(store);
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror    = () => reject(tx.error);
  });
}

async function getLRUOrder() {
  try {
    const res = await runQuery(STORE_METADATA, "readonly", (s) => s.get("lru_order"));
    return res ? res.order : [];
  } catch { return []; }
}

async function saveLRUOrder(order) {
  return runQuery(STORE_METADATA, "readwrite", (s) =>
    s.put({ key: "lru_order", order })
  );
}

async function deleteAllSegments(lectureId, segCount) {
  for (let i = 0; i < segCount; i++) {
    await runQuery(STORE_SEGMENTS, "readwrite", (s) =>
      s.delete(`${lectureId}:${i}`)
    );
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Return the metadata record if this lecture is cached, updating LRU order.
 * Returns null if not cached.
 */
export async function getCachedVideo(id) {
  try {
    const record = await runQuery(STORE_VIDEOS, "readonly", (s) => s.get(id));
    if (!record) return null;

    let order = await getLRUOrder();
    order = [id, ...order.filter((x) => x !== id)];
    await saveLRUOrder(order);

    return record; // { id, title, type, variantText, segCount, timestamp }
  } catch (err) {
    console.error("getCachedVideo error:", err);
    return null;
  }
}

/**
 * Build an in-memory HLS playlist blob URL with blob: segment URLs.
 * hls.js can load this URL and play the offline video without any network requests.
 */
export async function buildOfflinePlaylistUrl(id) {
  try {
    const record = await runQuery(STORE_VIDEOS, "readonly", (s) => s.get(id));
    if (!record) return null;

    // Load every segment ArrayBuffer and create a blob: URL for each
    const segBlobUrls = [];
    for (let i = 0; i < record.segCount; i++) {
      const segRecord = await runQuery(STORE_SEGMENTS, "readonly", (s) =>
        s.get(`${id}:${i}`)
      );
      if (!segRecord) break;
      const blob = new Blob([segRecord.data], { type: "video/mp2t" });
      segBlobUrls.push(URL.createObjectURL(blob));
    }

    // Rewrite the variant playlist: replace every non-comment line (segment ref)
    // with its corresponding blob: URL
    let segIdx = 0;
    const rewritten = record.variantText
      .split("\n")
      .map((line) => {
        const t = line.trim();
        if (t && !t.startsWith("#")) {
          return segBlobUrls[segIdx++] ?? line;
        }
        return line;
      })
      .join("\n");

    const playlistBlob = new Blob([rewritten], { type: "application/x-mpegurl" });
    return URL.createObjectURL(playlistBlob);
  } catch (err) {
    console.error("buildOfflinePlaylistUrl error:", err);
    return null;
  }
}

/**
 * Save HLS lecture data to the LRU cache.
 *
 * @param {string} id          Lecture _id
 * @param {{ variantText: string, segments: ArrayBuffer[] }} hlsData
 * @param {string} title       Lecture title
 */
export async function saveVideoToCache(id, hlsData, title) {
  try {
    let order = await getLRUOrder();
    order = order.filter((x) => x !== id); // remove if already present

    let evicted = false;
    if (order.length >= CACHE_LIMIT) {
      const lruId  = order.pop();
      const lruRec = await runQuery(STORE_VIDEOS, "readonly", (s) => s.get(lruId));
      await runQuery(STORE_VIDEOS, "readwrite", (s) => s.delete(lruId));
      if (lruRec) await deleteAllSegments(lruId, lruRec.segCount);
      console.log(`[LRU Cache] Evicted: ${lruId}`);
      evicted = true;
    }

    order.unshift(id);
    await saveLRUOrder(order);

    // Store the metadata / variant playlist
    await runQuery(STORE_VIDEOS, "readwrite", (s) =>
      s.put({
        id,
        title,
        type: "hls",
        variantText: hlsData.variantText,
        segCount: hlsData.segments.length,
        timestamp: Date.now(),
      })
    );

    // Store each segment ArrayBuffer under `${id}:${i}`
    for (let i = 0; i < hlsData.segments.length; i++) {
      await runQuery(STORE_SEGMENTS, "readwrite", (s) =>
        s.put({ id: `${id}:${i}`, data: hlsData.segments[i] })
      );
    }

    return { success: true, evicted };
  } catch (err) {
    console.error("saveVideoToCache error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * List all cached lectures in LRU order.
 */
export async function getCacheState() {
  try {
    const list  = await runQuery(STORE_VIDEOS, "readonly", (s) => s.getAll());
    const order = await getLRUOrder();
    return order
      .map((id) => list.find((item) => item.id === id))
      .filter(Boolean)
      .map((item, idx) => ({
        id:        item.id,
        title:     item.title,
        rank:
          idx === 0
            ? "Most Recently Played"
            : idx === order.length - 1
            ? "Least Recently Played (Next to Evict)"
            : "Buffered",
        evictNext: idx === order.length - 1,
      }));
  } catch (err) {
    console.error("getCacheState error:", err);
    return [];
  }
}

/**
 * Remove one lecture from the cache.
 */
export async function deleteVideo(id) {
  try {
    const record = await runQuery(STORE_VIDEOS, "readonly", (s) => s.get(id));
    let order    = await getLRUOrder();
    order        = order.filter((x) => x !== id);
    await saveLRUOrder(order);
    await runQuery(STORE_VIDEOS, "readwrite", (s) => s.delete(id));
    if (record) await deleteAllSegments(id, record.segCount);
    return true;
  } catch { return false; }
}

/**
 * Wipe the entire offline cache.
 */
export async function clearAllCache() {
  try {
    await runQuery(STORE_VIDEOS,   "readwrite", (s) => s.clear());
    await runQuery(STORE_SEGMENTS, "readwrite", (s) => s.clear());
    await saveLRUOrder([]);
    return true;
  } catch { return false; }
}
