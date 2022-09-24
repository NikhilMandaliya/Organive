const express = require('express');
const router = express.Router();
const formatDate = require('../helpers/formateDate');

const checkAdmin = require('../middleware/authAdminMiddleware');

const Promo = require('../models/promoModel');

// GET promo
router.get("/", checkAdmin, async (req, res) => {
    const promos = await Promo.find();
    let updated = []
    for (let i = 0; i < promos.length; i++) {
        let e = {
            id: promos[i]._id,
            promo: promos[i].promo,
            times: promos[i].times,
            type: promos[i].type,
            minAmount: promos[i].minAmount,
            price: promos[i].price,
            percentage: promos[i].percentage,
            date: formatDate(new Date(promos[i].date)),
            dateCreated: formatDate(new Date(promos[i].dateCreated))
        }
        updated.push(e)
    }
    res.status(201).render("admin/promo", {
        title: 'Promocode',
        promos: updated
    });
});

// GET add promo
router.get("/add", checkAdmin, (req, res) => {
    res.status(201).render("admin/add_promo", {
        title: 'Add Promocode',
    });
});

// POST add promo
router.post('/add', checkAdmin, async (req, res) => {
    try {
        const promo = new Promo({
            promo: req.body.promo,
            times: req.body.times,
            date: new Date(req.body.date),
            type: req.body.type,
            minAmount: req.body.minAmount,
            price: req.body.price,
            percentage: req.body.percentage,
            desc: req.body.desc
        });
        await promo.save();
        req.flash('success', 'Promocode added successfully.')
        res.redirect('/admin/promo');
    } catch (error) {
        console.log(error);
        res.send(error.message)
    }
})

// GET edit promo
router.get("/edit/:id", checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const promo = await Promo.findById(id);
        if (promo == null) {
            req.flash('danger', `Promo not found!`);
            return res.redirect('/admin/promo');
        }
        d = new Date(promo.date);
        promo.date = d.toISOString().split('T')[0];
        res.status(201).render("admin/edit_promo", {
            title: 'Edit Promo',
            promo
        });
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('danger', `Promo not found!`);
            res.redirect('/admin/promo');
        } else {
            console.log(error);
            res.send(error.message)
        }
    }
});

// POST edit promo
router.post("/edit/:id", checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        await Promo.findByIdAndUpdate(id, {
            promo: req.body.promo,
            times: req.body.times,
            date: new Date(req.body.date),
            type: req.body.type,
            minAmount: req.body.minAmount,
            price: req.body.price,
            percentage: req.body.percentage,
            desc: req.body.desc
        });
        req.flash('success', 'Promo edited successfully.')
        res.redirect('/admin/promo');
    } catch (error) {
        if (error.name === 'CastError' || error.name === 'TypeError') {
            req.flash('danger', `Promo not found!`);
            res.redirect('/admin/promo');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

// delete promo
router.get("/delete/:id", checkAdmin, async (req, res) => {
    try {
        await Promo.findByIdAndRemove(req.params.id);
        req.flash('success', 'Promo deleted successfully.')
        res.redirect('/admin/promo');
    } catch (error) {
        if (error.name === 'CastError' || error.name === 'TypeError') {
            req.flash('danger', `Promo not found!`);
            res.redirect('/admin/promo');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

module.exports = router;