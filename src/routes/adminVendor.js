const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const checkAdmin = require('../middleware/authAdminMiddleware');

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

const Product = require('../models/productModel');
const Category = require('../models/category');
const Subcategory = require('../models/subcategory');
const Unit = require('../models/unitModel');
const Vendor = require('../models/vendorModel');

// GET vendors
router.get("/", checkAdmin, async (req, res) => {
    try {
        const vendors = await Vendor.find();
        res.status(201).render("admin/vendor", {
            title: 'Vendor List',
            vendors
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

// GET add vendor
router.get("/add", checkAdmin, async (req, res) => {
    try {
        res.status(201).render("admin/add_vendor", {
            title: 'Add Vendor',
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

// POST add vendor
router.post("/add", checkAdmin, upload.fields([
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
            return res.render('admin/add_vendor', {
                title: 'Add Vendor',
                alert
            })
        }
        const vendorExist = await Vendor.findOne({ email: req.body.email })
        if (vendorExist) {
            return res.render('admin/add_vendor', {
                title: 'Add Vendor',
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
            status: 'Approved',
            coords: {
                lat: req.body.lat,
                lng: req.body.lng
            }
        })
        vendor.image = `/uploads/vendor/${vendor.id}/` + file1name;
        vendor.idimage = `/uploads/vendor/${vendor.id}/` + file2name;
        vendor.addressimage = `/uploads/vendor/${vendor.id}/` + file3name;

        // fs.access('./public/uploads/vendor', (err) => { if (err) fs.mkdirSync('./public/uploads/vendor'); });
        // fs.access(`./public/uploads/vendor/${vendor.id}`, (err) => { if (err) fs.mkdirSync(`./public/uploads/vendor/${vendor.id}`); });
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
        res.redirect('/admin/vendor');
    } catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
})

// GET edit vendor
router.get("/edit/:id", checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const vendor = await Vendor.findById(id);
        if (vendor == null) {
            req.flash('danger', `Vendor not found!`);
            return res.redirect('/admin/vendor');
        }
        res.status(201).render("admin/edit_vendor", {
            title: 'Edit Vendor',
            vendor
        });
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('danger', `Vendor not found!`);
            res.redirect('/admin/vendor');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

// POST edit vendor
router.post("/edit/:id", checkAdmin, upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'idImage', maxCount: 1 },
    { name: 'addImage', maxCount: 1 },
]), [
    check('storename', 'Please enter Store name.').notEmpty(),
    check('ownername', 'Please enter Owner name.').notEmpty(),
    check('contact', 'Plaese enter contact number.').notEmpty(),
    check('address', 'Plaese enter address.').notEmpty(),
], async (req, res) => {
    try {
        const validationErrors = validationResult(req)
        if (validationErrors.errors.length > 0) {
            const alert = validationErrors.array()
            console.log(alert);
            return res.render('edit_vendor', {
                title: 'Edit Vendor',
                alert
            })
        }
        const id = req.params.id;
        const vendor = await Vendor.findById(id);
        if (vendor == null) {
            req.flash('danger', `Vendor not found!`);
            return res.redirect('/admin/vendor');
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

        if (typeof req.files.image !== 'undefined') {
            oldImage = "public" + vendor.image;
            fs.remove(oldImage, function (err) {
                if (err) { console.log(err); }
            })
            const filename = new Date().toISOString().replace(/:/g, '-') + req.files.image[0].originalname;
            vendor.image = `/uploads/vendor/${vendor.id}/` + filename;
            // fs.access(`./public/uploads/vendor/${vendor.id}`, (err) => { if (err) fs.mkdirSync(`./public/uploads/vendor/${vendor.id}`); });
            if (!fs.existsSync(`./public/uploads/vendor/${vendor.id}`)) {
                fs.mkdirSync(`./public/uploads/vendor/${vendor.id}`, { recursive: true });
            }
            await sharp(req.files.image[0].buffer)
                .toFile(`./public/uploads/vendor/${vendor.id}/` + filename);
        }
        if (typeof req.files.idImage !== 'undefined') {
            oldImage = "public" + vendor.idimage;
            fs.remove(oldImage, function (err) {
                if (err) { console.log(err); }
            })
            const filename = new Date().toISOString().replace(/:/g, '-') + req.files.idImage[0].originalname;
            vendor.idimage = `/uploads/vendor/${vendor.id}/` + filename;
            // fs.access(`./public/uploads/vendor/${vendor.id}`, (err) => { if (err) fs.mkdirSync(`./public/uploads/vendor/${vendor.id}`); });
            if (!fs.existsSync(`./public/uploads/vendor/${vendor.id}`)) {
                fs.mkdirSync(`./public/uploads/vendor/${vendor.id}`, { recursive: true });
            }
            await sharp(req.files.idImage[0].buffer)
                .toFile(`./public/uploads/vendor/${vendor.id}/` + filename);
        }
        if (typeof req.files.addImage !== 'undefined') {
            oldImage = "public" + vendor.addressimage;
            fs.remove(oldImage, function (err) {
                if (err) { console.log(err); }
            })
            const filename = new Date().toISOString().replace(/:/g, '-') + req.files.addImage[0].originalname;
            vendor.addressimage = `/uploads/vendor/${vendor.id}/` + filename;
            // fs.access(`./public/uploads/vendor/${vendor.id}`, (err) => { if (err) fs.mkdirSync(`./public/uploads/vendor/${vendor.id}`); });
            if (!fs.existsSync(`./public/uploads/vendor/${vendor.id}`)) {
                fs.mkdirSync(`./public/uploads/vendor/${vendor.id}`, { recursive: true });
            }
            await sharp(req.files.addImage[0].buffer)
                .toFile(`./public/uploads/vendor/${vendor.id}/` + filename);
        }

        await vendor.save();
        req.flash('success', 'Vendor edited successfully.')
        res.redirect('/admin/vendor');
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('danger', `Vendor not found!`);
            res.redirect('/admin/vendor');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

// GET vendor products
router.get("/products/:id", checkAdmin, async (req, res) => {
    try {
        req.session.redirectToUrl = req.originalUrl;
        const id = req.params.id;
        const products = await Product.find({ vendor: id });
        const vendor = await Vendor.findById(id);
        res.status(201).render("admin/vendor_products", {
            title: 'Vendor Products',
            products,
            vendor
        });
    } catch (error) {
        console.log(error);
        res.send(error);
    }
});

// GET vendor product detail
router.get("/product/detail/:id", checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const product = await Product.findById(id);
        if (product == null) {
            req.flash('danger', `Product not found!`);
            const redirect = req.session.redirectToUrl;
            req.session.redirectToUrl = undefined;
            return res.redirect(redirect || '/admin');
        }
        const category = await Category.findById(product.category);
        const subcategory = await Subcategory.findById(product.subcategory);
        const unit = await Unit.findById(product.unit);
        const vendor = await Vendor.findById(product.vendor);
        res.status(201).render("admin/vendor_product_detail", {
            title: 'Product Details',
            product,
            cat: category.name,
            subcat: subcategory.name,
            unit: unit ? unit.name : "",
            store: vendor.storename
        });
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('danger', `Product not found!`);
            const redirect = req.session.redirectToUrl;
            req.session.redirectToUrl = undefined;
            return res.redirect(redirect || '/admin');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

// block vendor
router.get('/block/:id', checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        await Vendor.findByIdAndUpdate(id, { blocked: true });
        req.flash('success', 'Vendor blocked Successfully.');
        res.redirect('/admin/vendor');
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('danger', `Vendor not found!`);
        } else {
            console.log(error);
            req.flash('danger', error.message);
        }
        res.redirect('/admin/vendor');
    }
})

// unblock vendor
router.get('/unblock/:id', checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        await Vendor.findByIdAndUpdate(id, { blocked: false });
        req.flash('success', 'Vendor unblocked Successfully.');
        res.redirect('/admin/vendor');
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('danger', `Vendor not found!`);
        } else {
            console.log(error);
            req.flash('danger', error.message);
        }
        res.redirect('/admin/vendor');
    }
})

// GET vendor approve/reject
router.get("/:id/:action", checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const action = req.params.action;
        if (action == 'approve') {
            await Vendor.findByIdAndUpdate(id, { status: 'Approved' });
        } else if (action == 'reject') {
            await Vendor.findByIdAndUpdate(id, { status: 'Rejected' });
        } else {
            req.flash('danger', 'Invalid action!');
            return res.redirect('/admin/vendor');
        }
        req.flash('success', `Vendor updated successfully.`);
        res.redirect('/admin/vendor');
    } catch (error) {
        console.log(error.message);
        if (error.name === 'CastError' || error.name === 'TypeError') {
            req.flash('danger', `Vendor not found!`);
            res.redirect('/admin/vendor');
        } else {
            res.send(error);
        }
    }
})

// GET delete vendor
router.get("/delete/:id", checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const vendor = await Vendor.findByIdAndRemove(id);

        fs.rmSync(`./public/uploads/vendor/${vendor.id}`, { recursive: true, force: true });

        req.flash('success', `Vendor Deleted successfully`);
        res.redirect('/admin/vendor');
    } catch (error) {
        if (error.name === 'CastError' || error.name === 'TypeError') {
            req.flash('danger', `Vendor not found!`);
            res.redirect('/admin/vendor');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

// GET vendors
router.get("/contact", checkAdmin, async (req, res) => {
    try {
        const vendors = await Vendor.find();
        res.status(201).render("admin/vendorcontact", {
            title: 'Vendor List',
            vendors
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

module.exports = router;