const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

//By default each router has access to only their specific routes. This preserves the req.params values from the parent router.
const router = express.Router({mergeParams: true});

//The only way to get reviews for an external user is by accessing the tour/:tourId url. This direct review access is protected.
router.use(authController.protect)

//For tour/:tourId/reviews - route('/') by default won't have access to tourId, mergeParams solves this
router
    .route('/')
    .get(reviewController.setTourFilter, reviewController.getAllReviews)
    .post(authController.restrictTo('customer'), reviewController.setTourUserIds, reviewController.createReview);

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(authController.restrictTo('admin', 'customer'),reviewController.updateReview)
  .delete(authController.restrictTo('admin', 'customer'),reviewController.deleteReview);

module.exports = router;