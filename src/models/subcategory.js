const mongoose = require('mongoose');

// subcategory schema
const SubcategorySchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    category: {
        type: mongoose.Schema.ObjectId,
        ref: 'Category',
    },
    image: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    }
});

module.exports = mongoose.model('Subcategory', SubcategorySchema);