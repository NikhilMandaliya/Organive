const express = require('express');
const router = express.Router();

// const checkUser = require('../middleware/authMiddleware');
// const checkStore = require('../middleware/selectedStore');
const checkUserAndStore = require('../middleware/checkUserAndStore');

// models
const Category = require('../models/category');
const Subcategory = require('../models/subcategory');
const Product = require('../models/productModel');
const Unit = require('../models/unitModel');
const Cart = require('../models/cartModel');

// product detail
router.get('/detail/:id', checkUserAndStore, async function (req, res) {
    req.session.redirectToUrl = req.originalUrl;
    try {
        if (req.user) {
            var cart = await Cart.findOne({ userId: req.user.id, vendorId: req.store });
            var cartLength = cart.products.length;
        } else {
            const storeId = req.store;
            var cartLength = req.session.cart ? (req.session.cart[storeId] ? req.session.cart[storeId].length : 0) : 0;
        }
        const id = req.params.id;
        const product = await Product.findOne({ _id: id, vendor: req.store });
        if (!product) {
            console.log(`Product not found with id: ${id}`);
            return res.redirect('/404');
        }
        const [category, subcategory, unit] = await Promise.all([
            Category.findById(product.category),
            Subcategory.findById(product.subcategory),
            Unit.findById(product.unit),
        ])
        res.render('product_detail', {
            // title:'Product detail',
            title: product.productname,
            product,
            cat: category.name,
            subcat: subcategory.name,
            unit: unit ? unit.name : "",
            cartLength,
            storename: req.storename,
            user: req.user
        });
    } catch (error) {
        console.log(error);
        if (error.name === 'CastError' || error.name === 'TypeError') {
            res.redirect('/404');
        } else {
            res.send(error)
        }
    }
});

//GET products by category
router.get('/:cat/:sub?', checkUserAndStore, async function (req, res) {
    try {
        if (req.user) {
            var cart = await Cart.findOne({ userId: req.user.id, vendorId: req.store });
            var cartLength = cart.products.length;
        } else {
            var storeId = req.store;
            var cartLength = req.session.cart ? (req.session.cart[storeId] ? req.session.cart[storeId].length : 0) : 0;
        }
        req.session.redirectToUrl = req.originalUrl;
        const { cat, sub } = req.params;
        if (sub == undefined) {
            const cats = await Category.find();
            if (cat == 'all') {
                var [subcats, prods] = await Promise.all([
                    Subcategory.find(),
                    Product.find({ vendor: req.store }),
                ])
                var SubcatOf = `total`;
                var ProdOf = `total`;
            } else {
                var [subcats, prods, category] = await Promise.all([
                    Subcategory.find({ category: cat }),
                    Product.find({ category: cat, vendor: req.store }),
                    Category.findById(cat),
                ])
                const catName = category.name;
                var SubcatOf = `of ${catName}`;
                var ProdOf = `of ${catName}`;
            }
            res.render('all_products', {
                title: 'Products page',
                subcats,
                cats,
                prods,
                SubcatOf,
                ProdOf,
                cartLength,
                storename: req.storename,
                user: req.user
            });
        } else {
            var [prods, subcategory] = await Promise.all([
                Product.find({ subcategory: sub, vendor: req.store }),
                Subcategory.findById(sub),
            ])
            const subName = subcategory.name;
            var ProdOf = `of ${subName}`;
            res.render('products_per_subcat', {
                title: 'Products page',
                prods,
                ProdOf,
                cartLength,
                storename: req.storename,
                user: req.user
            });
        }
    } catch (error) {
        if (error.name === 'CastError' || error.name === 'TypeError') {
            console.log(error);
            res.redirect('/404');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

module.exports = router;