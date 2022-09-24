const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    category: {
        type: String, // ref
        required: true
    },
    subcategory: {
        type: String, // ref
    },
    company: {
        type: String,
    },
    productname: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    productweight: {
        type: String,
    },
    qtyweight: {
        type: String,
    },
    unit: {
        type: String, // ref or remove unit module
    },
    saleprice: {
        type: String,
        required: true
    },
    totalprice: {
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
    featured: {
        type: Boolean,
        default: false
    },
    vendor: {
        type: mongoose.Schema.ObjectId,
        ref: 'Vendor',
    },
    date: {
        type: Date,
        default: Date.now()
    }
})

module.exports = new mongoose.model("Product", productSchema);