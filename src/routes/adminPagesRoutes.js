const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const checkAdmin = require('../middleware/authAdminMiddleware');

const Page = require('../models/pageModel');
const Contact = require('../models/contactDetailModel');

// about us
router.get("/about_us", checkAdmin, async (req, res) => {
    try {
        const page = await Page.findOne({ title: 'About Us' })
        const content = page.content;
        res.status(201).render("admin/about", {
            title: 'About Us',
            content
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

router.post('/about_us', checkAdmin, [
    check('content', 'Content must have a value').notEmpty(),
], async function (req, res) {
    const validationErrors = validationResult(req)
    if (validationErrors.errors.length > 0) {
        req.flash('danger', 'Content must have a value.')
        return res.redirect('/admin/about_us')
    }
    try {
        const page = await Page.findOne({ title: 'About Us' })
        page.content = req.body.content;
        await page.save()
        req.flash('success', 'About us details updated successfully.')
        res.redirect('/admin/about_us')
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

// faqs
router.get("/faqs", checkAdmin, async (req, res) => {
    try {
        const page = await Page.findOne({ title: 'FAQs' })
        const content = page.content;
        res.status(201).render("admin/faqs", {
            title: 'FAQs',
            content
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

router.post('/faqs', checkAdmin, [
    check('content', 'Content must have a value').notEmpty(),
], async function (req, res) {
    const validationErrors = validationResult(req)
    if (validationErrors.errors.length > 0) {
        req.flash('danger', 'Content must have a value.')
        return res.redirect('/admin/faqs')
    }
    try {
        const page = await Page.findOne({ title: 'FAQs' })
        page.content = req.body.content;
        await page.save();
        req.flash('success', 'FAQs details updated successfully.')
        res.redirect('/admin/faqs')
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

// terms
router.get("/terms_con", checkAdmin, async (req, res) => {
    try {
        const page = await Page.findOne({ title: 'Terms & Conditions' })
        const content = page.content;
        res.status(201).render("admin/terms", {
            title: 'Terms & Conditions',
            content
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

router.post('/terms_con', checkAdmin, [
    check('content', 'Content must have a value').notEmpty(),
], async function (req, res) {
    const validationErrors = validationResult(req)
    if (validationErrors.errors.length > 0) {
        req.flash('danger', 'Content must have a value.')
        return res.redirect('/admin/terms_con')
    }
    try {
        const page = await Page.findOne({ title: 'Terms & Conditions' })
        page.content = req.body.content;
        await page.save()
        req.flash('success', 'Terms & Conditions details updated successfully.')
        res.redirect('/admin/terms_con')
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

// privacy
router.get("/privacy_policy", checkAdmin, async (req, res) => {
    try {
        const page = await Page.findOne({ title: 'Privacy Policy' })
        const content = page.content;
        res.status(201).render("admin/privacy", {
            title: 'Privacy Policy',
            content
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

router.post('/privacy_policy', checkAdmin, [
    check('content', 'Content must have a value').notEmpty(),
], async function (req, res) {
    const validationErrors = validationResult(req)
    if (validationErrors.errors.length > 0) {
        req.flash('danger', 'Content must have a value.')
        return res.redirect('/admin/privacy_policy')
    }
    try {
        const page = await Page.findOne({ title: 'Privacy Policy' })
        page.content = req.body.content;
        await page.save()
        req.flash('success', 'Privacy Policy updated successfully.')
        res.redirect('/admin/privacy_policy')
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

// contact
router.get("/contact", checkAdmin, async (req, res) => {
    try {
        const page = await Page.findOne({ title: 'Contact' })
        const content = page.content;
        const contact = await Contact.findOne();
        res.status(201).render("admin/contact", {
            title: 'Contact Us',
            content,
            contact
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

router.post('/contact', checkAdmin, [
    // check('content','Content must have a value').notEmpty(),
    check('phone', 'Phone must have a value').notEmpty(),
    check('email', 'Email must have a valid value').isEmail(),
    check('address', 'Address must have a value').notEmpty(),
], async function (req, res) {
    try {
        const page = await Page.findOne({ title: 'Contact' })
        const contact = await Contact.findOne();
        const content = page.content;

        const validationErrors = validationResult(req)
        if (validationErrors.errors.length > 0) {
            const alert = validationErrors.array()
            return res.render('admin/contact', {
                title: 'Contact',
                alert,
                content,
                contact
            })
        }
        page.content = req.body.content || '';
        await page.save()
        contact.phone = req.body.phone;
        contact.email = req.body.email;
        contact.address = req.body.address;
        await contact.save()
        // locals
        req.app.locals.contact = contact;

        req.flash('success', 'Contact deetails updated successfully.')
        res.redirect('/admin/contact')
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

module.exports = router;