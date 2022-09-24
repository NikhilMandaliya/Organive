const mongoose = require("mongoose");
const Product = require('./productModel');

const CartSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User"
	},
	vendorId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Vendor"
	},
	products: [{
		productId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Product"
		},
		quantity: Number,
		// name: String,
		// price: Number // what if price is changed
	}],
	total: {
		type: Number
	},
	discount: {
		type: Number
	},
	promo: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Promo'
	}
});

CartSchema.pre("save", async function (next) {
	if (this.isModified("products")) {
		let totalamount = 0;
		for (let i = 0; i < this.products.length; i++) {
			const product = await Product.findById(this.products[i].productId);
			if (product) { totalamount = totalamount + (product.totalprice * this.products[i].quantity); }
		}
		this.total = totalamount;
		this.discount = 0;
		this.promo = undefined;
	}
	next();
})

module.exports = mongoose.model("Cart", CartSchema);