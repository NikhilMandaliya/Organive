const express = require('express');
const router = express.Router();
const formatDate = require('../helpers/formateDate');

const checkAdmin = require('../middleware/authAdminMiddleware');

const Unit = require('../models/unitModel')

// GET units
router.get("/", checkAdmin, async (req, res) => {
    const units = await Unit.find();
    let updated = []
    for (let i = 0; i < units.length; i++) {
        let e = {
            id: units[i]._id,
            name: units[i].name,
            date: formatDate(new Date(units[i].date))
        }
        updated.push(e)
    }
    res.render("admin/units", {
        title: 'Unit Management',
        units: updated
    });
});

// GET add units
router.get("/add", checkAdmin, (req, res) => {
    res.status(201).render("admin/add_unit", {
        title: 'Add Unit',
    });
});

// POST add units
router.post("/add", checkAdmin, async (req, res) => {
    try {
        const unit = new Unit({ name: req.body.name });
        await unit.save();
        req.flash('success', 'Unit added successfully')
        res.redirect('/admin/unit');
    } catch (error) {
        if (error.code == 11000) {
            req.flash('danger', `Unit name '${req.body.name}' already exist!`);
            res.redirect('/admin/unit');
        } else {
            res.send(error.message)
        }
    }
});

// GET edit units
router.get("/edit/:id", checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const unit = await Unit.findById(id);
        if (unit == null) {
            req.flash('danger', `Unit not found!`);
            return res.redirect('/admin/unit');
        }
        res.status(201).render("admin/edit_unit", {
            title: 'Add Unit',
            unit
        });
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('danger', `Unit not found!`);
            res.redirect('/admin/unit');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

// POST edit units
router.post("/edit/:id", checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        await Unit.findByIdAndUpdate(id, { name: req.body.name });
        req.flash('success', 'Unit edited successfully')
        res.redirect('/admin/unit');
    } catch (error) {
        if (error.code == 11000) {
            req.flash('danger', `Unit name '${req.body.name}' already exist!`);
            res.redirect('/admin/unit');
        } else if (error.name === 'CastError' || error.name === 'TypeError') {
            req.flash('danger', `Unit not found!`);
            res.redirect('/admin/unit');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

// delete unit
router.get("/delete/:id", checkAdmin, async (req, res) => {
    try {
        await Unit.findByIdAndRemove(req.params.id);
        req.flash('success', 'Unit deleted successfully')
        res.redirect('/admin/unit');
    } catch (error) {
        if (error.name === 'CastError' || error.name === 'TypeError') {
            req.flash('danger', `Unit not found!`);
            res.redirect('/admin/unit');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

module.exports = router;