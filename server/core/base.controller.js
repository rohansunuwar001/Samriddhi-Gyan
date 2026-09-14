// server/core/base.controller.js

export class BaseController {
  /**
   * Send a standardized success HTTP response.
   */
  sendSuccess(res, data = {}, message = "Success", statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      ...(typeof data === "object" && data !== null && !Array.isArray(data) ? data : { data }),
    });
  }

  /**
   * Send a standardized error HTTP response.
   */
  sendError(res, message = "An error occurred", statusCode = 500, errors = null) {
    const response = {
      success: false,
      message,
    };
    if (errors) response.errors = errors;
    return res.status(statusCode).json(response);
  }

  /**
   * Higher-order function wrapper to catch async errors and pass to express error handler middleware.
   */
  catchAsync(fn) {
    return (req, res, next) => {
      Promise.resolve(fn.call(this, req, res, next)).catch((err) => {
        const statusCode = err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        return this.sendError(res, message, statusCode);
      });
    };
  }
}
