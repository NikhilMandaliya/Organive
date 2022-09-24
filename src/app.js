const express = require("express");
require('dotenv').config();
const passport = require('passport');

const path = require("path");
const cookieParser = require("cookie-parser");

// Mongo conn
require("./db/conn");

// init app
const app = express();

// view engine
app.set("views", path.join(__dirname, "../views"));
app.set('view engine', 'ejs');

// static path
app.use(express.static(path.join(__dirname, "../public")));

// set global errors var
app.locals.errors = null;

// get all pages to pass to header.ejs
const Contact = require('./models/contactDetailModel');
const checkUser = require("./middleware/authMiddleware");
const bodyParser = require("body-parser");
app.use(bodyParser.json({
    verify: (req, res, buf) => {
        req.rawBody = buf
    }
}))
Contact.findOne({}, function (err, contact) {
    if (err) {
        console.log(err.message);
    } else {
        app.locals.contact = contact;
    }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser(process.env.SESSION_SECRET));

// session
app.use(require('cookie-session')({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
}));

// Express Messages middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
    res.locals.messages = require('express-messages')(req, res);
    next();
});

// require passport
require('./helpers/googleAuth')

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// app.all('*', function (req, res, next) {
//     console.log("URL: "+req.url);
//     const storeId = req.cookies['selectStore'];
//     if (storeId) {
//         if (typeof req.session.cart == undefined) {
//             req.session.cart = {};
//             req.session.cart[storeId] = [];
//         } else if (typeof req.session.cart[storeId]) {
//             req.session.cart[storeId] = [];
//         }
//     }
//     next();
// })

// caching disabled for every route (admin and vendor)
app.use('/admin/*', function (req, res, next) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
});
app.use('/vendor/*', function (req, res, next) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
});

app.use('/uploads/*', (req, res) => { res.end() })

// Development logging
if (process.env.NODE_ENV === 'development') {
    const morgan = require('morgan');
    app.use(morgan('dev'));
}

// Routes
app.use('/admin/category', require('./routes/adminCategories'));
app.use('/admin/subcategory', require('./routes/adminSubCategories'));
app.use('/admin/unit', require('./routes/adminUnit'));
app.use('/admin/newsletter', require('./routes/adminNewsletter'));
app.use('/admin/promo', require('./routes/adminPromo'));
app.use('/admin/user', require('./routes/adminUserRoutes'));
app.use('/admin/vendor', require('./routes/adminVendor'));
app.use('/admin/driver', require('./routes/adminDriverRoutes'));
app.use('/admin/banner', require('./routes/adminBanner'));
app.use('/admin', require('./routes/adminRoutes'));
app.use('/admin', require('./routes/adminPagesRoutes'));
app.use('/admin', require('./routes/adminCommission'));
app.use('/admin/*', (req, res) => res.render('admin/404'));

app.use('/vendor/product', require('./routes/vendorProducts'));
app.use('/vendor/offer', require('./routes/vendorOffers'));
app.use('/vendor', require('./routes/vendorRoutes'));
app.use('/vendor/*', (req, res) => res.render('vendor/404'));

app.use('/', require('./routes/authRoutes'));
app.use('/', require('./routes/cmsPages'));
app.use('/', require('./routes/accountRoutes'));
app.use('/', require('./routes/homeRoute'));
app.use('/store', require('./routes/store'));
app.use('/cart', require('./routes/cartRoutes'));
app.use('/checkout', require('./routes/checkout'));
app.use('/order', require('./routes/orderRoutes'));
app.use('/products', require('./routes/productsRoutes'));
app.use('/wishlist', require('./routes/wishlistRoutes'));
app.use('/newsletter', require('./routes/newsletterRoutes'));

app.use('/google', require('./routes/googleAuthRoutes'));

// 404
app.all('*', checkUser, (req, res) => {
    // console.log(req.url);
    res.render("error", {
        title: "404 | Not Found",
        user: req.user,
        cartLength: 0
    });
});
// app.all('/404', checkUser, (req, res) => {
//     res.render("error",{
//         title:  "404 | Not Found",
//         user: req.user,
//         cartLength: 0
//     });
// });
// app.all('*', (req, res) => {
//     console.log(req.url);
//     res.status(404).redirect('/404');
// });

// error handler
app.use((err, req, res) => {
    console.log(err);
    res.status(err.status || 500).json({
        status: "fail",
        message: err.message,
    })
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`server is running on port ${port}`);
})