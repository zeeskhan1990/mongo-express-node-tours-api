class AppError extends Error {
    constructor(message, statusCode) {
        super(message)
        this.statusCode = statusCode
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
        //flag to check if a known possible error
        this.isOperational = true
        Error.captureStackTrace(this, this.constructor)
    }
}

module.exports = AppError