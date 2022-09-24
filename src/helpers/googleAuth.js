const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;

const User = require('../models/userModel.js');
// const Cart = require('../models/cartModel');
// const Vendor = require('../models/vendorModel');

passport.serializeUser(function (user, done) {
	/*
	From the user take just the id (to minimize the cookie size) and just pass the id of the user
	to the done callback
	PS: You dont have to do it like this its just usually done like this
	*/
	done(null, user);
});

passport.deserializeUser(function (user, done) {
	/*
	Instead of user this function usually recives the id 
	then you use the id to select the user from the db and pass the user obj to the done callback
	PS: You can later access this data in any routes in: req.user
	*/
	done(null, user);
});

passport.use(new GoogleStrategy({
	clientID: process.env.GOOGLE_CLIENT_ID,
	clientSecret: process.env.GOOGLE_CLIENT_SECRET,
	callbackURL: process.env.GOOGLE_CALLBACK,
	passReqToCallback: true
},
	async function (req, accessToken, refreshToken, profile, done) {
		const userExist = await User.findOne({ email: profile.email })
		// console.log(userExist);
		if (userExist) {
			//  add google id
			userExist.googleid = profile.sub;
			await userExist.save();
			req.myUser = userExist;
		} else {
			// create new user
			const user = new User({
				googleid: profile.sub,
				firstname: profile.given_name,
				lastname: profile.family_name,
				email: profile.email
			})
			await user.save();
			// create cart
			// const cartExist = await Cart.findOne({ userId: user.id })
			// if (!cartExist) {
			// 	// create cart for every store
			// 	const stores = await Vendor.find();
			// 	for (let i = 0; i < stores.length; i++) {
			// 		const cart = new Cart({
			// 			userId: user.id,
			// 			vendorId: stores[i].id,
			// 			products: []
			// 		})
			// 		cart.save();
			// 	}
			// }
			req.myUser = user;
		}
		// token?
		return done(null, profile);
	}
));