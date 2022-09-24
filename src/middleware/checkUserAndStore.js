const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Vendor = require('../models/vendorModel');

const checkUserAndStore = async (req, res, next) => {
    try {
        const cookie = req.cookies['selectStore'];
        const token = req.cookies['jwt'];
        if (cookie == undefined) {
            return res.redirect('/store');
        }
        if (token == undefined) {
            req.user = null;
            return next();
        }
        // if both cookies exist
        let decoded;
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
                decoded = decodedToken;
            }
        });

        const [user, vendor] = await Promise.all([
            User.findById(decoded._id),
            Vendor.findById(cookie)
        ])

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

        if (!vendor) {
            // req.flash('danger','msg');
            return res.redirect('/store');
        }
        req.store = cookie;
        req.storename = vendor.storename;
        req.deliverycharge = vendor.deliverycharge;

        next();
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: 500,
            msg: 'Internal server error',
            error
        })
    }
}

module.exports = checkUserAndStore;