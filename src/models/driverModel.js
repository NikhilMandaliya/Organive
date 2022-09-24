const mongoose = require('mongoose');
const validator = require("validator");
const bcrypt = require('bcryptjs');

const driverSchema = new mongoose.Schema({
    name: {
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
    number: {
        type: Number,
        required: true
    },
    image: {
        type: String
    },
    vehicleimage: {
        type: String
    },
    frontimage: {
        type: String
    },
    backimage: {
        type: String
    },
    Bankname: {
        type: String,
        required: true
    },
    Accountnumber: {
        type: String,
        required: true
    },
    IFSCcode: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now()
    }
})

// converting password into hash
driverSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
})

module.exports = new mongoose.model("Driver", driverSchema);