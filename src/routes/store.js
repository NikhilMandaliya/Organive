const express = require('express');
const router = express.Router();
const GeoPoint = require('geopoint');

const checkUser = require('../middleware/authMiddleware');

const Vendor = require('../models/vendorModel');
const Cart = require('../models/cartModel');

// GET select store
router.get('/', (req, res) => {
    res.render("store", {
        title: "Store Page",
        user: req.user,
        cartLength: 0,
        error: false
    });
});

// GET stores
router.post('/nearstore', async (req, res) => {
    const lat = parseFloat(req.body.lat);
    const lng = parseFloat(req.body.lng);

    const vendors = await Vendor.find({ status: 'Approved' });
    let nearStores = [];
    for (let i = 0; i < vendors.length; i++) {
        let point1 = new GeoPoint(lat, lng);
        let point2 = new GeoPoint(vendors[i].coords.lat, vendors[i].coords.lng);
        let distance = point1.distanceTo(point2, true)
        if (distance < vendors[i].deliveryrange) { nearStores.push(vendors[i]); }
    }
    // console.log(nearStores.length);
    if (nearStores.length == 0) {
        res.render("store", {
            title: "Store Page",
            user: req.user,
            cartLength: 0,
            error: true
        });
    } else {
        res.render("selectstore", {
            title: "Select Store",
            nearStores
        });
    }
});

// select store
router.get('/select/:id', checkUser, async (req, res) => {
    try {
        const id = req.params.id;
        const store = await Vendor.findById(id);
        if (store == null) { return res.redirect('/404'); }
        // create cart
        if (req.user) {
            const cartExist = await Cart.findOne({ userId: req.user.id, vendorId: id });
            if (!cartExist) {
                const cart = new Cart({
                    userId: req.user.id,
                    vendorId: id,
                    products: []
                })
                await cart.save();
            }
        }
        res.cookie("selectStore", id, {
            expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            httpOnly: true,
            // secure:true
        });
        res.redirect('/');
    } catch (error) {
        console.log(error);
        res.send(error);
    }
})

module.exports = router;