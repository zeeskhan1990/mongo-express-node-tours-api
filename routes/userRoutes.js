const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signUp)
router.post('/login', authController.login)
router.post('/forgotPassword', authController.forgotPassword)
router.patch('/resetPassword/:token', authController.resetPassword)
router.patch('/updatePassword', authController.updatePassword)

/* 
'router' here is kind of like a mini 'app', and like an app we can use a middleware here itself
If the request is not to any of the above urls, then for the following ones, an user has to be authenticated
So before accessing those urls, we would run a check for if user authenticated, and only then would go on to match the request urls
Middleware runs in sequence, all the above http methods are also middleware. Once they are run, next this one would run. 
*/
router.use(authController.protect)

router.get('/me', userController.getMe, userController.getUser)
router.patch('/updateMe', userController.updateMe)
router.delete('/deleteMe', userController.deleteMe)

//Restrict to admin only
router.use(authController.restrictTo('admin'))

router
  .route('/')
  .get(userController.getAllUsers)
router
  .route('/:id')
  .get( userController.getUser)
  .patch( userController.updateUser)
  .delete( userController.deleteUser);

module.exports = router;
