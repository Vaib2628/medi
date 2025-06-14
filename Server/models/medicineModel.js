const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    stock: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true
    },
    manufacturer: {
        type: String,
        required: true
    },
    prescriptionRequired: {
        type: Boolean,
        default: false
    },
    imageUrl: {
        type: String
    },
    dosage: {
        type: String,
        required: true
    },
    expiryTimeFrame: {
        type: Number,  // Duration in months
        required: true,
        min: 1,
        max: 60  // Maximum 5 years
    },
    isAvailableForSubscription: {
        type: Boolean,
        default: false
    },
    subscriptionOptions: [{
        duration: {
            type: Number,  // Duration in days
            required: true
        },
        price: {
            type: Number,
            required: true
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Medicine', medicineSchema); 