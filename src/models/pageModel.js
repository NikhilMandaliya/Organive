var mongoose = require('mongoose');

// page schema
var pageSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true,
    },
    content: {
        type: String,
        // required:true
    },
});

var Page = module.exports = mongoose.model('Page', pageSchema);