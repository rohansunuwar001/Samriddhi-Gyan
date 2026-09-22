/**
 * BOLA-BASIC Adaptive Bitrate Controller
 *
 * Based on: Spiteri, K., Urgaonkar, R., Sitaraman, R. K. (2016).
 * "BOLA: Near-Optimal Bitrate Adaptation for Online Videos"
 * IEEE INFOCOM 2016 — https://doi.org/10.1109/INFOCOM.2016.7524428
 *
 * Place this file at: src/lib/bolaController.js
 *
 * Algorithm:
 *   At each segment decision, pick the rendition i with the highest score:
 *
 *       score_i = [ V * (v_i + γp) - Q(t) ] / R_i
 *
 *   where:
 *     V    = Lyapunov parameter derived from buffer constraints
 *     v_i  = utility of rendition i = ln(R_i / R_1)   (log-QoE model)
 *     γ    = buffer headroom parameter
 *     p    = segment duration in seconds
 *     Q(t) = current buffer occupancy in seconds
 *     R_i  = bitrate of rendition i (bits per second)
 */
export class BolaController {
  /**
   * @param {number[]} bitrates         - Array of available bitrates, ascending (bps)
   * @param {number}   segmentDuration  - Segment duration in seconds (match ffmpeg -hls_time)
   * @param {number}   maxBuffer        - Max buffer occupancy in seconds
   * @param {number}   gamma            - Buffer correction factor (default 5 from paper)
   */
  constructor(bitrates, segmentDuration, maxBuffer, gamma = 5) {
    if (!bitrates || bitrates.length === 0) {
      throw new Error("BolaController: bitrates must be a non-empty array");
    }

    // Sort ascending so R_1 (lowest) is always at index 0
    this.bitrates = [...bitrates].sort((a, b) => a - b);
    this.p        = segmentDuration;
    this.qMax     = maxBuffer;
    this.gamma    = gamma;

    // Utility function: v_i = ln(R_i / R_1)
    // R_1 = lowest bitrate (reference). v_0 = 0, v_N > 0.
    const R1 = this.bitrates[0];
    this.utilities = this.bitrates.map((r) => Math.log(r / R1));

    // Lyapunov parameter V — derived from BOLA paper eq. (6):
    //   V = (Q_max - 1) / (v_N + γp)
    // Ensures the buffer stays between 1 and Q_max seconds.
    const vN  = this.utilities[this.utilities.length - 1];
    this.V    = (maxBuffer - 1) / (vN + gamma * segmentDuration);

    // Exposed for debug overlay
    this.lastScores = [];

    console.log("[BOLA] Initialised");
    console.log(`[BOLA] Bitrates:   ${this.bitrates.join(", ")} bps`);
    console.log(`[BOLA] Utilities:  ${this.utilities.map((v) => v.toFixed(3)).join(", ")}`);
    console.log(`[BOLA] V=${this.V.toFixed(4)}, γ=${gamma}, p=${segmentDuration}s, Q_max=${maxBuffer}s`);
  }

  /**
   * Choose the best rendition index for the next segment.
   *
   * @param   {number} bufferSeconds  Current playback buffer occupancy (seconds)
   * @returns {number}                Index into this.bitrates of the chosen level
   */
  chooseLevel(bufferSeconds) {
    const Q = bufferSeconds;

    // Compute BOLA score for each rendition
    const scores = this.bitrates.map((R_i, i) => {
      const v_i = this.utilities[i];
      // score_i = [V*(v_i + γp) - Q] / R_i
      return (this.V * (v_i + this.gamma * this.p) - Q) / R_i;
    });

    // Cache for debug overlay
    this.lastScores = scores;

    return scores.indexOf(Math.max(...scores));
  }
}