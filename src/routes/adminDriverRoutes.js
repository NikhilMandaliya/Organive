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

const Driver = require('../models/driverModel');
const AdminCommission = require('../models/adminCommisionModel');

// Get driver details
router.get("/", checkAdmin, async (req, res) => {
    const drivers = await Driver.find();
    await AdminCommission.find();
    res.status(201).render("admin/driver", {
        title: 'Driver List',
        drivers
    });
});

// Get add driver
router.get("/add", checkAdmin, (req, res) => {
    res.status(201).render("admin/add_driver", {
        title: 'Add Driver'
    });
});

// POST add driver
router.post("/add", checkAdmin, upload.fields([
    { name: 'driverImage', maxCount: 1 },
    { name: 'vehicleImage', maxCount: 1 },
    { name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 }
]), [
    check('name', 'Please enter Name.').notEmpty(),
    check('email', 'Please enter valid email.').isEmail(),
    check('password', 'Password should be atleast 6 characters long.').isLength({ min: 6 }),
    check('number', 'Plaese enter contact number.').notEmpty(),
    check('Bankname', 'Please enter bank name.').notEmpty(),
    check('Accountnumber', 'Please enter account number.').notEmpty(),
    check('IFSCcode', 'Plaese enter IFSC code.').notEmpty(),
], async (req, res) => {
    try {
        const validationErrors = validationResult(req)
        if (validationErrors.errors.length > 0) {
            const alert = validationErrors.array()
            console.log(alert);
            return res.render('admin/add_driver', {
                title: 'Add Driver',
                alert
            })
        }
        const driverExist = await Driver.findOne({ email: req.body.email })
        if (driverExist) {
            return res.render('admin/add_driver', {
                title: 'Add Driver',
                alert: [{ msg: 'Driver is already registerd with this Email.' }]
            })
        }
        const file1name = new Date().toISOString().replace(/:/g, '-') + req.files.driverImage[0].originalname;
        const file2name = new Date().toISOString().replace(/:/g, '-') + req.files.vehicleImage[0].originalname;
        const file3name = new Date().toISOString().replace(/:/g, '-') + req.files.frontImage[0].originalname;
        const file4name = new Date().toISOString().replace(/:/g, '-') + req.files.backImage[0].originalname;
        const driver = new Driver({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            number: req.body.number,
            Bankname: req.body.Bankname,
            Accountnumber: req.body.Accountnumber,
            IFSCcode: req.body.IFSCcode
        })
        driver.image = `/uploads/driver/${driver.id}/` + file1name;
        driver.vehicleimage = `/uploads/driver/${driver.id}/` + file2name;
        driver.frontimage = `/uploads/driver/${driver.id}/` + file3name;
        driver.backimage = `/uploads/driver/${driver.id}/` + file4name;

        // fs.access('./public/uploads/driver', (err) => { if (err) fs.mkdirSync('./public/uploads/driver'); });
        // fs.access(`./public/uploads/driver/${driver.id}`, (err) => { if (err) fs.mkdirSync(`./public/uploads/driver/${driver.id}`); });
        if (!fs.existsSync('./public/uploads/driver')) {
            fs.mkdirSync('./public/uploads/driver', { recursive: true });
        }
        if (!fs.existsSync(`./public/uploads/driver/${driver.id}`)) {
            fs.mkdirSync(`./public/uploads/driver/${driver.id}`, { recursive: true });
        }
        await sharp(req.files.driverImage[0].buffer)
            .toFile(`./public/uploads/driver/${driver.id}/` + file1name);
        await sharp(req.files.vehicleImage[0].buffer)
            .toFile(`./public/uploads/driver/${driver.id}/` + file2name);
        await sharp(req.files.frontImage[0].buffer)
            .toFile(`./public/uploads/driver/${driver.id}/` + file3name);
        await sharp(req.files.backImage[0].buffer)
            .toFile(`./public/uploads/driver/${driver.id}/` + file4name);

        await driver.save();
        req.flash('success', 'Driver added successfully')
        res.redirect('/admin/driver');
    } catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
})

// GET edit driver
router.get("/edit/:id", checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const driver = await Driver.findById(id);
        if (driver == null) {
            req.flash('danger', `Driver not found!`);
            return res.redirect('/admin/driver');
        }
        res.status(201).render("admin/edit_driver", {
            title: 'Edit Driver',
            driver
        });
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('danger', `Driver not found!`);
            res.redirect('/admin/driver');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

// POST Edit driver
router.post('/edit/:id', checkAdmin, upload.fields([
    { name: 'driverImage', maxCount: 1 },
    { name: 'vehicleImage', maxCount: 1 },
    { name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 }
]), [
    check('name', 'Please enter Name.').notEmpty(),
    check('number', 'Plaese enter contact number.').notEmpty(),
    check('Bankname', 'Please enter bank name.').notEmpty(),
    check('Accountnumber', 'Please enter account number.').notEmpty(),
    check('IFSCcode', 'Plaese enter IFSC code.').notEmpty(),
], async (req, res) => {
    try {
        const validationErrors = validationResult(req)
        if (validationErrors.errors.length > 0) {
            const alert = validationErrors.array()
            return res.render('admin/edit_driver', {
                title: 'Edit Driver',
                alert
            })
        }
        const id = req.params.id;
        const driver = await Driver.findById(id);
        if (driver == null) {
            req.flash('danger', `Driver not found!`);
            return res.redirect('/admin/driver');
        }
        driver.name = req.body.name;
        driver.number = req.body.number;
        driver.Bankname = req.body.Bankname;
        driver.Accountnumber = req.body.Accountnumber;
        driver.IFSCcode = req.body.IFSCcode;

        if (typeof req.files.driverImage !== 'undefined') {
            oldImage = "public" + driver.image;
            fs.remove(oldImage, function (err) {
                if (err) { console.log(err); }
            })
            const filename = new Date().toISOString().replace(/:/g, '-') + req.files.driverImage[0].originalname;
            driver.image = `/uploads/driver/${driver.id}/` + filename;
            // fs.access(`./public/uploads/driver/${driver.id}`, (err) => { if (err) fs.mkdirSync(`./public/uploads/driver/${driver.id}`); });
            if (!fs.existsSync(`./public/uploads/driver/${driver.id}`)) {
                fs.mkdirSync(`./public/uploads/driver/${driver.id}`, { recursive: true });
            }
            await sharp(req.files.driverImage[0].buffer)
                .toFile(`./public/uploads/driver/${driver.id}/` + filename);
        }
        if (typeof req.files.vehicleImage !== 'undefined') {
            oldImage = "public" + driver.vehicleimage;
            fs.remove(oldImage, function (err) {
                if (err) { console.log(err); }
            })
            const filename = new Date().toISOString().replace(/:/g, '-') + req.files.vehicleImage[0].originalname;
            driver.vehicleimage = `/uploads/driver/${driver.id}/` + filename;
            // fs.access(`./public/uploads/driver/${driver.id}`, (err) => { if (err) fs.mkdirSync(`./public/uploads/driver/${driver.id}`); });
            if (!fs.existsSync(`./public/uploads/driver/${driver.id}`)) {
                fs.mkdirSync(`./public/uploads/driver/${driver.id}`, { recursive: true });
            }
            await sharp(req.files.vehicleImage[0].buffer)
                .toFile(`./public/uploads/driver/${driver.id}/` + filename);
        }
        if (typeof req.files.frontImage !== 'undefined') {
            oldImage = "public" + driver.frontimage;
            fs.remove(oldImage, function (err) {
                if (err) { console.log(err); }
            })
            const filename = new Date().toISOString().replace(/:/g, '-') + req.files.frontImage[0].originalname;
            driver.frontimage = `/uploads/driver/${driver.id}/` + filename;
            // fs.access(`./public/uploads/driver/${driver.id}`, (err) => { if (err) fs.mkdirSync(`./public/uploads/driver/${driver.id}`); });
            if (!fs.existsSync(`./public/uploads/driver/${driver.id}`)) {
                fs.mkdirSync(`./public/uploads/driver/${driver.id}`, { recursive: true });
            }
            await sharp(req.files.frontImage[0].buffer)
                .toFile(`./public/uploads/driver/${driver.id}/` + filename);
        }
        if (typeof req.files.backImage !== 'undefined') {
            oldImage = "public" + driver.backimage;
            fs.remove(oldImage, function (err) {
                if (err) { console.log(err); }
            })
            const filename = new Date().toISOString().replace(/:/g, '-') + req.files.backImage[0].originalname;
            driver.backimage = `/uploads/driver/${driver.id}/` + filename;
            // fs.access(`./public/uploads/driver/${driver.id}`, (err) => { if (err) fs.mkdirSync(`./public/uploads/driver/${driver.id}`); });
            if (!fs.existsSync(`./public/uploads/driver/${driver.id}`)) {
                fs.mkdirSync(`./public/uploads/driver/${driver.id}`, { recursive: true });
            }
            await sharp(req.files.backImage[0].buffer)
                .toFile(`./public/uploads/driver/${driver.id}/` + filename);
        }

        await driver.save();
        req.flash('success', `Driver Edited successfully`);
        res.redirect('/admin/driver')
    } catch (error) {
        console.log(error.message);
        if (error.code == 11000) {
            req.flash('danger', `Driver already registed with '${req.body.email}'!`);
            res.redirect(`/admin/driver/edit/${req.params.id}`);
        } else if (error.name === 'CastError') {
            req.flash('danger', `Driver not found!`);
            res.redirect('/admin/driver');
        } else {
            res.send(error.message);
            console.log(error);
        }
    }
});

// GET delete driver
router.get("/delete/:id", checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const driver = await Driver.findByIdAndRemove(id);

        fs.rmSync(`./public/uploads/driver/${driver.id}`, { recursive: true, force: true });

        req.flash('success', `Driver Deleted successfully`);
        res.redirect('/admin/driver');
    } catch (error) {
        if (error.name === 'CastError' || error.name === 'TypeError') {
            req.flash('danger', `Driver not found!`);
            res.redirect('/admin/driver');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

// Get driver transaction
router.get("/transaction", checkAdmin, (req, res) => {
    res.status(201).render("admin/driver_transaction", {
        title: 'Driver Transaction'
    });
});

// GET driver charge
router.get('/charge', checkAdmin, async (req, res) => {
    const commission = await AdminCommission.findOne();
    res.status(201).render("admin/driver_charge", {
        title: 'Driver Charge',
        commission
    });
})

// POST driver charge
router.post('/charge', checkAdmin, async (req, res) => {
    try {
        await AdminCommission.findOneAndUpdate({ driverCharge: req.body.driverCharge });
        req.flash('success', 'Updated successfully.');
        res.redirect('/admin/driver/charge');
    } catch (error) {
        console.log(error);
        req.flash('error', error.message);
        res.redirect('/admin/driver/charge');
    }
})

module.exports = router;