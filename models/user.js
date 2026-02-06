const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    pincode: {
        type: Number,
        required: true
    },
    farmArea: {
        type: Number,
        required: true
    },
    state: {
        type: String,
    },
    district: {
        type: String,
    },
    region: {
        type: String,
    },

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
