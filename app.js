const express = require('express');
const morgan = require('morgan');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')

const app = express();

// 1) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  console.log('Hello from the middleware 👋');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//To handle unknown routes with any http verb, this block would only be executed if any of the above 
//mentioned request handler url didn't match
app.all('*', (req, res, next) => {
  
  //The momenet when next is called in a request handler (middleware) with an argument, it directly
  //skips all other middlewares and invokes the global error handler middleware directly with that error object
  next(new AppError(`Can't find ${req.originalUrl}`, 404))
})

//If express finds a middleware with FOUR arguments it automatically registers it as an error
//handling middleware, and only calls it when an error happens
app.use(globalErrorHandler)

module.exports = app;