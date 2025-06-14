const express = require('express');
const router = express.Router();
const Medicine = require('../models/medicineModel');
const User = require('../models/userModel');
const auth = require('../middleware/auth');

// Get user's cart
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('cart.items.medicine');
        res.json(user.cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add item to cart
router.post('/add', auth, async (req, res) => {
    try {
        const { medicineId, quantity } = req.body;

        // Validate medicine
        const medicine = await Medicine.findById(medicineId);
        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }

        if (medicine.stock < quantity) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }

        // Add to cart
        const user = await User.findById(req.user._id);
        const cartItem = user.cart.items.find(
            item => item.medicine.toString() === medicineId
        );

        if (cartItem) {
            cartItem.quantity += quantity;
        } else {
            user.cart.items.push({
                medicine: medicineId,
                quantity,
                price: medicine.price
            });
        }

        // Calculate new total
        user.calculateCartTotal();
        await user.save();

        // Populate medicine details before sending response
        await user.populate('cart.items.medicine');
        res.json(user.cart);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update cart item quantity
router.put('/update/:medicineId', auth, async (req, res) => {
    try {
        const { quantity } = req.body;
        const user = await User.findById(req.user._id);
        const cartItem = user.cart.items.find(
            item => item.medicine.toString() === req.params.medicineId
        );

        if (!cartItem) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        // Validate stock
        const medicine = await Medicine.findById(req.params.medicineId);
        if (medicine.stock < quantity) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }

        cartItem.quantity = quantity;
        
        // Calculate new total
        user.calculateCartTotal();
        await user.save();

        // Populate medicine details before sending response
        await user.populate('cart.items.medicine');
        res.json(user.cart);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Remove item from cart
router.delete('/remove/:medicineId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.cart.items = user.cart.items.filter(
            item => item.medicine.toString() !== req.params.medicineId
        );
        
        // Calculate new total
        user.calculateCartTotal();
        await user.save();

        // Populate medicine details before sending response
        await user.populate('cart.items.medicine');
        res.json(user.cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Clear cart
router.delete('/clear', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.cart.items = [];
        user.cart.totalAmount = 0;
        await user.save();
        res.json({ message: 'Cart cleared successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 