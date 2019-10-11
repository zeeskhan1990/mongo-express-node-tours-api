const fs = require('fs');
const Tour = require("./../models/tourModel")

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



exports.getAllTours = async (req, res) => {
  console.log(req.requestTime);
  console.log(req.query)
  let queryObject = {...req.query}
  //Removing restricted keys which are not actually query conditions
  const excludedFields = ['page', 'sort', 'limit', 'fields']
  excludedFields.forEach((currentField) => {
    delete queryObject[currentField]
  })
  try {    
    const tours = await Tour.find(queryObject)
    /* const tours = await Tour.find().where('duration').equals(5).where('difficulty').equals(5) */
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
