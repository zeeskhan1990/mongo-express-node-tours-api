const mongoose = require('mongoose')
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)

mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true
}).then(con => {
  console.log(con.connections)
})

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

//Node emits this event whenever there's an error which has not been handled anywhere, example - DB connnection fail
process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION!')
  console.log(err.name, err.message)
  server.close(() => {
    process.exit(1)
  })
})

//Should be declared at the top of the file
process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION!')
  console.log(err.name, err.message)
  server.close(() => {
    process.exit(1)
  })
})
