const express = require('express');
const router = express.Router();

const checkUser = require('../middleware/authMiddleware');
const checkStore = require('../middleware/selectedStore');
const checkUserAndStore = require('../middleware/checkUserAndStore');

const Cart = require('../models/cartModel');
const Product = require('../models/productModel');

// Get cart
router.get("/", checkUserAndStore, async (req, res) => {
    if (req.user) {
        var cart = await Cart.findOne({ userId: req.user.id, vendorId: req.store });
        var myCart = [];
        var remove = [];
        for (let i = 0; i < cart.products.length; i++) {
            var prod = await Product.findById(cart.products[i].productId);
            if (prod == null) {
                remove.push(cart.products[i].productId)
            } else {
                prod.quantity = cart.products[i].quantity;
                myCart.push(prod);
            }
        }
        cart.products = cart.products.filter(el => !remove.includes(el.productId));
        await cart.save();
        var cartLength = cart.products.length;
    } else {
        var myCart = [];
        var cartLength = 0;
        const storeId = req.store;
        if (req.session.cart == undefined) {
            req.session.cart = {};
            req.session.cart[storeId] = [];
        } else {
            if (req.session.cart[storeId] == undefined) {
                req.session.cart[storeId] = [];
            } else {
                var cart = req.session.cart[storeId]; // add prods
                var myCart = [];
                var remove = [];
                for (let i = 0; i < cart.length; i++) {
                    var prod = await Product.findById(cart[i].productId);
                    if (prod == null) {
                        remove.push(cart[i].productId)
                    } else {
                        prod.quantity = cart[i].quantity;
                        myCart.push(prod);
                    }
                }
                req.session.cart[storeId] = cart.filter(el => !remove.includes(el.productId));
                var cartLength = cart.length;
            }
        }
    }
    res.render("cart", {
        title: 'Cart',
        user: req.user,
        myCart,
        cartLength,
        storename: req.storename,
    });
});

// add to cart
router.get("/add/:product", checkUserAndStore, async (req, res) => {
    try {
        const product = await Product.findById(req.params.product);
        const totalqty = product.qtyweight;
        if (product.vendor != req.store) {
            const redirect = req.session.redirectToUrl;
            req.session.redirectToUrl = undefined;
            return res.redirect(redirect || '/cart');
        }
        // check if user is logged
        if (req.user) {
            // change in mongo
            var cart = await Cart.findOne({ userId: req.user.id, vendorId: req.store });
            if (cart) {
                // cart exists for user
                let itemIndex = cart.products.findIndex(p => p.productId == product.id);

                if (itemIndex > -1) {
                    // product exists in the cart, update the quantity
                    let productItem = cart.products[itemIndex];
                    if (totalqty > productItem.quantity) {
                        productItem.quantity = productItem.quantity + 1;
                    }
                    cart.products[itemIndex] = productItem;
                } else {
                    // product does not exists in cart, add new item
                    cart.products.push({
                        productId: product._id,
                        quantity: 1,
                        // price: product.totalprice
                    });
                }
                await cart.save();
            } else {
                const cart = new Cart({
                    userId: req.user.id,
                    vendorId: req.store,
                    products: [{
                        productId: product._id,
                        quantity: 1,
                        // price: product.totalprice
                    }]
                })
                await cart.save();
            }
            const redirect = req.session.redirectToUrl;
            req.session.redirectToUrl = undefined;
            res.redirect(redirect || '/cart');
        } else {
            // store in session
            var storeId = req.store;
            if (req.session.cart == "undefined") {
                req.session.cart = {};
                req.session.cart[storeId] = [];
                req.session.cart[storeId].push({
                    productId: product.id,
                    quantity: 1,
                });
            } else {
                var cart = req.session.cart;
                if (req.session.cart[storeId] == undefined) {
                    cart[storeId] = [];
                    var old = cart[storeId];
                    old.push({
                        productId: product.id,
                        quantity: 1,
                    });
                    cart[storeId] = old;
                    req.session.cart = cart;
                } else {
                    const cart = req.session.cart[storeId];
                    var newItem = true;
                    for (var i = 0; i < cart.length; i++) {
                        if (cart[i].productId == product.id) {
                            if (totalqty > cart[i].quantity) {
                                cart[i].quantity++;
                            }
                            newItem = false;
                            break;
                        }
                    }
                    if (newItem) {
                        var old = cart;
                        old.push({
                            productId: product.id,
                            quantity: 1,
                        });
                    }
                }
            }
            const redirect = req.session.redirectToUrl;
            req.session.redirectToUrl = undefined;
            res.redirect(redirect || '/cart');
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
})

// GET update cart
router.get('/update/:product', checkUserAndStore, async (req, res) => {
    // console.log(req.url);
    try {
        const product = await Product.findById(req.params.product);
        const totalqty = product.qtyweight;
        // console.log(product);
        if (req.user) {
            var cart = await Cart.findOne({ userId: req.user.id, vendorId: req.store });
            var id = req.params.product;
            var action = req.query.action;

            for (var i = 0; i < cart.products.length; i++) {
                if (cart.products[i].productId == id) {
                    switch (action) {
                        case "add":
                            if (totalqty > cart.products[i].quantity) {
                                cart.products[i].quantity++;
                            } else {
                                return res.send({ status: 'fail', totalqty });
                            }
                            break;
                        case "remove":
                            cart.products[i].quantity--;
                            if (cart.products[i].quantity < 1) {
                                cart.products.splice(i, 1);
                            }
                            break;
                        case "clear":
                            cart.products.splice(i, 1);
                            break;
                        default:
                            console.log('Update problem');
                            break;
                    }
                    break;
                }
            }
            await cart.save();
        } else {
            var storeId = req.store;
            var cart = req.session.cart[storeId];
            var id = req.params.product;
            var action = req.query.action;

            for (var i = 0; i < cart.length; i++) {
                if (cart[i].productId == id) {
                    switch (action) {
                        case "add":
                            console.log(totalqty);
                            console.log(cart.quantity);
                            if (totalqty > cart.quantity) {
                                cart.quantity++;
                            } else {
                                return res.send({ status: 'fail', totalqty });
                            }
                            break;
                        case "remove":
                            cart[i].quantity--;
                            if (cart[i].quantity < 1) {
                                cart.splice(i, 1);
                            }
                            break;
                        case "clear":
                            cart.splice(i, 1);
                            break;
                        default:
                            console.log('Update problem');
                            break;
                    }
                    break;
                }
            }
        }
        res.redirect('/cart');
    } catch (error) {
        console.log(error);
        res.send(error)
    }
});

// add to cart api
router.get("/api/add/:product", checkUserAndStore, async (req, res) => {
    try {
        const product = await Product.findById(req.params.product);
        const totalqty = product.qtyweight;
        // check if user is logged
        if (req.user) {
            // change in mongo
            var cart = await Cart.findOne({ userId: req.user.id, vendorId: req.store });
            if (cart) {
                // cart exists for user
                let itemIndex = cart.products.findIndex(p => p.productId == product.id);

                if (itemIndex > -1) {
                    // product exists in the cart, update the quantity
                    let productItem = cart.products[itemIndex];
                    if (totalqty > productItem.quantity) {
                        productItem.quantity = productItem.quantity + 1;
                        cart.products[itemIndex] = productItem;
                        await cart.save();
                        return res.send({ status: 'success', name: product.productname, msg: 'Product is already in cart, quantity updated.' });
                    } else {
                        cart.products[itemIndex] = productItem;
                        await cart.save();
                        return res.send({ status: 'info', name: product.productname, msg: `Sorry! Only ${totalqty} available.` });
                    }
                } else {
                    // product does not exists in cart, add new item
                    cart.products.push({
                        productId: product._id,
                        quantity: 1,
                        // price: product.totalprice
                    });
                    await cart.save();
                    return res.send({ status: 'success', name: product.productname, msg: 'Product added to cart.', cartLength: cart.products.length });
                }
            } else {
                const cart = new Cart({
                    userId: req.user.id,
                    vendorId: req.store,
                    products: [{
                        productId: product._id,
                        quantity: 1,
                        // price: product.totalprice
                    }]
                })
                await cart.save();
                return res.send({ status: 'success', name: product.productname, msg: 'Product added to cart.', cartLength: cart.products.length });
            }
        } else {
            // store in session
            var storeId = req.store;
            if (req.session.cart == undefined) {
                req.session.cart = {};
                req.session.cart[storeId] = [];
                req.session.cart[storeId].push({
                    productId: product.id,
                    quantity: 1,
                });
                return res.send({ status: 'success', name: product.productname, msg: 'Product added to cart.', cartLength: req.session.cart[storeId].length });
            } else {
                var cart = req.session.cart;
                if (req.session.cart[storeId] == undefined) {
                    var old = [];
                    old.push({
                        productId: product.id,
                        quantity: 1,
                    });
                    cart[storeId] = old;
                    req.session.cart = cart;
                    return res.send({ status: 'success', name: product.productname, msg: 'Product added to cart.', cartLength: cart.length });
                } else {
                    const cart = req.session.cart[storeId];
                    for (var i = 0; i < cart.length; i++) {
                        if (cart[i].productId == product.id) {
                            if (totalqty > cart[i].quantity) {
                                cart[i].quantity++;
                                return res.send({ status: 'success', name: product.productname, msg: 'Product is already in cart, quantity updated.' });
                            } else {
                                return res.send({ status: 'info', name: product.productname, msg: `Sorry! Only ${totalqty} available.` });
                            }
                        }
                    }
                    // var old = cart;
                    cart.push({
                        productId: product.id,
                        quantity: 1,
                    });
                    return res.send({ status: 'success', name: product.productname, msg: 'Product added to cart.', cartLength: cart.length });
                }
            }
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
})

// GET update cart api
router.get('/api/update/:product', checkUserAndStore, async (req, res) => {
    // console.log(req.url);
    try {
        const product = await Product.findById(req.params.product);
        const totalqty = product.qtyweight;
        if (req.user) {
            var cart = await Cart.findOne({ userId: req.user.id, vendorId: req.store });
            var id = req.params.product;
            var action = req.query.action;

            for (var i = 0; i < cart.products.length; i++) {
                if (cart.products[i].productId == id) {
                    switch (action) {
                        case "add":
                            if (totalqty > cart.products[i].quantity) {
                                cart.products[i].quantity++;
                                res.send({ status: 'success', totalqty: cart.products[i].quantity });
                            } else {
                                return res.send({ status: 'fail' });
                            }
                            break;
                        case "remove":
                            cart.products[i].quantity--;
                            if (cart.products[i].quantity < 1) {
                                cart.products.splice(i, 1);
                                res.send({ status: 'success', totalqty: 0, cartLength: cart.products.length });
                            } else {
                                res.send({ status: 'success', totalqty: cart.products[i].quantity, cartLength: cart.products.length });
                            }
                            break;
                        case "clear":
                            cart.products.splice(i, 1);
                            res.send({ status: 'success' });
                            break;
                        default:
                            console.log('Update problem');
                            res.send({ status: 'success' });
                            break;
                    }
                    break;
                }
            }
            await cart.save();
        } else {
            var storeId = req.store;
            var cart = req.session.cart[storeId];
            var id = req.params.product;
            var action = req.query.action;

            for (var i = 0; i < cart.length; i++) {
                if (cart[i].productId == id) {
                    switch (action) {
                        case "add":
                            if (totalqty > cart[i].quantity) {
                                cart[i].quantity++;
                                res.send({ status: 'success', totalqty: cart[i].quantity });
                            } else {
                                return res.send({ status: 'fail', totalqty });
                            }
                            break;
                        case "remove":
                            cart[i].quantity--;
                            if (cart[i].quantity < 1) {
                                cart.splice(i, 1);
                                res.send({ status: 'success', totalqty: 0, cartLength: cart.length });
                            } else {
                                res.send({ status: 'success', totalqty: cart[i].quantity });
                            }
                            break;
                        case "clear":
                            cart.splice(i, 1);
                            res.send({ status: 'success' });
                            break;
                        default:
                            console.log('Update problem');
                            res.send({ status: 'success' });
                            break;
                    }
                    break;
                }
            }
        }
    } catch (error) {
        console.log(error);
        res.send(error)
    }
});


// GET clear cart
router.get('/clear', checkUserAndStore, async (req, res) => {
    if (req.user) {
        var cart = await Cart.findOne({ userId: req.user.id, vendorId: req.store });
        cart.products = [];
        await cart.save();
    } else {
        var storeId = req.store;
        delete req.session.cart[storeId];
    }
    req.flash('success', 'Cart cleared!');
    res.redirect('/cart');
});

module.exports = router;