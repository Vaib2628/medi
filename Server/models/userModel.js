const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const cartItemSchema = new mongoose.Schema({
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
});

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    cart: {
        items: [cartItemSchema],
        totalAmount: {
            type: Number,
            default: 0
        }
    },
    prescriptions: [{
        type: String,  // URLs to prescription images
        required: false
    }],
    activeSubscriptions: [{
        medicine: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medicine'
        },
        startDate: Date,
        endDate: Date,
        status: {
            type: String,
            enum: ['active', 'cancelled', 'completed'],
            default: 'active'
        }
    }]
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to calculate cart total
userSchema.methods.calculateCartTotal = function() {
    this.cart.totalAmount = this.cart.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
    return this.cart.totalAmount;
};

module.exports = mongoose.model('User', userSchema); 