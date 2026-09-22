/**
 * Simple, self-contained Matrix Factorization (SVD) algorithm using Stochastic Gradient Descent (SGD).
 * Predicts user-item ratings in a sparse matrix.
 */
export class SVD {
  /**
   * @param {number} latentFactors - Dimensionality of the latent space (number of features).
   * @param {number} learningRate - Step size for SGD parameter updates.
   * @param {number} regularization - Penalty factor to prevent overfitting.
   * @param {number} epochs - Number of training iterations over the dataset.
   */
  constructor(latentFactors = 5, learningRate = 0.05, regularization = 0.02, epochs = 25) {
    this.latentFactors = latentFactors;
    this.learningRate = learningRate;
    this.regularization = regularization;
    this.epochs = epochs;

    this.mu = 0; // Global mean rating
    this.bUser = {}; // User bias dictionary: userId -> bias
    this.bCourse = {}; // Course bias dictionary: courseId -> bias
    this.pUser = {}; // User latent factors dictionary: userId -> float array
    this.qCourse = {}; // Course latent factors dictionary: courseId -> float array
  }

  /**
   * Trains the SVD latent factors on a sparse rating array.
   * @param {Array<{userId: string, courseId: string, rating: number}>} ratings - Observed user-course rating interactions.
   */
  train(ratings) {
    if (!Array.isArray(ratings) || ratings.length === 0) {
      this.mu = 4.0; // Default fallback global rating
      return;
    }

    let totalRating = 0;
    const userIds = new Set();
    const courseIds = new Set();

    ratings.forEach((r) => {
      totalRating += r.rating;
      userIds.add(r.userId.toString());
      courseIds.add(r.courseId.toString());
    });

    this.mu = totalRating / ratings.length;

    // Initialize biases to 0
    // Initialize latent vectors to small random float values
    userIds.forEach((u) => {
      this.bUser[u] = 0;
      this.pUser[u] = Array.from(
        { length: this.latentFactors },
        () => (Math.random() - 0.5) * 0.1
      );
    });

    courseIds.forEach((c) => {
      this.bCourse[c] = 0;
      this.qCourse[c] = Array.from(
        { length: this.latentFactors },
        () => (Math.random() - 0.5) * 0.1
      );
    });

    // Run Stochastic Gradient Descent
    for (let epoch = 0; epoch < this.epochs; epoch++) {
      ratings.forEach(({ userId, courseId, rating }) => {
        const u = userId.toString();
        const c = courseId.toString();

        const bu = this.bUser[u] ?? 0;
        const bc = this.bCourse[c] ?? 0;
        const pu = this.pUser[u] ?? Array(this.latentFactors).fill(0);
        const qc = this.qCourse[c] ?? Array(this.latentFactors).fill(0);

        // Calculate predicted rating: r_hat = mu + b_u + b_c + P_u . Q_c
        let dot = 0;
        for (let k = 0; k < this.latentFactors; k++) {
          dot += pu[k] * qc[k];
        }
        const prediction = this.mu + bu + bc + dot;
        const error = rating - prediction;

        // Update biases
        this.bUser[u] = bu + this.learningRate * (error - this.regularization * bu);
        this.bCourse[c] = bc + this.learningRate * (error - this.regularization * bc);

        // Update latent vectors pu and qc
        for (let k = 0; k < this.latentFactors; k++) {
          const puK = pu[k];
          const qcK = qc[k];
          pu[k] = puK + this.learningRate * (error * qcK - this.regularization * puK);
          qc[k] = qcK + this.learningRate * (error * puK - this.regularization * qcK);
        }

        this.pUser[u] = pu;
        this.qCourse[c] = qc;
      });
    }
  }

  /**
   * Predicts the rating a user would give to a course.
   * @param {string} userId - ID of the user.
   * @param {string} courseId - ID of the course.
   * @returns {number} Predicted rating score, clamped between 1.0 and 5.0.
   */
  predict(userId, courseId) {
    const u = userId ? userId.toString() : null;
    const c = courseId ? courseId.toString() : null;
    const bu = (u && this.bUser[u]) || 0;
    const bc = (c && this.bCourse[c]) || 0;
    const pu = u && this.pUser[u];
    const qc = c && this.qCourse[c];

    const dot = (pu && qc) ? pu.reduce((sum, val, k) => sum + val * qc[k], 0) : 0;
    return Math.min(Math.max(this.mu + bu + bc + dot, 1.0), 5.0);
  }
}
