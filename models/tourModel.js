const mongoose = require('mongoose')
const slugify = require('slugify')
const validator = require('validator')

const tourSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'A tour mmust have a name'],
      unique: true,
      maxlength: [40, 'Must be less than 40']
      //validate: [validator.isAlpha, 'Must only contain characters']
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
      required: [true, 'Difficulty is required'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Must be one of 3'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 0,
      min: [1, 'must be at least 1'],
      max: [5, 'cannot be more than 5']
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          // Returns true or false as per validity, `this` ONLY points to current doc on NEW document creation
          // Refer - https://mongoosejs.com/docs/validation.html#update-validators-and-this 
          return val < this.price
        },
        //{VALUE} is provided by mongoose at runtime
        message: 'Discount price {VALUE} cannot be more than price itself'
      }
    },
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
      default: Date.now(),
      //Never project in output
      select: false
    },
    startDates: [Date],
    slug: String,
    secretTour: {
      type: Boolean,
      default: false
    }
  },
  //options to explicitly declare that virtuals should be part of the output 
  {
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    }
  })

  //Virtual Properties, will be created every time during a fetch
  //Arrow function isn't used because the 'this' inside it should refer to the document in scope at runtime,
  //and shouldn't be bound earlier
  tourSchema.virtual('durationInWeeks').get(function() {
    return this.duration/7
  })

  //Document middlware - runs before .save() & .create() but not before .insertMany()
  tourSchema.pre('save', function(next) {
    //'this' is the current document being processed
    console.log(this)
    this.slug = slugify(this.name, {lower: true})
    next()
  })

  tourSchema.post('save', function(doc, next) {
    //'this' is the current document being processed
    console.log(doc)
    next()
  })

  //Query Middleware -> for all queries starting with find such as find, findOne, etc
  tourSchema.pre(/^find/, function(next) {
    this.startExecution = Date.now()
    //'this' is the current query object which is interecepted just before execution, secret Tours only for VIP
    //The find here returns the query object which would finally be executed
    console.log(this) 
    this.find({ secretTour: {$ne: true}})
    next()
  })

  tourSchema.post(/^find/, function(docs, next) {
    console.log(Date.now() - this.startExecution)
    console.log(docs)
    next()
  })

  //Aggregation middleware
  tourSchema.pre('aggregate', function(next) {
    //this.pipeline() returns the aggregation array object
    console.log(this.pipeline())
    //Adding another stage at the start
    this.pipeline().push({
      $match: { secretTour: { $ne: true} } 
    })
    next()
  })


  const Tour = mongoose.model('Tour', tourSchema)

  module.exports = Tour

  /**
   * There are middlewares in mongoose. They are like pre & post hooks, for example
   * a pre-save and post-save document hook/middleware. There are four types of middleware:
   * Document, Query, Aggregate, Model
   */