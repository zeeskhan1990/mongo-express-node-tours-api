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
    }
  })

  const Tour = mongoose.model('Tour', tourSchema)

  module.exports = Tour