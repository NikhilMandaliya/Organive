const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const formatDate = require('../helpers/formateDate');

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
        fileSize: 1024 * 1024 * 10
    },
    fileFilter: fileFilter
});

// GET model
const Category = require('../models/category');
const Subategory = require('../models/subcategory');
const Product = require('../models/productModel');

// GET category
router.get("/", checkAdmin, async (req, res) => {
    const cats = await Category.find();
    let updated = []
    for (let i = 0; i < cats.length; i++) {
        let e = {
            id: cats[i]._id,
            name: cats[i].name,
            tax: cats[i].tax,
            image: cats[i].image,
            date: formatDate(new Date(cats[i].date))
        }
        updated.push(e)
    }
    res.status(201).render("admin/category", {
        title: 'Category List',
        cats: updated
    });
});

// GET add category
router.get("/add", checkAdmin, (req, res) => {
    res.render("admin/add_category", {
        title: 'Add Category'
    });
});

// POST add category
router.post('/add', checkAdmin, upload.single('image'), [
    check('name', 'Category name must have a value').notEmpty(),
    check('tax', 'Category tax must have a value').notEmpty(),
], async (req, res) => {
    try {
        const { name, tax } = req.body;
        const validationErrors = validationResult(req)
        if (validationErrors.errors.length > 0) {
            const alert = validationErrors.array()
            return res.render('admin/add_category', {
                title: 'Add Category',
                alert
            })
        }
        const filename = new Date().toISOString().replace(/:/g, '-') + req.file.originalname;
        const cat = new Category({
            name,
            tax,
            image: '/uploads/category/' + filename
        })
        if (req.body.featured) {
            cat.featured = true
        }
        // fs.access('./public/uploads/category', (err) => { if (err) fs.mkdirSync('./public/uploads/category'); });
        if (!fs.existsSync('./public/uploads/category')) {
            fs.mkdirSync('./public/uploads/category', { recursive: true });
        }
        await sharp(req.file.buffer)
            .resize({ width: 1000, height: 723 })
            .toFile('./public/uploads/category/' + filename);
        await cat.save();
        req.flash('success', `Category added successfully`);
        res.redirect('/admin/category')
    } catch (error) {
        if (error.code == 11000) {
            req.flash('danger', `Category name '${req.body.name}' already exist!`);
            res.redirect('/admin/category');
        } else {
            console.log(error);
            res.send(error.message);
        }
    }
});

// GET edit category
router.get("/edit/:id", checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const cat = await Category.findById(id);
        if (cat == null) {
            req.flash('danger', `Category not found!`);
            return res.redirect('/admin/category');
        }
        res.status(201).render("admin/edit_category", {
            title: 'Edit Category',
            cat
        });
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('danger', `Category not found!`);
            res.redirect('/admin/category');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

// POST Edit category
router.post('/edit/:id', checkAdmin, upload.single('image'), [
    check('name', 'Category name must have a value').notEmpty(),
    check('tax', 'Category tax must have a value').notEmpty(),
], async (req, res) => {
    try {
        const { name, tax } = req.body;
        const validationErrors = validationResult(req)
        if (validationErrors.errors.length > 0) {
            const alert = validationErrors.array()
            return res.render('admin/edit_category', {
                title: 'Edit Category',
                alert
            })
        }
        const id = req.params.id;
        const cat = await Category.findById(id);
        if (cat == null) {
            req.flash('danger', `Category not found!`);
            return res.redirect('/admin/category');
        }
        cat.name = name;
        cat.tax = tax;
        if (req.body.featured) {
            cat.featured = true;
        } else {
            cat.featured = false;
        }
        if (typeof req.file !== 'undefined') {
            oldImage = "public" + cat.image;
            fs.remove(oldImage, function (err) {
                if (err) { console.log(err); }
            })
            const filename = new Date().toISOString().replace(/:/g, '-') + req.file.originalname;
            cat.image = '/uploads/category/' + filename;
            // fs.access('./public/uploads/category', (err) => { if (err) fs.mkdirSync('./public/uploads/category'); });
            if (!fs.existsSync('./public/uploads/category')) {
                fs.mkdirSync('./public/uploads/category', { recursive: true });
            }
            await sharp(req.file.buffer)
                .resize({ width: 1000, height: 723 })
                .toFile('./public/uploads/category/' + filename);
        }
        await cat.save();
        req.flash('success', `Category Edited successfully`);
        res.redirect('/admin/category')
    } catch (error) {
        console.log(error.message);
        if (error.code == 11000) {
            req.flash('danger', `Category name '${req.body.name}' already exist!`);
            res.redirect(`/admin/category/edit/${req.params.id}`);
        } else if (error.name === 'CastError') {
            req.flash('danger', `Category not found!`);
            res.redirect('/admin/category');
        } else {
            res.send(error.message);
            console.log(error);
        }
    }
});

// GET delete category
router.get("/delete/:id", checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const cat = await Category.findByIdAndRemove(id);
        await Subategory.deleteMany({ category: cat.id });
        await Product.deleteMany({ category: cat.id });
        image = "public" + cat.image;
        fs.remove(image, function (err) {
            if (err) { console.log(err); }
        })
        req.flash('success', `Category Deleted successfully`);
        res.redirect('/admin/category')
    } catch (error) {
        if (error.name === 'CastError' || error.name === 'TypeError') {
            req.flash('danger', `Category not found!`);
            res.redirect('/admin/category');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

module.exports = router;