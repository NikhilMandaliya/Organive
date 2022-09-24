const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const checkUser = function (req, res, next) {
    // console.log("MIDDLEWARE");
    const token = req.cookies['jwt'];
    if (token) {
        jwt.verify(token, process.env.SECRET_KEY, function (err, decodedToken) {
            if (err) {
                console.log("ERROR: " + err.message);
                req.user = null;
                return res.status(201).render("account", {
                    title: 'My account',
                    user: null,
                    cartLength: 0,
                    alert: [{ msg: 'Invalid token! Please login again.' }]
                });
            } else {
                User.findById(decodedToken._id, function (err, user) {
                    if (err) {
                        console.log("ERROR: " + err.message);
                        req.user = null;
                        return res.status(201).render("account", {
                            title: 'My account',
                            user: null,
                            cartLength: 0,
                            alert: [{ msg: 'Oops! An error occurred.' }]
                        });
                    }
                    if (!user) {
                        return res.status(201).render("account", {
                            title: 'My account',
                            user: null,
                            cartLength: 0,
                            alert: [{ msg: 'Please login first.' }]
                        });
                    }
                    // if blocked
                    if (user.blocked == true) {
                        return res.status(201).render("account", {
                            title: 'My account',
                            user: null,
                            cartLength: 0,
                            alert: [{ msg: 'Sorry! You are blocked, Please contact Admin.' }]
                        });
                    }
                    req.user = user;
                    next();
                });
            }
        });
    } else {
        req.user = null;
        next();
    }
}

module.exports = checkUser;