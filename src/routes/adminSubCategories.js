const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const formatDate = require('../helpers/formateDate');

const checkAdmin = require('../middleware/authAdminMiddleware');

const fs = require('fs-extra');
const sharp = require('sharp');
const multer = require('multer');
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
const Subcategory = require('../models/subcategory');
const Category = require('../models/category');
const Product = require('../models/productModel');

// GET subcategory
router.get("/", checkAdmin, async (req, res) => {
    const cats = await Category.find();
    const subcats = await Subcategory.find();

    let updated = []
    for (let i = 0; i < subcats.length; i++) {
        let cat = cats.find(o => o.id == subcats[i].category);
        if (cat == undefined) {
            await Subcategory.findByIdAndRemove(subcats[i]._id);
        } else {
            let e = {
                id: subcats[i]._id,
                name: subcats[i].name,
                category: cat.name,
                // categoryName: subcats[i].categoryName,
                image: subcats[i].image,
                date: formatDate(new Date(subcats[i].date))
            }
            updated.push(e)
        }
    }
    res.status(201).render("admin/subcategory", {
        title: 'Subcategory List',
        subcats: updated
    });
});

// GET add subcategory
router.get("/add", checkAdmin, async (req, res) => {
    const cats = await Category.find();
    res.status(201).render("admin/add_subcategory", {
        title: 'Add Sub Category',
        cats
    });
});

// POST add subcategory
router.post('/add', checkAdmin, upload.single('image'), [
    check('name', 'Sub category name must have a value').notEmpty(),
    check('category', 'Please select Category name').notEmpty(),
], async (req, res) => {
    try {
        const { name, category } = req.body;
        const validationErrors = validationResult(req)
        if (validationErrors.errors.length > 0) {
            const alert = validationErrors.array()
            const cats = await Category.find();
            return res.render('admin/add_subcategory', {
                title: 'Add Sub Category',
                alert,
                cats
            })
        }
        const filename = new Date().toISOString().replace(/:/g, '-') + req.file.originalname;
        const subcat = new Subcategory({
            name,
            category,
            image: '/uploads/subcategory/' + filename
        })
        // fs.access('./public/uploads/subcategory', (err) => { if (err) fs.mkdirSync('./public/uploads/subcategory'); });
        if (!fs.existsSync('./public/uploads/subcategory')) {
            fs.mkdirSync('./public/uploads/subcategory', { recursive: true });
        }
        await sharp(req.file.buffer)
            .resize({ width: 1000, height: 723 })
            .toFile('./public/uploads/subcategory/' + filename);
        await subcat.save();
        req.flash('success', `Sub Category added successfully`);
        res.redirect('/admin/subcategory')
    } catch (error) {
        console.log(error.message);
        if (error.code == 11000) {
            req.flash('danger', `Sub Category name '${req.body.name}' already exist!`);
            res.redirect('/admin/subcategory');
        } else {
            res.send(error.message);
            console.log(error);
        }
    }
});

// GET edit subcategory
router.get("/edit/:id", checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const cats = await Category.find();
        const subcats = await Subcategory.findById(id);
        if (subcats == null) {
            req.flash('danger', `Sub Category not found!`);
            return res.redirect('/admin/subcategory');
        }
        res.status(201).render("admin/edit_subcategory", {
            title: 'Edit Sub Category',
            cats,
            subcats
        });
    } catch (error) {
        if (error.name === 'CastError') {
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

// POST edit subcategory
router.post('/edit/:id', checkAdmin, upload.single('image'), [
    check('name', 'Sub category name must have a value').notEmpty(),
    check('category', 'Please select Category name').notEmpty(),
], async (req, res) => {
    try {
        const { name, category } = req.body;
        const validationErrors = validationResult(req)
        if (validationErrors.errors.length > 0) {
            const alert = validationErrors.array()
            const cats = await Category.find();
            return res.render('admin/edit_subcategory', {
                title: 'Edit Sub Category',
                alert,
                cats
            })
        }
        const id = req.params.id;
        const subcat = await Subcategory.findById(id);
        subcat.name = name;
        subcat.category = category;
        if (typeof req.file !== 'undefined') {
            oldImage = "public" + subcat.image;
            fs.remove(oldImage, function (err) {
                if (err) { console.log(err); }
            })
            const filename = new Date().toISOString().replace(/:/g, '-') + req.file.originalname;
            subcat.image = '/uploads/subcategory/' + filename;
            // fs.access('./public/uploads/subcategory', (err) => { if (err) fs.mkdirSync('./public/uploads/subcategory'); });
            if (!fs.existsSync('./public/uploads/subcategory')) {
                fs.mkdirSync('./public/uploads/subcategory', { recursive: true });
            }
            await sharp(req.file.buffer)
                .resize({ width: 1000, height: 723 })
                .toFile('./public/uploads/subcategory/' + filename);
        }
        await subcat.save();
        req.flash('success', `Sub Category Edited successfully`);
        res.redirect('/admin/subcategory')
    } catch (error) {
        console.log(error.message);
        if (error.code == 11000) {
            req.flash('danger', `Sub Category name '${req.body.name}' already exist!`);
            // res.redirect('/admin/subcategory');
            res.redirect(`/admin/subcategory/edit/${req.params.id}`);
        } else if (error.name === 'CastError' || error.name === 'TypeError') {
            req.flash('danger', `Sub Category not found!`);
            res.redirect('/admin/subcategory');
        } else {
            res.send(error.message);
            console.log(error);
        }
    }
});

// GET delete subcategory
router.get("/delete/:id", checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const cat = await Subcategory.findByIdAndRemove(id);
        await Product.deleteMany({ subcategory: cat.id });
        image = "public" + cat.image;
        fs.remove(image, function (err) {
            if (err) { console.log(err); }
        })
        req.flash('success', `Subcategory Deleted successfully`);
        res.redirect('/admin/subcategory')
    } catch (error) {
        if (error.name === 'CastError' || error.name === 'TypeError') {
            req.flash('danger', `Sub Category not found!`);
            res.redirect('/admin/subcategory');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

module.exports = router;