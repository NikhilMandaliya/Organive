var mongoose = require('mongoose');

var promoSchema = mongoose.Schema({
    promo: {
        type: String,
        required: true,
    },
    times: {
        type: Number,
    },
    date: {
        type: String,
    },
    type: {
        type: String,
    },
    minAmount: {
        type: Number,
    },
    price: {
        type: Number,
    }, // not used
    percentage: {
        type: Number,
    },
    desc: {
        type: String,
    },
    dateCreated: {
        type: Date,
        default: Date.now,
        required: true
    }
});

module.exports = mongoose.model('Promo', promoSchema);