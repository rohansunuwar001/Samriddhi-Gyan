// video-server/src/core/BaseService.js
import EventEmitter from 'events';

export class BaseService extends EventEmitter {
  constructor(serviceName = 'BaseService') {
    super();
    this.serviceName = serviceName;
  }

  log(message, ...args) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.serviceName}] ${message}`, ...args);
  }

  warn(message, ...args) {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [${this.serviceName}] WARN: ${message}`, ...args);
  }

  error(message, ...args) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [${this.serviceName}] ERROR: ${message}`, ...args);
  }

  async executeWithTimer(operationName, fn) {
    const start = Date.now();
    this.log(`Starting: ${operationName}`);
    try {
      const result = await fn();
      const elapsed = ((Date.now() - start) / 1000).toFixed(2);
      this.log(`Completed: ${operationName} in ${elapsed}s`);
      return result;
    } catch (err) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(2);
      this.error(`Failed: ${operationName} after ${elapsed}s: ${err.message}`);
      throw err;
    }
  }
}

export default BaseService;
