const mongoose = require('mongoose')

const tourSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'A tour mmust have a name'],
      unique: true
    },
    rating: {
      type: Number,
      default: 4.5
    },
    price: {
      type: Number,
      required: [true, 'No price mentioned']
    },
    duration: {
      type: Number,
      required:[true, 'No duration mentioned']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'No group size']
    },
    difficulty: {
      type: String,
      required: [true, 'Difficulty is required']
    },
    ratingsAverage: {
      type: Number,
      default: 0
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    priceDiscount: Number,
    summary: {
      type: String,
      trim: true,
      required: [true, 'Must summary']
    },
    desctiption: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'Must cover image']
    },
    //An array of string
    images: [String],
    createdAt: {
      type: Date,
      //Mongoose will convert the milliseconds to date
      default: Date.now()
    },
    startDate: [Date]
  })

  const Tour = mongoose.model('Tour', tourSchema)

  module.exports = Tour