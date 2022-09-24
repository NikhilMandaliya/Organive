const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true
    },
    subcategory: {
        type: String,
    },
    company: {
        type: String,
    },
    productname: {
        type: String,
        required: true
    },
    productweight: {
        type: String,
    },
    unit: {
        type: String,
    },
    type: {
        type: String
    },
    costprice: {
        type: String,
        required: true
    },
    saleprice: {
        type: String,
        required: true
    },
    discount: {
        type: String,
        required: true
    },
    totalprice: {
        type: String,
    },
    nondisc: {
        type: String,
    },
    image: {
        type: String
    },
    title: {
        type: String
    },
    description: {
        type: String
    },
    vendor: {
        type: mongoose.Schema.ObjectId,
        ref: 'Vendor',
    },
})

module.exports = new mongoose.model("Offer", offerSchema);