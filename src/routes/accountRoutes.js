const express = require('express');
const router = express.Router();
const formatDate = require('../helpers/formateDate');

// const checkUser = require('../middleware/authMiddleware');
// const checkStore = require('../middleware/selectedStore');
const checkUserAndStore = require('../middleware/checkUserAndStore');

const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');

// signup page
router.get("/signup", checkUserAndStore, async (req, res) => {
    if (req.user) {
        return res.redirect('/account');
    } else {
        const storeId = req.store;
        var cartLength = req.session.cart ? (req.session.cart[storeId] ? req.session.cart[storeId].length : 0) : 0;
    }
    res.status(201).render("account", {
        title: 'Signup | Signin',
        user: req.user,
        cartLength
    });
});

// my account page
router.get("/account", checkUserAndStore, async (req, res) => {
    if (!req.user) {
        return res.redirect('/signup');
    }
    var cart = await Cart.findOne({ userId: req.user.id, vendorId: req.store });
    var orders = await Order.find({ user: req.user.id });
    let updated = []
    for (let i = 0; i < orders.length; i++) {
        let e = {
            id: orders[i].id,
            products: orders[i].products,
            // totalamount: orders[i].totalamount,
            totalamount: orders[i].payableamount,
            paymentmode: orders[i].paymentmode,
            status: orders[i].status,
            date: formatDate(new Date(orders[i].orderdate))
        }
        updated.push(e)
    }
    var cartLength = cart.products.length;
    res.render('my_account', {
        title: 'My account',
        user: req.user,
        orders: updated,
        cartLength,
        storename: req.storename,
    });
});

module.exports = router;