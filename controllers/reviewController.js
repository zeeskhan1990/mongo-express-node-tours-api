const Review = require("./../models/reviewModel")
const factory = require('./handlerFactory')

//Used During creating Reviews from nested Tour
exports.setTourUserIds = (req, res, next) => {
    if(!req.body.tour) req.body.tour = req.params.tourId
    req.body.user = req.user.id
    next()
}

//Used During getting all Reviews for a nested Tour
exports.setTourFilter = (req, res, next) => {
    if(req.params.tourId) {
        let clonedQuery = {...req.query}
        clonedQuery.tour = req.params.tourId
        req.query = clonedQuery
    }
    next()
}

exports.getAllReviews = factory.getAll(Review)
exports.getReview = factory.getOne(Review)
exports.createReview = factory.createOne(Review)
exports.updateReview = factory.updateOne(Review)
exports.deleteReview = factory.deleteOne(Review)
