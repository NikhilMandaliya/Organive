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
const Product = require('../models/productModel');

// GET products
router.get("/", checkVendor, async (req, res) => {
    const products = await Product.find({ vendor: req.vendor.id });
    res.status(201).render("vendor/vendor_products", {
        title: 'Product List',
        vendor: req.vendor,
        products
    });
});

// GET add product
router.get("/add", checkVendor, async (req, res) => {
    const cats = await Category.find();
    let array = {}
    for (let i = 0; i < cats.length; i++) {
        const subcats = await Subcategory.find({ category: cats[i].id });
        array[cats[i].id] = subcats
    }
    // const subcats = await Subcategory.find();
    const units = await Unit.find();
    res.status(201).render("vendor/add_product", {
        title: 'Add Product',
        vendor: req.vendor,
        cats,
        // subcats,
        units,
        array: array
    });
});

// add new product
router.post("/add", checkVendor, upload.single('image'), [
    check('category', 'Please enter category.').notEmpty(),
    check('productName', 'Please enter productName.').notEmpty(),
    check('type', 'Please enter valid type.').notEmpty(),
    check('salePrice', 'Please enter valid salePrice.').notEmpty(),
], async (req, res) => {
    try {
        const validationErrors = validationResult(req)
        if (validationErrors.errors.length > 0) {
            const alert = validationErrors.array()
            return res.render('vendor/add_product', {
                title: 'Add Product',
                vendor: req.vendor,
                alert
            })
        }
        const filename = new Date().toISOString().replace(/:/g, '-') + req.file.originalname;
        const product = new Product({
            category: req.body.category,
            subcategory: req.body.subCategory,
            company: req.body.company,
            productname: req.body.productName,
            type: req.body.type,
            productweight: req.body.productWeight,
            qtyweight: req.body.qtyWeight,
            unit: req.body.unit,
            saleprice: req.body.salePrice,
            totalprice: req.body.totalPrice,
            image: '/uploads/product/' + filename,
            title: req.body.title,
            description: req.body.description,
            vendor: req.vendor.id
        })
        // fs.access('./public/uploads/product', (err) => { if (err) fs.mkdirSync('./public/uploads/product'); });
        if (!fs.existsSync('./public/uploads/product')) {
            fs.mkdirSync('./public/uploads/product', { recursive: true });
        }
        await sharp(req.file.buffer)
            .resize({ width: 1000, height: 723 })
            .toFile('./public/uploads/product/' + filename);
        await product.save();
        req.flash('success', `Product added successfully`);
        res.redirect('/vendor/product');
    } catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
})

// GET edit product
router.get("/edit/:id", checkVendor, async (req, res) => {
    try {
        const id = req.params.id;
        const product = await Product.findOne({ _id: id, vendor: req.vendor.id });
        if (product == null) {
            req.flash('danger', `Product not found!`);
            return res.redirect('/vendor/product');
        }
        const cats = await Category.find();
        let array = {}
        for (let i = 0; i < cats.length; i++) {
            const subcats = await Subcategory.find({ category: cats[i].id });
            array[cats[i].id] = subcats
        }
        const units = await Unit.find();
        res.status(201).render("vendor/edit_product", {
            title: 'Edit Product',
            vendor: req.vendor,
            product,
            cats,
            units,
            array: array
        });
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('danger', `Product not found!`);
            res.redirect('/vendor/product');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

// POST edit product
router.post('/edit/:id', checkVendor, upload.single('image'), [
    check('category', 'Please enter category.').notEmpty(),
    check('productName', 'Please enter productName.').notEmpty(),
    check('type', 'Please enter valid type.').notEmpty(),
    check('salePrice', 'Please enter valid salePrice.').notEmpty(),
], async (req, res) => {
    try {
        const validationErrors = validationResult(req)
        if (validationErrors.errors.length > 0) {
            const alert = validationErrors.array()
            return res.render('vendor/add_product', {
                title: 'Add Product',
                vendor: req.vendor,
                alert
            })
        }
        const id = req.params.id;
        const product = await Product.findOne({ _id: id, vendor: req.vendor.id });
        if (product == null) {
            req.flash('danger', `Product not found!`);
            return res.redirect('/vendor/product');
        }
        product.category = req.body.category;
        product.subcategory = req.body.subCategory;
        product.company = req.body.company;
        product.productname = req.body.productName;
        product.type = req.body.type;
        product.productweight = req.body.productWeight;
        product.qtyweight = req.body.qtyWeight;
        product.unit = req.body.unit;
        product.saleprice = req.body.salePrice;
        product.totalprice = req.body.totalPrice;
        product.title = req.body.title;
        product.description = req.body.description;
        product.vendor = req.vendor.id;
        if (typeof req.file !== 'undefined') {
            oldImage = "public" + product.image;
            fs.remove(oldImage, function (err) {
                if (err) { console.log(err); }
            })
            const filename = new Date().toISOString().replace(/:/g, '-') + req.file.originalname;
            product.image = '/uploads/product/' + filename;
            // fs.access('./public/uploads/product', (err) => { if (err) fs.mkdirSync('./public/uploads/product'); });
            if (!fs.existsSync('./public/uploads/product')) {
                fs.mkdirSync('./public/uploads/product', { recursive: true });
            }
            await sharp(req.file.buffer)
                .resize({ width: 1000, height: 723 })
                .toFile('./public/uploads/product/' + filename);
        }
        await product.save();
        req.flash('success', `Product Edited successfully`);
        res.redirect('/vendor/product')
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('danger', `Product not found!`);
            res.redirect('/vendor/product');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

// GET delete product
router.get("/delete/:id", checkVendor, async (req, res) => {
    try {
        const id = req.params.id;
        // const product = await Product.findByIdAndRemove(id);
        const product = await Product.findOneAndRemove({ _id: id, vendor: req.vendor.id });
        image = "public" + product.image;
        fs.remove(image, function (err) {
            if (err) { console.log(err); }
        })
        req.flash('success', `Product Deleted successfully`);
        res.redirect('/vendor/product')
    } catch (error) {
        if (error.name === 'CastError' || error.name === 'TypeError') {
            req.flash('danger', `Product not found!`);
            res.redirect('/vendor/product');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

module.exports = router;