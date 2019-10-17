//const {promisify} = require('util')
const crypto = require('crypto')
const catchAsync = require('./../utils/catchAsync')
const User = require('./../models/userModel')
const jwt = require('jsonwebtoken')
const AppError = require('./../utils/appError')
const sendEmail = require('./../utils/email')

const signToken = (id) => {
    return jwt.sign({
        id
    }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}

const createAndSendToken = (user, statusCode, res) => {
    const token = signToken(user._id)
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN*24*60*60*1000),
        //send only over https
        secure: process.env.NODE_ENV === 'production' ? true: false,
        //Cannot be accessed or modified by the browser directly, prevents cross-site scripting attacks
        //Browser would only receive and send it with every request later to the server
        httpOnly: true
    }
    //Remove password from output
    user.password = undefined

    res.cookie('jwt', token, cookieOptions)
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
}

exports.signUp = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        role: req.body.role
    });

    createAndSendToken(newUser, 201, res)
})

exports.login = catchAsync(async (req, res, next) => {
    const email = req.body.email
    const password = req.body.password

    if (!email || !password) {
        //If you do not 'return' then it tries to continue to set response even after error
        return next(new AppError('Email or password is missing', 400))
    }

    //By default password field is not present in output as it's marked {select: false} in the model
    //But you can explicitly ask for it using the select method with a + sign since it's absent by default
    const user = await User.findOne({
        email: email
    }).select('+password')

    if (!user || !await user.isMatchingPassword(password, user.password)) {
        return next(new AppError('Incorrect email or password', 401))
    }
    console.log(user)
    createAndSendToken(user, 200, res)
})

exports.protect = catchAsync(async (req, res, next) => {
    /**
     * Check if token exists
     * Verify token
     * Check if user still exists
     * Check is user changed pwd after the token was issued
     */
    let token
    const authorizationHeader = req.headers.authorization
    if (authorizationHeader && authorizationHeader.startsWith('Bearer '))
        token = authorizationHeader.split(' ')[1]
    if (!token)
        return next(new AppError('You must be logged in to access this', 401))

    //If there's an error in verification here it would thrown an error handled by catchAsync
    //which in turn would invoke next(err), thus invoking globalErrorHandler and in there a couple
    //of jwt verification error conditions are explicitly handled
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET)
    const currentUser = await User.findById(decodedToken.id)
    if (!currentUser)
        return next(new AppError("The user doesn't exist anymore", 401))
    if (currentUser.isPasswordChanged(decodedToken.iat))
        return next(new AppError('User password changed, please login again', 401))

    req.user = currentUser
    next()
})

//The current user object saved in 'req' in the previous protect middleware is fetched here to check the user's assigned role(s)
exports.restrictTo = function (...roles) {
    return async (req, res, next) => {
        //Check if the current user has one of the allowed roles
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to access this', 403))
        }
        next()
    }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
    /**
     * Check if user exists
     * Create random token based on userId
     * Send the token to user's email
     */
    const user = await User.findOne({
        email: req.body.email
    })
    if (!user)
        next(new AppError('No user with that email', 404))

    //This steps saves the resetPasswordToken and expires
    const resetToken = user.createPasswordResetToken()

    //On user save, the required fields needs to be provided but we only want to save a couple of fields, hence canceling validation
    await user.save({
        validateBeforeSave: false
    })
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`
    const message = `Forgot your password? Submit a new request with your new password and passwordConfirm to ${resetUrl}`

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token. Valid only for 10 minutes!',
            text: message
        })
    } catch (err) {
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        await user.save({
            validateBeforeSave: false
        })
        return next(new AppError('Error sending password reset email', 500))
    }

    res.status(200).json({
        status: 'success',
        message: 'Token sent to email!'
    })
})

exports.resetPassword = catchAsync(async (req, res, next) => {
    /**
     * Get user based on the token
     * Check if token expired already
     * Update changedPasswordAt
     * Log the user in, send JWT
     */
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
    const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires: {$gt: Date.now()}})
    if(!user)
        return next(new AppError('Token is invalid or expired', 400))
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    createAndSendToken(user, 200, res)
})

//For logged-in users, protected route
exports.updatePassword = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password')
    //passwordCurrent is the current user pwd re-entered by the end user
    if(!(await user.isMatchingPassword(req.body.passwordCurrent, user.password)))
        return next(new AppError('Your current password doesnt match', 401))
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    //Reminder - findByIdAndUpdate won't work because validators and pre-save hooks encrypting pwd won't run 
    await user.save()
    createAndSendToken(user, 200, res)
})