const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes')
const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')

const app = express();

//Set Security HTTP headers
app.use(helmet())

//It would allow at max 100 requests in an hour from a particular IP, else message
const limiter = rateLimit({
  max: 100,
  windowMs: 60*60*1000,
  message: 'Too many requests, try again in an hour'
})
app.use('/api', limiter)

//Development Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Body parser, reading data from body into req.body, max 10kb data accpeted
app.use(express.json({
  limit: '10kb'
}));

//Data Sanitization against NoSQL query injection [If you provide an email as "email": {"$gt": ""} in the email request body]
// and just give an existing password, it would log you in to the first user account it finds with that password. This is because
//"email": {"$gt": ""} is always true, and it returns all the users, so the email matches for all users by default.
//This middleware looks at request query, body and param and removes all $ and . signs
app.use(mongoSanitize())

//Data Sanitization against XSS, will remove any js code from html snippet, and would convert html markup to entities(< converted &lt;)
app.use(xss())

//Prevent paramter pollution [It removes multiple same query keys from the request and only allows in the last one]
app.use(hpp({
  whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price']
}))

//Serving static files
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
app.use('/api/v1/reviews', reviewRouter);

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