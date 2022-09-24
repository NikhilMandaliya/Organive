const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const validator = require("validator");
const createError = require('http-errors');

const vendorSchema = new mongoose.Schema({
    storename: {
        type: String,
        required: true
    },
    ownername: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("email is invalid")
            }
        }
    },
    password: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    deliverycharge: {
        type: String
    },
    deliveryrange: {
        type: String
    },
    image: {
        type: String
    },
    idimage: {
        type: String
    },
    addressimage: {
        type: String
    },
    address: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Approved', 'Rejected'],
    },
    coords: {
        lat: {
            type: Number,
            require: true
        },
        lng: {
            type: Number,
            require: true
        }
    },
    date: {
        type: Date,
        default: Date.now()
    },
    blocked: {
        type: Boolean,
        default: false
    }
})

// generating tokens
vendorSchema.methods.generateAuthToken = async function () {
    try {
        // console.log(this._id);
        const token = jwt.sign({ _id: this._id.toString() }, process.env.SECRET_KEY, { expiresIn: '90d' });
        // this.tokens = this.tokens.concat({token:token})
        await this.save();
        // console.log(token);
        return token;
    } catch (error) {
        createError.BadRequest(error);
        console.log("error: " + error);
    }
}

// converting password into hash
vendorSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
})

module.exports = new mongoose.model("Vendor", vendorSchema);