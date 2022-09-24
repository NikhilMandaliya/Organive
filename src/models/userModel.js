const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const validator = require("validator");
const createError = require('http-errors');

const userSchema = new mongoose.Schema({
    googleid: {
        type: String
    },
    firstname: {
        type: String,
        required: true
    },
    lastname: {
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
    },
    phone: {
        type: String,
    },
    address: {
        house: {
            type: String,
        },
        landmark: {
            type: String
        },
        postal: {
            type: Number,
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
        }
    },
    wishlist: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
    }],
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    isAdmin: {
        type: Boolean,
        default: false
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
userSchema.methods.generateAuthToken = async function () {
    try {
        // console.log(this._id);
        const token = jwt.sign({ _id: this._id.toString() }, process.env.SECRET_KEY, { expiresIn: '90d' });
        this.tokens = this.tokens.concat({ token: token })
        await this.save();
        // console.log(token);
        return token;
    } catch (error) {
        createError.BadRequest(error);
        console.log("error: " + error);
    }
}

// converting password into hash
userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
})

// we need to create a collection
const User = new mongoose.model("User", userSchema);
module.exports = User;