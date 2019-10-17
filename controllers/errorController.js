const AppError = require('./../utils/appError')

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack
  })
}

const sendErrorProd = (err, res) => {
  //Operational errors derived from handled scenarios
  if(err.isOperational)
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    })
  else {
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    })
  }  
}

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value }`
  //Bad request, hence 400
  return new AppError(message, 400)
}

const handleDuplicateFieldsDB = (err) => {
  const message = `Duplicate Field Value, unique constraint violation`
  return new AppError(message, 400)
}

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(currentError => currentError.message)
  const message = `Invalid Input Data ${errors.join('. ')}`
  return new AppError(message, 400)
}

const handleJWTError = () => {
  return new AppError('Invalid Token', 401)
}

const handleTokenExpiredError = () => {
  return new AppError('Your token has expired, please login again!', 401)
}

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500
    err.status = err.status || 'error'

    if (process.env.NODE_ENV === 'development') {
      sendErrorDev(err, res)
    } else if (process.env.NODE_ENV === 'production') {
      let error = {...err}
      if(error.name === 'CastError') {
        error =   handleCastErrorDB(error)
      } else if(error.name === 'ValidationError') {
        error = handleValidationErrorDB(error)
      } else if(error.code === 11000) {
        error = handleDuplicateFieldsDB(error)  //unique violation
      } else if(error.name === 'JsonWebTokenError') {
        error = handleJWTError()
      } else if(error.name === 'TokenExpiredError') {
        error = handleTokenExpiredError()
      }
        
      sendErrorProd(error, res)
    }
  }