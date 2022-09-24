const mongoose = require('mongoose');

const adminCommission = mongoose.Schema({
    percent: {
        type: Number,
        required: true
    },
    driverCharge: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('AdminCommission', adminCommission);