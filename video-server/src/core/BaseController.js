// video-server/src/core/BaseController.js

export class BaseController {
  constructor(controllerName = 'BaseController') {
    this.controllerName = controllerName;
  }

  sendSuccess(res, data = {}, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      ...data,
    });
  }

  sendError(res, error, statusCode = 500) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${this.controllerName}] HTTP ${statusCode}: ${message}`);
    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
}

export default BaseController;
