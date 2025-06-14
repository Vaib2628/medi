const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        medicine: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medicine',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    orderType: {
        type: String,
        enum: ['regular', 'subscription'],
        required: true
    },
    subscriptionDetails: {
        duration: Number,  // Duration in days
        startDate: Date,
        endDate: Date,
        renewalDate: Date
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        pincode: String
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'upi', 'netbanking'],
        required: true
    },
    prescriptionRequired: {
        type: Boolean,
        default: false
    },
    prescriptionUrl: String
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema); 