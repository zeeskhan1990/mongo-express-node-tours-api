const fs = require('fs');
const Tour = require("./../models/tourModel")

exports.getAllTours = async (req, res) => {
  console.log(req.requestTime);
  console.log(req.query)

  /* Removing restricted keys which are not actually query conditions */
  let queryObject = {...req.query}
  const excludedFields = ['page', 'sort', 'limit', 'fields']
  excludedFields.forEach((currentField) => {
    delete queryObject[currentField]
  })

  /* This steps are to add $ before any condition matcher like gte, etc. 
  the query String is like ?duration[gte]=5&difficulty=easy */
  let queryStr = JSON.stringify(queryObject)
  queryStr = queryStr.replace(/\b(gte|lte|lt|gt)\b/g, match => `$${match}`)
  queryObject = JSON.parse(queryStr)
  console.log(queryObject)
  
  /* If we directly await here then we can't chain further methods, build query here     */
  let query = Tour.find(queryObject)  

  /* Sorting, sort=price -> sorts by the price field (default ascending), sort=-price(descending)
  split multiple sort fields -> .sort({price ratingsAverage}) [the actual mongoose function] */
  if(req.query.sort) {    
    const sortBy = req.query.sort.split(',').join(' ')
    query = query.sort(sortBy)
  } else {
    //default sort can be added
    query = query.sort('-createdAt')
  }

  /* projection */
  if(req.query.fields) {
    const fields = req.query.fields.split(',').join(' ')
    query = query.select(fields)
  } else {
    //Default, remove mongoose field
    query.select('-__v')
  }

  /* pagination,?page=2&limit=10, get me page 2 and 10 results, that means skip first page. */
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 100
  query = query.skip((page - 1)*limit).limit(limit)
  if(req.query.page) {
    const numTours = await Tour.countDocuments()
    if(skip >= numTours)
      throw new Error('No page exists')
  }



  try {
    /* const query = await Tour.find().where('duration').equals(5).where('difficulty').equals(5) */
    //execute query here
    const tours = await query
    res.status(200).json({
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
  req.query.fields = "name,price, ratingsAverage,summary,difficulty"
  next()
}


/* const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
); */

/* exports.checkID = (req, res, next, val) => {
  console.log(`Tour id is: ${val}`);

  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID'
    });
  }
  next();
}; */