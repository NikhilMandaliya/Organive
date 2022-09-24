const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.ObjectId,
        ref: 'Vendor',
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
        },
        quantity: Number,
        name: String,
        weight: String,
        price: Number
    }],
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    useraddress: {
        type: String,
        required: true
    },
    totalamount: {
        type: String,
        required: true
    },
    deliverycharge: {
        type: String,
        required: true
    },
    payableamount: {
        type: String,
        required: true
    },
    discountamount: {
        type: String,
        default: 0
    },
    orderdate: {
        type: Date,
        default: Date.now()
    },
    deliverydate: {
        type: Date,
    },
    paymentmode: {
        type: String,
        required: true
    },
    paymentId: {
        type: String,
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vendor"
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Rejected', 'Processing', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    canceldate: {
        type: Date,
    },
    acceptdate: {
        type: Date,
    },
    rejectdate: {
        type: Date,
    },
})

module.exports = new mongoose.model("Order", orderSchema);