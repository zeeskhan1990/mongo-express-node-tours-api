const catchAsync = require("./../utils/catchAsync")
const QueryBuilder = require("../utils/queryBuilder")
const User = require("./../models/userModel")
const AppError = require('./../utils/appError')
const factory = require('./handlerFactory')

const filterObj = (obj, ...allowedFields) => {
  const newObj = {}
  Object.keys(obj).forEach(currentPropertyKey => {
    if(allowedFields.includes(currentPropertyKey))
      newObj[currentPropertyKey] = obj[currentPropertyKey] 
  })
  return newObj
}

//middleware to inject userId before calling getUser
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id
  next()
}

exports.updateMe = catchAsync(async (req, res, next) => {
  //Create error if trying to update password
  if(req.body.password || req.body.passwordConfirm) {
    return next(new AppError('Cannot update password through this route', 400))
  }
  //Only allow updates of selected fields
  const filteredBody = filterObj(req.body, 'name', 'email')
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  })
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  })
})

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, {active: false})
  res.status(204).json({
    status: 'success',
    data: null
  })
})

exports.getAllUsers = factory.getAll(User)
exports.getUser = factory.getOne(User)
//exports.createUser = factory.createOne(User) // Refer to /signup
exports.updateUser = factory.updateOne(User)
exports.deleteUser = factory.deleteOne(User)
