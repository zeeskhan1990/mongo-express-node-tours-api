const mongoose = require('mongoose')
const slugify = require('slugify')
const validator = require('validator')
const User = require('./userModel')

const tourSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'A tour mmust have a name'],
      unique: true,
      maxlength: [40, 'Must be less than 40']
      //validate: [validator.isAlpha, 'Must only contain characters']
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
      default: 1,
      min: [1, 'Must be at least 1'],
      max: [5, 'Must be at max 5'],
      set: (val) => Math.round(val*10) / 10
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
    },
    startLocation: {
      //A GeoJson must have at least two fields one being nested type, it maybe a point, line, polygon, etc, and the other coordinates
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      //co-ordinates of the point with long, lat
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        //co-ordinates of the point with long, lat
        coordinates: [Number],
        address: String,
        description: String
      }
    ],
    guides: [
      {
        //Specifying that it would be of type Id
        type: mongoose.Schema.Types.ObjectId,
        //The model to where it should refer to
        ref: 'User'
      }
    ]
    //A sample property declaration whose value is an object itself
    /* ,
    testObj: {
      propin: {
        type: String,
        default: 'hello'
      },
      propout: {
        type: Number,
        default: 10
      }
    } */
  },
  //Explicitly declaring that virtuals should be part of every output 
  {
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    }
  })

  /* A single field index, an index having reference to a single field, to be used when a single field is read frequently
  1 means sorting the price index in ascending manner, -1 descending */
  //tourSchema.index({price: 1})

  //A compound index, an index having reference to muliple fields usually read together. 
  //Would also work when one of the fields are read individually
  tourSchema.index({price: 1, ratingsAverage: -1})
  tourSchema.index({slug: 1})

  //startLocation to be indexed to a 2dsphere where real earth points are located
  tourSchema.index({startLocation: '2dsphere'})

  //Virtual Properties, will be created every time during a fetch.Arrow function isn't used because
  //the 'this' inside it should refer to the document in scope at runtime, and shouldn't be bound earlier
  tourSchema.virtual('durationInWeeks').get(function() {
    return this.duration/7
  })

  tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
  })

  //Document middlware - runs before .save() & .create() but not before .insertMany()
  tourSchema.pre('save', function(next) {
    //'this' is the current document being processed
    console.log(this)
    this.slug = slugify(this.name, {lower: true})
    next()
  })

  //If you want to embed users in tours directly instead of referencing
  /* tourSchema.pre('save', async function(next) {
    const guidesPromises = this.guides.map(async userId => {
      return await User.findById(userId)
    })
    this.guides = await Promise.all(guidesPromises)
    next()
  }) */

  tourSchema.post('save', function(doc, next) {
    //'this' is the current document being processed
    console.log(doc)
    next()
  })

  //Query Middleware -> for all queries starting with find such as find, findOne, etc
  tourSchema.pre(/^find/, function(next) {
    this.startExecution = Date.now()
    //'this' is the current query object which is intercepted just before execution, secret Tours only for VIP
    //The find here returns the query object which would finally be executed
    console.log(this) 
    this.find({ secretTour: {$ne: true}})
    next()
  })

  //populate replaces the userIds in 'guides' fields with the corresponding user documents
  tourSchema.pre(/^find/, function(next) {
    this.populate({path:'guides', select: '-__v -passwordChangedAt'})
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
    //Do this only if the first aggregator in the pipeline is not geoNear since it mandatorily must be the first one
    if(!this.pipeline()[0]["$geoNear"]) {
      //Adding another stage at the start
      this.pipeline().push({
        $match: { secretTour: { $ne: true} } 
      })
    }    
    next()
  })


  const Tour = mongoose.model('Tour', tourSchema)

  module.exports = Tour

  /**
   * There are middlewares in mongoose. They are like pre & post hooks, for example
   * a pre-save and post-save document hook/middleware. There are four types of middleware:
   * Document, Query, Aggregate, Model
   */