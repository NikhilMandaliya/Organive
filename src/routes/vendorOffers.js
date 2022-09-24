const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

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
        fileSize: 1024 * 1024 * 10
    },
    fileFilter: fileFilter
});

// models
const Category = require('../models/category');
const Subcategory = require('../models/subcategory');
const Unit = require('../models/unitModel');
const Offer = require('../models/offerModel');

// GET offers
router.get("/", checkVendor, async (req, res) => {
    const offers = await Offer.find({ vendor: req.vendor.id });
    res.status(201).render("vendor/vendor_offers", {
        title: 'Offer List',
        vendor: req.vendor,
        offers
    });
});

// GET add offer
router.get("/add", checkVendor, async (req, res) => {
    const cats = await Category.find();
    let array = {}
    for (let i = 0; i < cats.length; i++) {
        const subcats = await Subcategory.find({ category: cats[i].id });
        array[cats[i].id] = subcats
    }
    const units = await Unit.find();
    res.status(201).render("vendor/add_offer", {
        title: 'Add Offer',
        vendor: req.vendor,
        cats,
        units,
        array: array
    });
});

// Post new offer
router.post("/add", checkVendor, upload.single('image'), [
    check('category', 'Please enter category.').notEmpty(),
    check('productName', 'Please enter productName.').notEmpty(),
    check('type', 'Please enter type.').notEmpty(),
    check('costPrice', 'Please enter costPrice.').notEmpty(),
    check('salePrice', 'Please enter salePrice.').notEmpty(),
    check('discount', 'Please enter Discount.').notEmpty(),
], async (req, res) => {
    try {
        const validationErrors = validationResult(req)
        if (validationErrors.errors.length > 0) {
            const alert = validationErrors.array()
            return res.render('vendor/add_offers', {
                title: 'Add Offer',
                vendor: req.vendor,
                alert
            })
        }
        const filename = new Date().toISOString().replace(/:/g, '-') + req.file.originalname;
        const offer = new Offer({
            category: req.body.category,
            subcategory: req.body.subCategory,
            company: req.body.company,
            productname: req.body.productName,
            type: req.body.type,
            productweight: req.body.productWeight,
            unit: req.body.unit,
            costprice: req.body.costPrice,
            saleprice: req.body.salePrice,
            discount: req.body.discount,
            nondisc: req.body.nondisc,
            totalprice: req.body.totalPrice,
            image: '/uploads/offer/' + filename,
            title: req.body.title,
            description: req.body.description,
            vendor: req.vendor.id
        })
        // fs.access('./public/uploads/offer', (err) => { if (err) fs.mkdirSync('./public/uploads/offer'); });
        if (!fs.existsSync('./public/uploads/offer')) {
            fs.mkdirSync('./public/uploads/offer', { recursive: true });
        }
        await sharp(req.file.buffer)
            .resize({ width: 1000, height: 723 })
            .toFile('./public/uploads/offer/' + filename);
        await offer.save();
        req.flash('success', `Offer added successfully`);
        res.redirect('/vendor/offer');
    } catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
})

// GET edit offer
router.get("/edit/:id", checkVendor, async (req, res) => {
    try {
        const id = req.params.id;
        const offer = await Offer.findById(id);
        if (offer == null) {
            req.flash('danger', `Offer not found!`);
            return res.redirect('/vendor/offer');
        }
        const cats = await Category.find();
        let array = {}
        for (let i = 0; i < cats.length; i++) {
            const subcats = await Subcategory.find({ category: cats[i].id });
            array[cats[i].id] = subcats
        }
        const units = await Unit.find();
        res.status(201).render("vendor/edit_offer", {
            title: 'Edit Offer',
            vendor: req.vendor,
            offer,
            cats,
            units,
            array: array
        });
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('danger', `Offer not found!`);
            res.redirect('/vendor/offer');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

// POST edit offer
router.post('/edit/:id', checkVendor, upload.single('image'), [
    check('category', 'Please enter category.').notEmpty(),
    check('productName', 'Please enter productName.').notEmpty(),
    check('type', 'Please enter valid type.').notEmpty(),
    check('costPrice', 'Please enter valid costPrice.').notEmpty(),
    check('salePrice', 'Please enter valid salePrice.').notEmpty(),
    check('discount', 'Please enter Discount.').notEmpty(),
], async (req, res) => {
    try {
        const validationErrors = validationResult(req)
        if (validationErrors.errors.length > 0) {
            const alert = validationErrors.array()
            return res.render('vendor/add_offers', {
                title: 'Add Offer',
                vendor: req.vendor,
                alert
            })
        }
        const id = req.params.id;
        const offer = await Offer.findById(id);
        if (offer == null) {
            req.flash('danger', `Offer not found!`);
            return res.redirect('/vendor/offer');
        }
        offer.category = req.body.category;
        offer.subcategory = req.body.subCategory;
        offer.company = req.body.company;
        offer.productname = req.body.productName;
        offer.type = req.body.type;
        offer.productweight = req.body.productWeight;
        offer.unit = req.body.unit;
        offer.costprice = req.body.costPrice;
        offer.saleprice = req.body.salePrice;
        offer.discount = req.body.discount;
        offer.nondisc = req.body.nondisc;
        offer.totalprice = req.body.totalPrice;
        offer.title = req.body.title;
        offer.description = req.body.description;
        if (typeof req.file !== 'undefined') {
            oldImage = "public" + offer.image;
            fs.remove(oldImage, function (err) {
                if (err) { console.log(err); }
            })
            const filename = new Date().toISOString().replace(/:/g, '-') + req.file.originalname;
            offer.image = '/uploads/offer/' + filename;

            // fs.access('./public/uploads/offer', (err) => { if (err) fs.mkdirSync('./public/uploads/offer'); });
            if (!fs.existsSync('./public/uploads/offer')) {
                fs.mkdirSync('./public/uploads/offer', { recursive: true });
            }
            await sharp(req.file.buffer)
                .resize({ width: 1000, height: 723 })
                .toFile('./public/uploads/offer/' + filename);
        }
        await offer.save();
        req.flash('success', `Offer Edited successfully`);
        res.redirect('/vendor/offer');
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('danger', `Offer not found!`);
            res.redirect('/vendor/offer');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

// GET delete offer
router.get("/delete/:id", checkVendor, async (req, res) => {
    try {
        const id = req.params.id;
        const offer = await Offer.findByIdAndRemove(id);
        image = "public" + offer.image;
        fs.remove(image, function (err) {
            if (err) { console.log(err); }
        })
        req.flash('success', `Offer Deleted successfully`);
        res.redirect('/vendor/offer');
    } catch (error) {
        if (error.name === 'CastError' || error.name === 'TypeError') {
            req.flash('danger', `Offer not found!`);
            res.redirect('/vendor/offer');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

module.exports = router;