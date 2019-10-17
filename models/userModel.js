const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required!']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    photo: String,
    role: {
        type: String,
        enum: ['customer', 'guide', 'lead-guide', 'admin'],
        default: 'customer'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        //The field won't be part of a query result
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            // This only works on CREATE and SAVE!!!
            validator: function (el) {
                return el === this.password;
            },
            message: 'Passwords are not the same!'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

userSchema.pre('save', async function (next) {
    //MongooseDocument.isModified
    if (!this.isModified('password'))
        return next()
    this.password = await bcrypt.hash(this.password, 12)

    //No need to set passwordConfirm to database, only required for validation
    //Being marked as 'required' means it's a required input during creation, not for persistence in db
    this.passwordConfirm = undefined
    next()
})

//To automatically update the passwordChangedAt timestamp whenever there is an actual modification to it just before save
userSchema.pre('save', function(next) {
    if (!this.isModified('password') || this.isNew)
        return next()
    //Sometimes, the token gets created even before this line executes, thus always it would be that password has been 
    //changed after the jwt token been created. To counter that a simple hack is to save a timestamp 1 second earlier.
    this.passwordChangedAt = Date.now() - 1000
    next()
})

//Defining an instance method, so therefore it is available in all the user 'documents' and not on the Model itself
userSchema.methods.isMatchingPassword = async function(candidatePassword, userPassword) {
    //this.password not available beccause select: false on password definition
    //candidatePassword not hashed coming as userInput, userPassword retrieved from db against a particular user
    return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.isPasswordChanged = function(JWTTimesatmp) {
    if(this.passwordChangedAt) {
        const changedAtTimestamp = parseInt(this.passwordChangedAt.getTime()/1000, 10)
        return changedAtTimestamp > JWTTimesatmp 
    }
    //false means not changed after issue of JWT
    return false
}

userSchema.methods.createPasswordResetToken = function() {
    //This token is what we are going to send to the user, this is a key to your account so we should
    //also store it encrypted in the db
    const resetToken = crypto.randomBytes(32).toString('hex')

    //Create a hash using sha256 and then encrypt the resetToken using it and store the value as a hex finally
    //'this' is the current document, so these are being set in the current document
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    this.passwordResetExpires = Date.now() + 10*60*1000

    //We need to send by email the unencrypted resetToken, the user would send this resetToken back and
    //we would match it with the encrypted one that we have saved in the db. Same as password, the user sends the
    //unencrypted password and we match it with the encrypyted version stored in db
    return resetToken
}
//To not retrive any user for any find operations like findOne, findByIdAndUpdate, etc where the user is not active
userSchema.pre(/^find/, function(next) {
    this.find({active: {$ne: false}})
    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User