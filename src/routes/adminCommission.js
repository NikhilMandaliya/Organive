const express = require('express');
const router = express.Router();

const checkAdmin = require('../middleware/authAdminMiddleware');

const AdminCommission = require('../models/adminCommisionModel');

// GET admin commission
router.get('/commission', checkAdmin, async (req, res) => {
    const commission = await AdminCommission.findOne();
    res.status(201).render("admin/admin_commission", {
        title: 'Admin Commission',
        commission
    });
})

// POST admin commission
router.post('/commission', checkAdmin, async (req, res) => {
    try {
        await AdminCommission.findOneAndUpdate({ percent: req.body.percent });
        req.flash('success', 'Updated successfully.');
        res.redirect('/admin/commission');
    } catch (error) {
        console.log(error);
        req.flash('error', error.message);
        res.redirect('/admin/commission');
    }
})

module.exports = router;