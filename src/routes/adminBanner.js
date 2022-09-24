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

// model
const Banner = require("../models/banner");
const formatDate = require('../helpers/formateDate');

// GET banner
router.get("/", checkAdmin, async (req, res) => {
    const banners = await Banner.find();
    let updated = []
    for (let i = 0; i < banners.length; i++) {
        let e = {
            id: banners[i]._id,
            image: banners[i].image,
            date: formatDate(new Date(banners[i].date))
        }
        updated.push(e)
    }
    res.status(201).render("admin/banner", {
        title: 'Banner List',
        banners: updated
    });
});

// GET add banner
router.get("/add", checkAdmin, (req, res) => {
    res.status(201).render("admin/add_banners", {
        title: 'Add Banner'
    });
});

// add new banner
router.post("/add", checkAdmin, upload.single('image'), async (req, res) => {
    try {
        const validationErrors = validationResult(req)
        if (validationErrors.errors.length > 0) {
            const alert = validationErrors.array()
            return res.render('admin/add_banners', {
                title: 'Add Banner',
                alert
            })
        }
        const filename = new Date().toISOString().replace(/:/g, '-') + req.file.originalname;
        const banner = new Banner({
            image: '/uploads/banner/' + filename
        })
        // fs.access('./public/uploads/banner', (err) => { if (err) fs.mkdirSync('./public/uploads/banner'); });
        if (!fs.existsSync('./public/uploads/banner')) {
            fs.mkdirSync('./public/uploads/banner', { recursive: true });
        }
        await sharp(req.file.buffer)
            .resize({ width: 1000, height: 723 })
            .toFile('./public/uploads/banner/' + filename);
        await banner.save();
        req.flash('success', `Banner added successfully`);
        res.redirect('/admin/banner');
    } catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
})

// GET edit Banner
router.get("/edit/:id", checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const banner = await Banner.findById(id);
        if (banner == null) {
            req.flash('danger', `Banner not found!`);
            return res.redirect('/admin/banner');
        }
        res.status(201).render("admin/edit_banners", {
            title: 'Edit Banner',
            banner
        });
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('danger', `Banner not found!`);
            res.redirect('/admin/banner');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

// POST edit banner
router.post("/edit/:id", checkAdmin, upload.single('image'), async (req, res) => {
    try {
        const validationErrors = validationResult(req)
        if (validationErrors.errors.length > 0) {
            const alert = validationErrors.array()
            console.log(alert);
            return res.render('edit_banners', {
                title: 'Edit Banner',
                alert
            })
        }
        const id = req.params.id;
        const banner = await Banner.findById(id);
        if (banner == null) {
            req.flash('danger', `Banner not found!`);
            return res.redirect('/admin/banner');
        }
        if (typeof req.file !== 'undefined') {
            oldImage = "public" + banner.image;
            fs.remove(oldImage, function (err) {
                if (err) { console.log(err); }
            })
            const filename = new Date().toISOString().replace(/:/g, '-') + req.file.originalname;
            banner.image = '/uploads/banner/' + filename;
            // fs.access('./public/uploads/banner', (err) => { if (err) fs.mkdirSync('./public/uploads/banner'); });
            if (!fs.existsSync('./public/uploads/banner')) {
                fs.mkdirSync('./public/uploads/banner', { recursive: true });
            }
            await sharp(req.file.buffer)
                // .resize({ width:1000, height:723 })
                .toFile('./public/uploads/banner/' + filename);
        }
        await banner.save();
        req.flash('success', 'Banner edited successfully.')
        res.redirect('/admin/banner');
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('danger', `Banner not found!`);
            res.redirect('/admin/banner');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

// GET delete banner
router.get("/delete/:id", checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const banner = await Banner.findByIdAndRemove(id);
        image = "public" + banner.image;
        fs.remove(image, function (err) {
            if (err) { console.log(err); }
        })
        req.flash('success', `Banner Deleted successfully`);
        res.redirect('/admin/banner')
    } catch (error) {
        if (error.name === 'CastError' || error.name === 'TypeError') {
            req.flash('danger', `Banner not found!`);
            res.redirect('/admin/banner');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

module.exports = router;