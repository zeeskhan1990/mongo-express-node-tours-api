const fs = require('fs');
const Tour = require("./../models/tourModel")
const QueryBuilder = require("../utils/queryBuilder")
const catchAsync = require("./../utils/catchAsync")
const AppError = require('./../utils/appError')
const factory = require('./handlerFactory')

exports.getAllTours = factory.getAll(Tour)
exports.getTour = factory.getOne(Tour, {
  path: 'reviews'
})
exports.createTour = factory.createOne(Tour)
exports.updateTour = factory.updateOne(Tour)
exports.deleteTour = factory.deleteOne(Tour)

exports.getTourStats = catchAsync(async (req, res, next) => {
  //.find returns a query object, .aggregate returns an aggregate object, when used with await it runs and returns result
  const stats = await Tour.aggregate([{
      $match: {
        ratingsAverage: {
          $gte: 4.5
        }
      }
    },
    {
      $group: {
        //group by none here, so that means apply the accummulator over the complete set of docs
        //_id: null,
        _id: '$difficulty',
        //_id: {$toUpper: '$difficulty'}
        //For each of the document in this 'group' it's gonna add 1 to numOfTours counter
        numOfTours: {
          $sum: 1
        },
        numRatings: {
          $sum: '$ratingsQuantity'
        },
        avgRating: {
          $avg: '$ratingsAverage'
        },
        avgPrice: {
          $avg: '$price'
        },
        minPrice: {
          $min: '$price'
        },
        maxPrice: {
          $max: '$price'
        },
      }
    },
    {
      //you can only sort by the keys mentioned above as they would be the result document, 1 for ascending
      $sort: {
        avgPrice: 1
      }
    },
    /* {
      $match: {_id: {$ne: 'easy'}}
    } */
  ])

  res.status(201).json({
    status: 'success',
    data: {
      stats
    }
  });
})

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = parseInt(req.params.year)
  const plan = await Tour.aggregate([{
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: {
          $month: '$startDates'
        },
        numOfTours: {
          $sum: 1
        },
        tours: {
          $push: '$name'
        }
      }
    },
    {
      $addFields: {
        month: '$_id'
      }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: {
        numOfTours: -1
      }
    },
    {
      $limit: 6
    }
  ])
  res.status(201).json({
    status: 'success',
    data: {
      plan
    }
  });
})

exports.aliasTopTours = async (req, res, next) => {
  req.query.limit = '5'
  req.query.sort = "-ratingsAverage,price"
  req.query.fields = "name,price,ratingsAverage,summary,difficulty"
  next()
}

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const {
    distance,
    latlng,
    unit
  } = req.params
  const [lat, lng] = latlng.split(',')
  //To get the radian you need to divide your distance by radius of the earth
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1
  if (!lat || !lng)
    next(new AppError("Please provide lat lng", 400))
  //geoWithin - Finds documents within a certain geometry.
  //Here we want to find inside of a sphere with center being latlng and radius being distance
  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [
          [lng, lat],
          radius
        ]
      }
    }
  })

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  })
})

exports.getDistances = catchAsync(async (req, res, next) => {
  const {
    latlng,
    unit
  } = req.params
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001
  const [lat, lng] = latlng.split(',')
  if (!lat || !lng)
    next(new AppError("Please provide lat lng", 400))
  
  const distances = await Tour.aggregate([
    {
      //geoNear - requires at least one of it's fields contains geoSpatial Index.
      //And if only one field with geoSpatial index is provided then that is used to calculate the distance from to this 'near' point
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        //name of the field where all the distances would be stored
        distanceField: 'distance',
        //By default distance in meters, converting it to km
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ])

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  })

})


/* const query = await Tour.find().where('duration').equals(5).where('difficulty').equals(5) */