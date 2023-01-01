const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
var request = require('request');
const express = require('express');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');
const path = require('path');
const { userJoin } = require('./../utils/users');

const dbConnect = require("../connection");
const bcrypt = require('bcryptjs');

const signToken = id => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const createSendToken = (user, statusCode, res, msg) => {
    const token = signToken(user.id);
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    res.cookie('jwt', token, cookieOptions);
    res.cookie('user_id', user.id, cookieOptions);

    // Remove password from output
    user.password = undefined;
    return res.status(statusCode).json({
        status: 'success',
        message: msg,
        token,
        data: { user }
    });
}

function getQueryResult(query) {
    return new Promise((resolve) => {
        dbConnect.query(query, function (err, result) {
            if (err) throw err;
            if (result) {
                resolve(result)
            }
        });
    })
}

/**
 * Sign Up
 */
exports.signup = catchAsync(async (req, res, next) => {
    var selectQuery = "SELECT email from users where email = '" + req.body.email + "' "
    const invalidEmail = await getQueryResult(selectQuery)

    // input field validation
    if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
        return res.status(200).json({
            status: 'fail',
            message: 'Please select captcha'
        });
    } else if (req.body.name === '') {
        return res.status(200).json({
            status: 'fail',
            message: 'Please enter username'
        });
    } else if (req.body.email === '') {
        return res.status(200).json({
            status: 'fail',
            message: 'Please enter email'
        });
    } else if (req.body.password === '') {
        return res.status(200).json({
            status: 'fail',
            message: 'Please enter password'
        });
    } else if (req.body.location === '') {
        return res.status(200).json({
            status: 'fail',
            message: 'Please enter location'
        });
    } else if (invalidEmail.length > 0) {
        return res.status(200).json({
            status: 'fail',
            message: 'Email already exists'
        });
    }

    var secretKey = process.env.CAPTCHA_SECRET;
    // req.connection.remoteAddress will provide IP address of connected user.
    var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
    // Hitting GET request to the URL, Google will respond with success or error scenario.
    request(verificationUrl, async (error, response, body) => {
        body = JSON.parse(body);
    });

    await dbConnect.query("INSERT INTO users(name, email, password, location) VALUES('" + req.body.name + "', '" + req.body.email + "', '" + await bcrypt.hash(req.body.password, 12) + "', '" + req.body.location + "')", function (err, result, fields) {
        if (err) throw err;
        return res.status(200).json({
            status: "success",
            message: "Register Sucessfully"
        })
    });

});

/**
 * Sign In
 */
exports.signin = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(200).json({
            status: 'fail',
            message: 'please enter email or password'
        });
    }

    await dbConnect.query("Select * from users where email ='" + email + "'", async function (err, result) {
        if (err) throw err;
        if (!result.length) {
            return res.status(200).json({
                status: 'fail',
                message: 'invalid email or password'
            });
        } else {
            var user = result[0];
            const hashedPassword = result[0].password;
            if (await bcrypt.compare(password, hashedPassword)) {
                if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
                    return res.status(200).json({
                        status: 'fail',
                        message: 'Please select captcha'
                    });
                }

                var secretKey = process.env.CAPTCHA_SECRET;
                var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
                request(verificationUrl, async (error, response, body) => {
                    body = JSON.parse(body);
                    if (body.success == undefined || !body.success) {
                        return res.status(200).json({
                            status: 'fail',
                            message: 'Failed captcha verification'
                        });
                    } else {
                        createSendToken(user, 200, res, 'Login Successfully');
                    }
                });
            }
            else {
                return res.status(200).json({
                    status: 'fail',
                    message: 'invalid password'
                });
            }
        }
    });
});

exports.forgotPassword = catchAsync(async (req, res, next) => {

    var user = [];
    await dbConnect.query("Select * from users where email ='" + req.body.email + "'", async function (err, result, fields) {
        if (err) throw err;
        if (!result.length) {
            return res.status(200).json({
                status: 'fail',
                message: 'Please Provide a Email'
            });
        }
        else {
            user = result[0];

            const resetToken = crypto.randomBytes(32).toString('hex');
            var passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
            var passwordResetExpires = await (Date.now() + 10 * 60000);
            await dbConnect.query("UPDATE users SET passwordResetToken='" + passwordResetToken + "' , passwordResetExpires = '" + passwordResetExpires + "' where email ='" + req.body.email + "'", function (err, result) {
                if (err) throw err;
            });

            const resetURL = `${req.protocol}://${req.get('host')}/reset_Password?token=${resetToken}`;
            const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}`;

            try {
                await sendEmail({
                    email: user.email,
                    subject: 'Your Password reset token (valid for 10 min)',
                    message
                });

                return res.status(200).json({
                    status: 'success',
                    message: 'Token send to email',
                    token: resetToken
                });
            }
            catch (err) {
                user.passwordResetToken = undefined;
                user.passwordResetExpires = undefined;
                // await user.save({ validateBeforeSave: false });
                return next(new AppError('There was an error sending the email. Try again later!', 500));
            }
        }
    });
});

/**
 * Reset Password
 */
exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get User based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    // const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });

    var user = [];
    await dbConnect.query("Select * from users where passwordResetToken ='" + hashedToken + "' and passwordResetExpires > " + Date.now() + "", async function (err, result) {
        if (err) throw err;
        if (!result.length) {
            return res.status(200).json({
                status: 'fail',
                message: 'Token is invalid or has expired'
            });
        }
    });

    await dbConnect.query("UPDATE users set passwordResetToken='',password='" + await bcrypt.hash(req.body.password, 12) + "',passwordResetExpires='' where passwordResetToken ='" + hashedToken + "' ", function (err, result) {
        if (err) throw err;
        return res.status(200).json({
            status: 'success',
            message: 'Reset Password Successfully'
        });
    });

});

/**
 * Logout
 */
exports.logout = async (req, res) => {
    res.clearCookie('user_id');
    res.clearCookie('jwt');
    res.status(200).json({ status: 'success' });
}

/**
 * Login Page
 */
exports.login = async (req, res) => {
    res.status(200).render('login');
};

/**
 * Register Page
 */
exports.register = async (req, res) => {
    res.status(200).render('register');
};

/**
 * Forgot password Page
 */
exports.forgot_password = async (req, res) => {
    res.status(200).render('forgot_password');
};

/**
 * Forgot password Page
 */
exports.reset_password = async (req, res) => {
    res.status(200).render('reset_password');
};

/**
 * Index Page
 */
exports.index = async (req, res) => {
    if (req.cookies.jwt == undefined) {
        return res.status(200).render('login');
    } else
        res.status(200).render('index', { user: req.user })
};

