const express = require('express');
const router = express.Router();
const bcrypt = require("bcryptjs");
const { check, validationResult } = require('express-validator');
const crypto = require('crypto');
// const { sendForgotPassMail } = require('../helpers/sendmail');
const { sendResetLinkMail } = require('../helpers/sendmail');

const checkUser = require('../middleware/authMiddleware');
// const checkStore = require('../middleware/selectedStore');
const checkUserAndStore = require('../middleware/checkUserAndStore');

const User = require('../models/userModel');
const Cart = require('../models/cartModel');
const Token = require('../models/tokenModel');
// const Vendor = require('../models/vendorModel');

// POST register
router.post("/register", [
    check('firstname', 'Please enter firstname.').notEmpty(),
    check('lastname', 'Please enter lastname.').notEmpty(),
    check('email', 'Please enter valid email.').isEmail(),
    check('password', 'Password should be atleast 6 characters long.').isLength({ min: 6 }),
    // check('number','Plaese enter mobile number').notEmpty(),
], async (req, res) => {
    try {
        const validationErrors = validationResult(req)
        if (validationErrors.errors.length > 0) {
            const alert = validationErrors.array()
            return res.render('account', {
                title: 'Account',
                user: null,
                cartLength: 0,
                alert
            })
        }
        const userExist = await User.findOne({ email: req.body.email })
        if (userExist && userExist.googleid && userExist.password == undefined) {
            userExist.password = req.body.password;
            await userExist.save();
            return res.render('account', {
                title: 'Account',
                user: null,
                cartLength: 0,
                alert: [{ msg: 'Registered.' }]
            })
        }
        if (userExist) {
            return res.render('account', {
                title: 'account',
                user: null,
                cartLength: 0,
                alert: [{ msg: 'Email is already registerd, Try logging in.' }]
            })
        }
        const user = new User({
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            password: req.body.password,
            phone: req.body.phone
        })
        const token = await user.generateAuthToken();
        res.cookie("jwt", token, {
            expires: new Date(Date.now() + 600000),
            httpOnly: true
        });
        await user.save();
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
                var cart = await Cart.findOne({ userId: user.id, vendorId: key });
                if (!cart) {
                    var cart = new Cart({
                        userId: user.id,
                        vendorId: key,
                        products: []
                    })
                    await cart.save();
                }
                if (value.length != 0) {
                    for (let i = 0; i < value.length; i++) {
                        let itemIndex = cart.products.findIndex(p => p.productId == value[i].productId);

                        if (itemIndex > -1) {
                            // product exists in the cart, update the quantity
                            let productItem = cart.products[itemIndex];
                            productItem.quantity = value[i].quantity;
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
                    cartSession[key] = [];
                    await cart.save();
                }
            }
        }
        res.redirect('/account');
        // create cart for every store
        // const stores = await Vendor.find();
        // for (let i = 0; i < stores.length; i++) {
        //     const cart = new Cart({
        //         userId: user.id,
        //         vendorId: stores[i].id,
        //         products: []
        //     })
        //     cart.save();
        // }
        // res.status(201).render("account", {
        //     title: 'My account',
        //     user: null,
        //     // user: req.user,
        //     cartLength: 0,
        //     alert: [{ msg: 'Registered successfully, Now you can login.' }]
        // });
    } catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
})

// POST login
router.post("/login", [
    check('email', 'Please enter valid email.').isEmail(),
    check('password', 'Please enter password!').notEmpty(),
], async (req, res) => {
    try {
        const validationErrors = validationResult(req)
        if (validationErrors.errors.length > 0) {
            const alert = validationErrors.array()
            return res.render('account', {
                title: 'account',
                user: null,
                cartLength: 0,
                alert
            })
        }
        const { email, password } = req.body;
        const userExist = await User.findOne({ email, isAdmin: false });
        if (!userExist) {
            return res.status(201).render("account", {
                title: 'My account',
                user: null,
                cartLength: 0,
                alert: [{ msg: 'Invalid email or password!' }]
            });
        }
        if (!userExist.password) {
            return res.status(201).render("account", {
                title: 'My account',
                user: null,
                cartLength: 0,
                alert: [{ msg: 'Please login with google.' }]
            });
        }
        const isMatch = await bcrypt.compare(password, userExist.password);
        if (!isMatch) {
            return res.status(201).render("account", {
                title: 'My account',
                user: null,
                cartLength: 0,
                alert: [{ msg: 'Invalid email or password!' }]
            });
        }
        const token = await userExist.generateAuthToken();
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
                var cart = await Cart.findOne({ userId: userExist.id, vendorId: key });
                if (!cart) {
                    var cart = new Cart({
                        userId: userExist.id,
                        vendorId: key,
                        products: []
                    })
                    await cart.save();
                }
                if (value.length != 0) {
                    for (let i = 0; i < value.length; i++) {
                        let itemIndex = cart.products.findIndex(p => p.productId == value[i].productId);

                        if (itemIndex > -1) {
                            // product exists in the cart, update the quantity
                            let productItem = cart.products[itemIndex];
                            productItem.quantity = value[i].quantity;
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
                    cartSession[key] = [];
                    await cart.save();
                }
            }
        }
        const redirect = req.session.redirectToUrl;
        req.session.redirectToUrl = undefined;
        res.redirect(redirect || '/account');
    } catch (error) {
        console.log(error);
        res.status(400).send(error.message);
    }
})

// GET logout
router.get("/logout", checkUser, async (req, res) => {
    try {
        if (req.user) {
            req.user.tokens = req.user.tokens.filter((currElement) => {
                return currElement.token !== req.token
            })
            await req.user.save();
        }
        res.clearCookie("jwt");
        res.redirect('/signup');
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
})

// GET logoutAll
router.get("/logoutall", checkUser, async (req, res) => {
    try {
        // logout from all device
        req.user.tokens = [];
        res.clearCookie("jwt");
        await req.user.save();
        res.render("login");
    } catch (error) {
        res.status(500).send(error);
    }
})

// Change Pass
router.post("/changepass", [
    check('currentpass', 'Please enter current password!').notEmpty(),
    check('newpass', 'Please enter new password!').notEmpty(),
    check('cfnewpass', 'Please enter confirm new password!').notEmpty(),
], checkUserAndStore, async (req, res) => {
    if (req.user) {
        var cart = await Cart.findOne({ userId: req.user.id, vendorId: req.store });
        var cartLength = cart.products.length;
    } else {
        const storeId = req.store;
        var cartLength = req.session.cart ? (req.session.cart[storeId] ? req.session.cart[storeId].length : 0) : 0;
    }
    const validationErrors = validationResult(req)
    if (validationErrors.errors.length > 0) {
        const alert = validationErrors.array()
        return res.render('my_account', {
            title: 'My account',
            user: req.user,
            cartLength,
            orders: [],
            alert
        })
    }
    const { currentpass, newpass, cfnewpass } = req.body;
    const user = req.user;
    if (user.password == undefined) {
        return res.status(201).render("my_account", {
            title: "My account",
            user: req.user,
            cartLength,
            orders: [],
            alert: [{ msg: 'You have logged in with google.' }]
        });
    }
    const isMatch = await bcrypt.compare(currentpass, user.password);
    if (!isMatch) {
        return res.status(201).render("my_account", {
            title: "My account",
            user: req.user,
            cartLength,
            orders: [],
            alert: [{ msg: 'Password you entered is wrong.' }]
        });
    }
    if (currentpass == newpass) {
        return res.status(201).render("my_account", {
            title: "My account",
            user: req.user,
            cartLength,
            orders: [],
            alert: [{ msg: 'New password can not be same as current password.' }]
        });
    }
    if (cfnewpass !== newpass) {
        return res.status(201).render("my_account", {
            title: "My account",
            user: req.user,
            cartLength,
            orders: [],
            alert: [{ msg: 'Password and confirm password does not match!' }]
        });
    }
    user.password = newpass;
    await user.save();
    return res.status(201).render("my_account", {
        title: "My account",
        user: req.user,
        cartLength,
        orders: [],
        alert: [{ msg: 'Password changed.' }]
    });
})

// GET forgot Pass
router.get("/forgot_pass", checkUserAndStore, async (req, res) => {
    if (req.user) {
        var cart = await Cart.findOne({ userId: req.user.id, vendorId: req.store });
        var cartLength = cart.products.length;
    } else {
        const storeId = req.store;
        var cartLength = req.session.cart ? (req.session.cart[storeId] ? req.session.cart[storeId].length : 0) : 0;
    }
    res.render("forgot_pass", {
        title: "Forgot password",
        user: req.user,
        cartLength,
    });
})

// POST forgot Pass
router.post("/forgot_pass", async (req, res) => {
    try {
        // reset pass link
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(201).render("forgot_pass", {
                title: 'Forgot password',
                user: null,
                cartLength: 0,
                alert: [{ msg: `user with given email doesn't exist.` }],
            });
        }
        let token = await Token.findOne({ userId: user._id });
        if (!token) {
            token = await new Token({
                userId: user.id,
                token: crypto.randomBytes(32).toString("hex"),
            }).save();
        }
        const link = `${process.env.DOMAIN}reset/${user.id}/${token.token}`
        // send mail
        sendResetLinkMail(user.email, link)
        res.status(201).render("account", {
            title: 'My account',
            user: null,
            cartLength: 0,
            alert: [{ msg: 'A password reset link is sent to your mail. Check your mail.' }],
        });
    } catch (error) {
        console.log(error);
        res.send(error.message)
    }
})

// GET reset pass
router.get("/reset/:user/:token", async (req, res) => {
    res.render("reset_pass", {
        title: "Reset password",
        token: req.params.user,
        userId: req.params.user,
        user: null,
        cartLength: 0
    });
})

// POST reset pass
router.post("/reset", async (req, res) => {
    try {
        const { newpass, cfpass } = req.body;
        if (!newpass || !cfpass) {
            return res.render("forgot_pass", {
                title: "Forgot password",
                user: req.user,
                cartLength,
                alert: [{ msg: 'Please provide password and confirm password.' }]
            });
        }
        if (newpass.length < 6) {
            return res.render("forgot_pass", {
                title: "Forgot password",
                user: req.user,
                cartLength,
                alert: [{ msg: 'Password should atleast 6 characters long.' }]
            });
        }
        if (newpass != cfpass) {
            return res.render("forgot_pass", {
                title: "Forgot password",
                user: req.user,
                cartLength,
                alert: [{ msg: 'Password and confirm password do not match.' }]
            });
        }
        // set pass
        const userId = req.body.userId
        const user = await User.findById(userId);
        if (!user) {
            return res.render("forgot_pass", {
                title: "Forgot password",
                user: null,
                cartLength: 0,
                alert: [{ msg: 'No user with this email.' }]
            });
        }
        const token = await Token.findOne({ userId: user._id, token: req.body.token });
        if (!token) {
            return res.render("forgot_pass", {
                title: "Forgot password",
                user: null,
                cartLength: 0,
                alert: [{ msg: 'Invalid link or expired, Request again.' }]
            });
        }
        user.password = newpass;
        await user.save();
        res.status(201).render("account", {
            title: 'My account',
            user: null,
            cartLength: 0,
            alert: [{ msg: 'Password changed, Try logging in.' }],
        });
    } catch (error) {
        console.log(error);
        res.send(error.message)
    }
})

// POST forgot pass
// router.post("/forgot_pass", checkUser, checkStore, async (req, res) => {
//     try {
//         if (req.user) {
//             var cart = await Cart.findOne({ userId: req.user.id, vendorId: req.store });
//             var cartLength = cart.products.length;
//         } else {
//             const storeId = req.store;
//             var cartLength = req.session.cart ? (req.session.cart[storeId] ? req.session.cart[storeId].length : 0) : 0;
//         }
//         // generate pass
//         let pass = (Math.random() + 1).toString(36).substring(5);

//         // set pass
//         const email = req.body.email
//         const user = await User.findOne({ email })
//         if (!user) {
//             return res.render("forgot_pass", {
//                 title: "Forgot password",
//                 user: req.user,
//                 cartLength,
//                 alert: [{ msg: 'Please enter registered email id.' }]
//             });
//         }
//         user.password = pass;
//         await user.save();

//         // send mail
//         sendForgotPassMail(email, pass)
//         res.status(201).render("account", {
//             title: 'My account',
//             user: req.user,
//             cartLength,
//             alert: [{ msg: 'A new password sent to your mail. Check your mail and Try logging in.' }],
//         });
//     } catch (error) {
//         console.log(error);
//         res.send(error.message)
//     }
// })

// post address
router.post("/address", [
    check('house', 'Please enter House number!').notEmpty(),
    check('landmark', 'Please enter Landmark!').notEmpty(),
    check('postal', 'Please enter Postal code!').isNumeric()
], checkUser, async (req, res) => {
    try {
        if (req.user) {
            var cart = await Cart.findOne({ userId: req.user.id });
            var cartLength = cart.products.length;
        } else {
            const storeId = req.store;
            var cartLength = req.session.cart ? (req.session.cart[storeId] ? req.session.cart[storeId].length : 0) : 0;
        }
        const user = req.user;
        const validationErrors = validationResult(req)
        if (validationErrors.errors.length > 0) {
            const alert = validationErrors.array()
            return res.render('my_account', {
                title: 'My account',
                alert,
                cartLength,
                user,
                orders: []
            })
        }
        user.address = {
            house: req.body.house,
            landmark: req.body.landmark,
            postal: req.body.postal,
            coords: {
                lat: req.body.lat,
                lng: req.body.lng
            }
        }
        await user.save();
        req.flash('success', `Address updated successfully.`);
        res.redirect('/account');
    } catch (error) {
        res.status(400).send(error);
        console.log(error);
    }
})

module.exports = router;