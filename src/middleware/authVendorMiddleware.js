const jwt = require('jsonwebtoken');
const Vendor = require('../models/vendorModel');

const checkVendor = function (req, res, next) {
    const token = req.cookies['jwtVendor'];
    req.session.checkVendorSuccess = true;
    if (token) {
        jwt.verify(token, process.env.SECRET_KEY, function (err, decodedToken) {
            if (err) {
                console.log("ERROR: " + err.message);
                req.vendor = null;
                req.flash('danger', 'Invalid token! Please login again.');
                return res.redirect('/vendor/login');
            } else {
                Vendor.findById(decodedToken._id, function (err, vendor) {
                    if (err) {
                        console.log("ERROR: " + err.message);
                        req.vendor = null;
                        req.flash('danger', 'An error occoured!');
                        return res.redirect('/vendor/login');
                    }
                    if (!vendor) {
                        req.flash('danger', 'Please Login as Vendor first!');
                        return res.redirect('/vendor/login');
                    }
                    if (vendor.status == 'Rejected') {
                        req.flash('danger', 'Sorry! You are rejected.');
                        return res.redirect('/vendor/login');
                    }
                    if (vendor.status != 'Approved') {
                        req.flash('info', 'Waiting for approval!');
                        return res.redirect('/vendor/login');
                    }
                    // if blocked
                    if (vendor.blocked == true) {
                        req.flash('danger', 'Sorry! You are blocked, Please contact Admin.');
                        return res.redirect('/vendor/login');
                    }
                    req.vendor = vendor;
                    req.session.checkVendorSuccess = undefined;
                    next();
                });
            }
        });
    } else {
        req.flash('danger', 'Please Login as Vendor first!');
        return res.redirect('/vendor/login');
    }
}

module.exports = checkVendor;