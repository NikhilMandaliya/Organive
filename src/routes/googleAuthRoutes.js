const express = require('express');
const router = express.Router();
const passport = require('passport');

const Cart = require('../models/cartModel');

router.get('/', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/callback', passport.authenticate('google', { failureRedirect: '/failed' }),
    async (req, res) => {
        const user = req.myUser;
        const token = await user.generateAuthToken();
        res.cookie("jwt", token, {
            expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            httpOnly: true,
            // secure:true
        });
        const storeId = req.cookies['selectStore'];
        if (storeId) {
            if (req.session.cart == undefined) {
                req.session.cart = {};
                req.session.cart[storeId] = [];
            } else if (!req.session.cart[storeId]) {
                req.session.cart[storeId] = [];
            }
        }
        // CART: session to db
        const cartSession = req.session.cart;
        if (cartSession != undefined) {
            for (const [key, value] of Object.entries(cartSession)) {
                // console.log(`${key} ${value}`);
                var cart = await Cart.findOne({ userId: user.id, vendorId: key });
                if (!cart) {
                    var cart = new Cart({
                        userId: user.id,
                        vendorId: key,
                        products: []
                    });
                    await cart.save();
                }
                if (value.length != 0) {
                    for (let i = 0; i < value.length; i++) {
                        // console.log(value[i]);
                        let itemIndex = cart.products.findIndex(p => p.productId == value[i].productId);

                        if (itemIndex > -1) {
                            // product exists in the cart, update the quantity
                            let productItem = cart.products[itemIndex];
                            productItem.quantity = value[i].quantity;
                            // console.log(value[i]);
                            // productItem.quantity = productItem.quantity + value[i].quantity;
                            cart.products[itemIndex] = productItem;
                        } else {
                            // product does not exists in cart, add new item
                            cart.products.push({
                                productId: value[i].productId,
                                quantity: value[i].quantity,
                                // price: value[i].totalprice
                            });
                        }
                    }
                    // req.session.cart = undefined;
                    cartSession[key] = [];
                    await cart.save();
                }
            }
        }

        const redirect = req.session.redirectToUrl;
        req.session.redirectToUrl = undefined;
        res.redirect(redirect || '/account');
    }
);

module.exports = router;