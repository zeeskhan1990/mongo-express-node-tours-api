const fs = require('fs');
const Tour = require("./../models/tourModel")
const APIFeatures = require("../utils/apiFeatures")


exports.getAllTours = async (req, res) => {
  console.log(req.requestTime);
  console.log(req.query)

  try {
    //execute query here
    const features = new APIFeatures(Tour.find(), req.query)

    //Setup the query fields
    features
    .filter()
    .sort()
    .select()
    .paginate()

    const tours = await features.query
    res.status(201).json({
      status: 'success',
      requestedAt: req.requestTime,
      results: tours.length,
      data: {
        tours
      }
    });
  } catch(err) {
    res.status(404).json({
      status: 'fail',
      message: err
    })
  }
};

exports.getTour = async (req, res) => {
  console.log(req.requestTime);
  try {
    //Tour.findOne({_id: req.param.id})    
    const tour = await Tour.findById(req.params.id)
    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    });
  } catch(err) {
    res.status(404).json({
      status: 'fail',
      message: err
    })
  }
};

exports.createTour = async (req, res) => {
  try {    
    const newTour = await Tour.create(req.body)
    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour
      }
    });
  } catch (err) {
    console.log(err)
    res.status(400).json({
      status: 'fail',
      message: err
    })
  }

};

exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    });

  } catch(err) {
    console.log(err)
    res.status(400).json({
      status: 'fail',
      message: err
    })
  }
  
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id)
    res.status(204).json({
      status: 'success',
      data: null
    });

  } catch(err) {
    console.log(err)
    res.status(400).json({
      status: 'fail',
      message: err
    })
  }
};

exports.aliasTopTours = async (req, res, next) => {
  req.query.limit = '5'
  req.query.sort = "-ratingsAverage,price"
  req.query.fields = "name,price,ratingsAverage,summary,difficulty"
  next()
}

exports.getTourStats = async (req, res) => {
  try {
    //.find returns a query object, .aggregate returns an aggregate object, when used with await it runs and returns result
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: {$gte: 4.5} }
      }, 
      {
        $group: {
          //group by none here, so that means apply the accummulator over the complete set of docs
          //_id: null,
          _id: '$difficulty',
          //_id: {$toUpper: '$difficulty'}
          //For each of the document in this 'group' it's gonna add 1 to numOfTours counter
          numOfTours: {$sum: 1},
          numRatings: {$sum: '$ratingsQuantity'},
          avgRating: {$avg: '$ratingsAverage'},
          avgPrice: {$avg: '$price'},
          minPrice: {$min: '$price'},
          maxPrice: {$max: '$price'},
        }
      },
      {
        //you can only sort by the keys mentioned above as they would be the result document, 1 for ascending
        $sort: { avgPrice: 1}
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

  } catch(err) {
    console.log(err)
    res.status(400).json({
      status: 'fail',
      message: err
    })
  }
}

exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = parseInt(req.params.year)
    const plan = await Tour.aggregate([
      {
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
          _id: {$month: '$startDates'},
          numOfTours: {$sum: 1},
          tours: { $push: '$name'}
        }
      },
      {
        $addFields: { month: '$_id'}
      },
      {
        $project: {
          _id: 0
        }
      },
      {
        $sort: {numOfTours: -1}
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
  } catch(err) {
    console.log(err)
    res.status(400).json({
      status: 'fail',
      message: err
    })
  }
}


/* const query = await Tour.find().where('duration').equals(5).where('difficulty').equals(5) */