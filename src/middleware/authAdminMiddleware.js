const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const checkAdmin = function (req, res, next) {
    const token = req.cookies['jwtAdmin'];
    req.session.checkAdminSuccess = true;
    if (token) {
        jwt.verify(token, process.env.SECRET_KEY, function (err, decodedToken) {
            if (err) {
                console.log("ERROR: " + err.message);
                req.user = null;
                req.flash('danger', 'Invalid token! Please login again.');
                return res.redirect('/admin/login');
            } else {
                User.findById(decodedToken._id, function (err, user) {
                    if (err) {
                        console.log("ERROR: " + err.message);
                        req.user = null;
                        req.flash('danger', 'An error occoured!');
                        return res.redirect('/admin/login');
                    }
                    if (!user) {
                        req.flash('danger', 'Please login as admin first!');
                        return res.redirect('/admin/login');
                    } else if (!user.isAdmin) {
                        req.flash('danger', 'Please login as admin first!');
                        return res.redirect('/admin/login');
                    }
                    req.user = user;
                    req.session.checkAdminSuccess = undefined;
                    next();
                });
            }
        });
    } else {
        req.flash('danger', 'Please Login as Admin first!');
        res.redirect('/admin/login');
    }
}

module.exports = checkAdmin;