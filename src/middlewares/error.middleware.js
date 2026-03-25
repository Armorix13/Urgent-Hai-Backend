/**
 * Error handler middleware to handle and format different types of errors.
 * @param {Error} err - The error object.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {function} next - The next middleware function.
 */
function isMongoConnectionError(err) {
    if (!err || typeof err !== "object") return false;
    const name = err.name || "";
    const msg = (err.message || "").toLowerCase();
    return (
        name === "MongoServerSelectionError" ||
        name === "MongoNetworkError" ||
        name === "MongoTimeoutError" ||
        msg.includes("server selection timed out") ||
        msg.includes("econnrefused") ||
        msg.includes("enotfound") ||
        msg.includes("querysrv")
    );
}

function errorHandler(err, req, res, next) {
    switch (true) {
        case typeof err === 'object' && isMongoConnectionError(err):
            return res.status(503).json({
                status: 503,
                message:
                    "Database connection failed. On Atlas: Network Access → allow 0.0.0.0/0 (or Render IPs). Verify MONGO_URI on the server matches Atlas (not localhost).",
                data: null,
            });
        case typeof err === 'string':
            // Custom application error
            const is404 = err.toLowerCase().endsWith('not found');
            const statusCode = is404 ? 404 : 400;
            return res.status(statusCode).json({ status: statusCode, message: err.message, data: null });
        case typeof err === 'object' && err.name === 'CastError':
            // Mongoose CastError (e.g., invalid ObjectId)
            return res.status(404).json({ status: 404, message: 'Not Found', data: null });
        case typeof err === 'object' && err.message.toLowerCase().endsWith('jwt expired'):
            // JWT token expired error
            return res.status(401).json({ status: 401, message: err.message, data: null });
        case typeof err === 'object':
            // Other custom object-based error
            const value = err.message.toLowerCase().endsWith('not found');
            const code = value ? 404 : 400;
            return res.status(code).json({ status: code, message: err.message, data: null });
        case err.name === 'UnauthorizedError':
            // JWT authentication error
            return res.status(401).json({ status: 401, message: 'Unauthorized', data: null });
        default:
            // Default error handling (internal server error)
            return res.status(500).json({ status: 500, message: err.message, data: null });
    }
}

export default errorHandler;