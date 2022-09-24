const mongoose = require('mongoose');

// banner schema
const BannerSchema = mongoose.Schema({
    image: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    }
});

module.exports = mongoose.model('Banner', BannerSchema);