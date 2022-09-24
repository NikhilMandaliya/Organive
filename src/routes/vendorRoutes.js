const express = require('express');
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const { sendForgotPassMail } = require('../helpers/sendmail')
const formatDate = require('../helpers/formateDate');
const isToday = require('../helpers/isToday')

const checkVendor = require('../middleware/authVendorMiddleware');

const sharp = require('sharp');
const multer = require('multer');
const fs = require('fs-extra');
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    // reject a file
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
});

const Vendor = require('../models/vendorModel');
const User = require('../models/userModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Unit = require('../models/unitModel');

// GET dashboard
router.get("/", checkVendor, async (req, res) => {
    const [orders, products] = await Promise.all([
        await Order.find({ vendor: req.vendor.id, status: { $nin: ['Rejected', 'Cancelled'] } }),
        await Product.find({ vendor: req.vendor.id })
    ])
    
    newOrders = 0;
    for (let i = 0; i < orders.length; i++) {
        if (isToday(orders[i].orderdate)) {
            newOrders++;
        }
    }
    newProducts = 0;
    for (let i = 0; i < products.length; i++) {
        if (isToday(products[i].date)) {
            newProducts++;
        }
    }
    res.status(201).render("vendor/vendor_dashboard", {
        title: 'Vendor Dashboard',
        vendor: req.vendor,
        orders: orders.length,
        newOrders,
        products: products.length,
        newProducts
    });
});

// GET profile
router.get('/profile', checkVendor, (req, res) => {
    res.render('vendor/profile', {
        title: 'Vendor Profile',
        vendor: req.vendor,
    })
})

// POST profile
router.post("/profile", checkVendor, upload.single('image'), async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.vendor.id);
        if (vendor == null) {
            req.flash('danger', `An error occured!`);
            return res.redirect('/vendor/profile');
        }
        vendor.storename = req.body.storename;
        vendor.ownername = req.body.ownername;
        vendor.contact = req.body.contact;
        vendor.address = req.body.address;
        vendor.deliverycharge = req.body.deliverycharge;
        vendor.deliveryrange = req.body.deliveryrange;
        if (req.body.lat && req.body.lng) {
            vendor.coords = {
                lat: req.body.lat,
                lng: req.body.lng
            }
        }

        if (typeof req.file !== 'undefined') {
            oldImage = "public" + vendor.image;
            fs.remove(oldImage, function (err) {
                if (err) { console.log(err); }
            })
            const filename = new Date().toISOString().replace(/:/g, '-') + req.file.originalname;
            vendor.image = `/uploads/vendor/${vendor.id}/` + filename;
            // fs.access(`./public/uploads/vendor/${vendor.id}`, (err) => { if (err) fs.mkdirSync(`./public/uploads/vendor/${vendor.id}`); });
            if (!fs.existsSync(`./public/uploads/vendor/${vendor.id}`)) {
                fs.mkdirSync(`./public/uploads/vendor/${vendor.id}`, { recursive: true });
            }
            await sharp(req.file.buffer)
                .toFile(`./public/uploads/vendor/${vendor.id}/` + filename);
        }

        await vendor.save();
        req.flash('success', 'Profile edited successfully.')
        res.redirect('/vendor/profile');
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('danger', `An error occured!`);
            res.redirect('/vendor/profile');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});


// GET login
router.get('/login', (req, res) => {
    if (req.session.checkVendorSuccess) {
        req.session.checkVendorSuccess = undefined;
        return res.render('vendor/login', {
            title: 'Vendor Login'
        })
    }
    const token = req.cookies['jwtVendor'];
    if (token) {
        jwt.verify(token, process.env.SECRET_KEY, function (err, decodedToken) {
            if (err) {
                console.log("ERROR: " + err.message);
                return res.render('vendor/login', {
                    title: 'Vendor Login'
                });
            } else {
                Vendor.findById(decodedToken._id, function (err, vendor) {
                    if (err) {
                        console.log("ERROR: " + err.message);
                        return res.render('vendor/login', {
                            title: 'Vendor Login'
                        });
                    }
                    if (!vendor) {
                        console.log("ERROR: " + 'Vendor not found!');
                        return res.render('vendor/login', {
                            title: 'Vendor Login'
                        });
                    }
                    if (vendor.status == 'Rejected') {
                        return res.render('vendor/login', {
                            title: 'Vendor Login'
                        });
                    }
                    if (vendor.status != 'Approved') {
                        return res.render('vendor/login', {
                            title: 'Vendor Login'
                        });
                    }
                    return res.redirect('/vendor');
                });
            }
        });
    } else {
        res.render('vendor/login', {
            title: 'Vendor Login'
        })
    }
})

// GET logout
router.get("/logout", checkVendor, async (req, res) => {
    res.clearCookie("jwtVendor");
    res.redirect('/vendor/login');
})

// POST login
router.post("/login", [
    check('email', 'Please enter valid email.').isEmail(),
    check('password', 'Please enter password!').notEmpty(),
], async (req, res) => {
    try {
        const validationErrors = validationResult(req)
        if (validationErrors.errors.length > 0) {
            req.flash('danger', 'Invalid email or password!');
            return res.redirect('/vendor/login');
        }
        const { email, password } = req.body;
        const vendorExist = await Vendor.findOne({ email });
        if (!vendorExist) {
            req.flash('danger', 'Invalid email or password!');
            return res.redirect('/vendor/login');
        }
        const isMatch = await bcrypt.compare(password, vendorExist.password);
        if (!isMatch) {
            req.flash('danger', 'Invalid email or password!');
            return res.redirect('/vendor/login');
        }
        if (vendorExist.status == 'Rejected') {
            req.flash('danger', 'Sorry! You are rejected.');
            return res.redirect('/vendor/login');
        }
        if (vendorExist.status != 'Approved') {
            req.flash('info', 'Waiting for approval!');
            return res.redirect('/vendor/login');
        }
        const token = await vendorExist.generateAuthToken();
        res.cookie("jwtVendor", token, {
            expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            httpOnly: true,
            // secure:true
        });
        res.redirect('/vendor');
    } catch (error) {
        console.log(error);
        res.status(400).send(error.message);
    }
})

// GET register
router.get('/register', (req, res) => {
    res.render('vendor/register', {
        title: 'Vendor Register'
    })
})

// POST register
router.post("/register", upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'idImage', maxCount: 1 },
    { name: 'addImage', maxCount: 1 },
]), [
    check('storename', 'Please enter Store name.').notEmpty(),
    check('ownername', 'Please enter Owner name.').notEmpty(),
    check('email', 'Please enter valid email.').isEmail(),
    check('password', 'Password should be atleast 6 characters long.').isLength({ min: 6 }),
    check('contact', 'Plaese enter contact number.').notEmpty(),
    check('address', 'Plaese enter address.').notEmpty(),
], async (req, res) => {
    try {
        const validationErrors = validationResult(req)
        if (validationErrors.errors.length > 0) {
            const alert = validationErrors.array()
            console.log(alert);
            return res.render('vendor/register', {
                title: 'Vendor register',
                alert
            })
        }
        const vendorExist = await Vendor.findOne({ email: req.body.email })
        if (vendorExist) {
            return res.render('vendor/register', {
                title: 'Vendor register',
                alert: [{ msg: 'Vendor is already registerd with this Email.' }]
            })
        }
        const file1name = new Date().toISOString().replace(/:/g, '-') + req.files.image[0].originalname;
        const file2name = new Date().toISOString().replace(/:/g, '-') + req.files.idImage[0].originalname;
        const file3name = new Date().toISOString().replace(/:/g, '-') + req.files.addImage[0].originalname;
        const vendor = new Vendor({
            storename: req.body.storename,
            ownername: req.body.ownername,
            email: req.body.email,
            password: req.body.password,
            contact: req.body.contact,
            address: req.body.address,
            deliverycharge: req.body.deliverycharge,
            deliveryrange: req.body.deliveryrange,
            coords: {
                lat: req.body.lat,
                lng: req.body.lng
            }
        })
        vendor.image = `/uploads/vendor/${vendor.id}/` + file1name;
        vendor.idimage = `/uploads/vendor/${vendor.id}/` + file2name;
        vendor.addressimage = `/uploads/vendor/${vendor.id}/` + file3name;

        // fs.access('./public/uploads/vendor', (err) => { if (err) fs.mkdirSync('./public/uploads/vendor'); console.log('1'); });
        // fs.access(`./public/uploads/vendor/${vendor.id}`, (err) => { if (err) fs.mkdirSync(`./public/uploads/vendor/${vendor.id}`); console.log('2'); });
        if (!fs.existsSync('./public/uploads/vendor')) {
            fs.mkdirSync('./public/uploads/vendor', { recursive: true });
        }
        if (!fs.existsSync(`./public/uploads/vendor/${vendor.id}`)) {
            fs.mkdirSync(`./public/uploads/vendor/${vendor.id}`, { recursive: true });
        }
        await sharp(req.files.image[0].buffer)
            .toFile(`./public/uploads/vendor/${vendor.id}/` + file1name);
        await sharp(req.files.idImage[0].buffer)
            .toFile(`./public/uploads/vendor/${vendor.id}/` + file2name);
        await sharp(req.files.addImage[0].buffer)
            .toFile(`./public/uploads/vendor/${vendor.id}/` + file3name);
        await vendor.save();
        req.flash('success', 'Vendor added successfully')
        res.redirect('/vendor/login');
    } catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
})

// GET Change Pass
router.get("/changepass", checkVendor, async (req, res) => {
    res.render("vendor/changepass", {
        title: "Change Password",
        vendor: req.vendor,
    });
})

// POST Change Pass
router.post("/changepass", checkVendor, async (req, res) => {
    try {
        const { currentpass, newpass, cfnewpass } = req.body;
        if (!currentpass || currentpass.length < 6) {
            req.flash('danger', 'Invalid current password.');
            return res.redirect('/vendor/changepass');
        }
        if (!newpass || newpass.length < 6) {
            req.flash('danger', 'Invalid new password.');
            return res.redirect('/vendor/changepass');
        }
        if (!cfnewpass || cfnewpass.length < 6) {
            req.flash('danger', 'Invalid confirm new password.');
            return res.redirect('/vendor/changepass');
        }
        const isMatch = await bcrypt.compare(currentpass, req.vendor.password);
        if (!isMatch) {
            req.flash('danger', 'Wrong current password.');
            return res.redirect('/vendor/changepass');
        }
        if (currentpass == newpass) {
            req.flash('danger', 'New password can not be same as current password.');
            return res.redirect('/vendor/changepass');
        }
        if (newpass != cfnewpass) {
            req.flash('danger', 'Password and confirm password does not match!');
            return res.redirect('/vendor/changepass');
        }
        const vendor = await Vendor.findById(req.vendor.id);
        vendor.password = newpass;
        await vendor.save();
        req.flash('success', 'Password updated.');
        return res.redirect('/vendor/changepass');
    } catch (error) {
        if (error) {
            console.log(error);
            res.json(error)
        }
    }
})

// GET Forgot Pass
router.get("/forgot", async (req, res) => {
    res.render("vendor/forgot", {
        title: "Forgot Password"
    });
})

// POST Forgot Pass
router.post("/forgot", async (req, res) => {
    // generate pass
    let pass = (Math.random() + 1).toString(36).substring(5);

    // set pass
    const email = req.body.email
    console.log(email);
    const vendor = await Vendor.findOne({ email });
    if (!vendor) {
        req.flash('danger', 'Please enter registered email id.');
        return res.redirect('/vendor/forgot');
    }
    vendor.password = pass;
    await vendor.save();

    // send mail
    sendForgotPassMail(email, pass)
    console.log('pass: ' + pass);

    req.flash('success', 'A new password sent to your mail. Check your mail and Try logging in.');
    return res.redirect('/vendor/forgot');
})

// GET orders
router.get("/order", checkVendor, async (req, res) => {
    var orders = await Order.find({ vendor: req.vendor.id, status: { $nin: ['Rejected', 'Cancelled'] } });
    let updated = []
    for (let i = 0; i < orders.length; i++) {
        let user = await User.findById(orders[i].user);
        let username = `${user.firstname} ${user.lastname}`
        let e = {
            username,
            id: orders[i].id,
            useraddress: orders[i].useraddress,
            totalamount: orders[i].totalamount,
            deliverycharge: orders[i].deliverycharge,
            payableamount: orders[i].payableamount,
            discountamount: orders[i].discountamount,
            paymentmode: orders[i].paymentmode,
            status: orders[i].status,
            date: formatDate(new Date(orders[i].orderdate))
        }
        updated.push(e)
    }
    res.status(201).render("vendor/orders", {
        title: 'Order List',
        vendor: req.vendor,
        orders: updated
    });
});

// GET order detail
router.get("/order/detail/:id", checkVendor, async (req, res) => {
    try {
        const id = req.params.id;
        const order = await Order.findById(id);
        let updated = [];
        for (let i = 0; i < order.products.length; i++) {
            let product = await Product.findById(order.products[i].productId);
            let unit = null;
            if (product) { unit = await Unit.findById(product.unit); }
            let e = {
                image: product ? product.image : "",
                name: order.products[i].name,
                quantity: order.products[i].quantity,
                weight: order.products[i].weight,
                price: order.products[i].price,
                unit: unit ? unit.name : ""
            }
            updated.push(e)
        }
        res.status(201).render("vendor/order_detail", {
            title: 'Order Details',
            // offer,
            vendor: req.vendor,
            updated,
        });
    } catch (error) {
        if (error.name === 'CastError' || error.name === 'TypeError') {
            req.flash('danger', `Order not found!`);
            res.redirect('/vendor/order');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

// GET order accept/reject
router.get("/order/:id/:action", checkVendor, async (req, res) => {
    try {
        const id = req.params.id;
        const action = req.params.action;
        if (action == 'accept') {
            await Order.findByIdAndUpdate(id, { status: 'Accepted', acceptdate: Date.now() });
        } else if (action == 'reject') {
            const order = await Order.findByIdAndUpdate(id, { status: 'Rejected', rejectdate: Date.now() });
            for (let i = 0; i < order.products.length; i++) {
                // update stock
                const product = await Product.findById(order.products[i].productId);
                product.qtyweight = parseInt(product.qtyweight) + parseInt(order.products[i].quantity);
                await product.save();
            }
        } else {
            req.flash('danger', 'Invalid action!');
        }
        res.redirect('/vendor/order');
    } catch (error) {
        console.log(error.message);
        if (error.name === 'CastError' || error.name === 'TypeError') {
            req.flash('danger', `Order not found!`);
            res.redirect('/vendor/order');
        } else {
            res.send(error);
        }
    }
})

// GET rejected orders
router.get("/reject_order", checkVendor, async (req, res) => {
    var orders = await Order.find({ vendor: req.vendor.id, status: { $in: ['Rejected', 'Cancelled'] } });
    let updated = []
    for (let i = 0; i < orders.length; i++) {
        let user = await User.findById(orders[i].user);
        let username = `${user.firstname} ${user.lastname}`
        let date = orders[i].rejectdate ? formatDate(new Date(orders[i].rejectdate)) : formatDate(new Date(orders[i].canceldate))
        let e = {
            username,
            id: orders[i].id,
            status: orders[i].status,
            date
        }
        updated.push(e)
    }
    res.status(201).render("vendor/reject_order", {
        title: 'Reject Orders',
        vendor: req.vendor,
        orders: updated
    });
});

module.exports = router;