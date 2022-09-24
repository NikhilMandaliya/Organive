const express = require('express');
const router = express.Router();
// const mongoose = require('mongoose');

// const checkUser = require('../middleware/authMiddleware');
const checkStore = require('../middleware/selectedStore');
const checkUserAndStore = require('../middleware/checkUserAndStore');

// models
const Category = require('../models/category');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');

// home
router.get("/", checkUserAndStore, async (req, res) => {
// router.get("/", checkUser, checkStore, async (req, res) => {
    if (req.user) {
        var cart = await Cart.findOne({ userId: req.user.id, vendorId: req.store });
        var cartLength = cart.products.length;
    } else {
        const storeId = req.store;
        var cartLength = req.session.cart ? (req.session.cart[storeId] ? req.session.cart[storeId].length : 0) : 0;
    }
    req.session.redirectToUrl = req.originalUrl;
    const search = req.query.search;
    if (search) {   // search page
        const searchString = search.trim();
        const regex = new RegExp(searchString.replace(/\s+/g, "\\s+"), "gi");

        const [searchProds, searchCats, cats] = await Promise.all([
            Product.find({ 'productname': { $regex: regex }, vendor: req.store }),
            Category.find({ 'name': { $regex: regex } }),
            Category.find({ featured: true }),
        ])
        
        res.render("search", {
            title: `Search for ${searchString}`,
            user: req.user,
            storename: req.storename,
            cartLength,
            cats,
            searchString,
            searchCats,
            searchProds
        });
    } else {    // homepage
        const [cats, prods] = await Promise.all([
            Category.find({ featured: true }),
            Product.find({ featured: true, vendor: req.store })
        ])
        res.render("index", {
            title: "Home",
            user: req.user,
            storename: req.storename,
            cats,
            cartLength,
            prods
        });
    }
});

// autocomplete search api
router.get('/autocomplete', checkStore, async (req, res) => {
    const search = req.query.term;
    const t1 = Date.now()

    // // regex
    const searchString = search.replace('/', '').replace('\\', '').trim();
    const regex = new RegExp(searchString.replace(/\s+/g, "\\s+"), "gi");
    const searchProds = await Product.find({ 'productname': { $regex: regex }, vendor: req.store }).limit(5);

    // // search
    // const pipeline = [
    //     {
    //         $search: {
    //             autocomplete: {
    //                 path: 'productname',
    //                 query: search,
    //             },
    //         },
    //     },
    //     {
    //         $match: { vendor:  new mongoose.Types.ObjectId(req.store) }
    //     },
    //     {
    //         $limit: 5,
    //     },
    //     {
    //         $project: {
    //             productname: 1,
    //         },
    //     },
    // ]
    // const searchProds = await Product.aggregate(pipeline);

    const t2 = Date.now()
    console.log(t2 - t1);
    // console.log(searchProds);
    res.json(searchProds);
});

module.exports = router;