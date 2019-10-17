const mongoose = require('mongoose')
const Tour = require('./tourModel')

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review cannot be empty'],
        maxlength: [500, 'Must be less than 500 characters']
        //validate: [validator.isAlpha, 'Must only contain characters']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        //Mongoose will convert the milliseconds to date
        default: Date.now(),
        //Never project in output
        select: false
    },
    user: {
        //Specifying that it would be of type Id
        type: mongoose.Schema.Types.ObjectId,
        //The model to where it should refer to
        ref: 'User',
        required: [true, 'Review must have an author']
    },
    tour: {
        //Specifying that it would be of type Id
        type: mongoose.Schema.Types.ObjectId,
        //The model to where it should refer to
        ref: 'Tour',
        required: [true, 'Review must belong to a tour']
    }
}, {
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
})

/* reviewSchema.virtual('durationInWeeks').get(function() {
    return this.duration/7
}) */

reviewSchema.pre(/^find/, function (next) {
    this
        /* .populate({
                path: 'tour',
                select: 'name'
            }) */
        .populate({
            path: 'user',
            select: 'name photo'
        })
    next()
})

reviewSchema.statics.calcAverageRatings = async function (tourId) {
    //'this' inside a static method is the model itself and not the current document of the model
    const stats = await this.aggregate([{
            $match: {
                tour: tourId
            }
        },
        {
            $group: {
                _id: '$tour',
                numRatings: {
                    $sum: 1
                },
                avgRating: {
                    $avg: '$rating'
                },
            }
        }
    ])
    console.log(stats)
    if(stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: stats[0].avgRating, ratingsQuantity: stats[0].numRatings
        })
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: 4.5, ratingsQuantity: 0
        })
    }    
}

reviewSchema.index({tour:1, user:-1}, { unique: true })

reviewSchema.post('save', function() {
    //Can't use 'Review' here directly as it's not defined, so should use this.constructor which points to model of current doc
    this.constructor.calcAverageRatings(this.tour)
})

//For update&delete we use findByIdAndUpdate and findByIdAndDelete,
//There we have access to the query middleware, and not current document middleware
reviewSchema.pre(/^findOneAnd/, async function(next) {
    //'this' is the query here
    //Save the doc on the query object itself so that it can be used in the post hook
    this.doc = await this.findOne()
    console.log(this.doc)
})

reviewSchema.post(/^findOneAnd/, async function(next) {
    await this.doc.constructor.calcAverageRatings(this.doc.tour)
})


const Review = mongoose.model('Review', reviewSchema)

module.exports = Review