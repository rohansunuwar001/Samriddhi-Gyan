export class SVD {
  constructor(latentFactors = 5, learningRate = 0.05, regularization = 0.02, epochs = 25) {
    this.latentFactors = latentFactors;
    this.learningRate = learningRate;
    this.regularization = regularization;
    this.epochs = epochs;

    this.mu = 0;
    this.bUser = {};
    this.bCourse = {};
    this.pUser = {};
    this.qCourse = {};
  }

  train(ratings) {
    if (!Array.isArray(ratings) || ratings.length === 0) {
      this.mu = 4.0;
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

    for (let epoch = 0; epoch < this.epochs; epoch++) {
      ratings.forEach(({ userId, courseId, rating }) => {
        const u = userId.toString();
        const c = courseId.toString();

        const bu = this.bUser[u] ?? 0;
        const bc = this.bCourse[c] ?? 0;
        const pu = this.pUser[u] ?? Array(this.latentFactors).fill(0);
        const qc = this.qCourse[c] ?? Array(this.latentFactors).fill(0);

        let dot = 0;
        for (let k = 0; k < this.latentFactors; k++) {
          dot += pu[k] * qc[k];
        }
        const prediction = this.mu + bu + bc + dot;
        const error = rating - prediction;

        this.bUser[u] = bu + this.learningRate * (error - this.regularization * bu);
        this.bCourse[c] = bc + this.learningRate * (error - this.regularization * bc);

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
