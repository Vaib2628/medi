const express = require('express');
const router = express.Router();
const Order = require('../models/orderModel');
const Medicine = require('../models/medicineModel');
const auth = require('../middleware/auth');

// Get all orders for a user
router.get('/my-orders', auth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('items.medicine')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get order by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user._id
        }).populate('items.medicine');
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new order
router.post('/', auth, async (req, res) => {
    try {
        const { items, orderType, subscriptionDetails, shippingAddress, paymentMethod } = req.body;

        // Calculate total amount and validate stock
        let totalAmount = 0;
        for (const item of items) {
            const medicine = await Medicine.findById(item.medicine);
            if (!medicine) {
                return res.status(400).json({ message: `Medicine ${item.medicine} not found` });
            }
            if (medicine.stock < item.quantity) {
                return res.status(400).json({ message: `Insufficient stock for ${medicine.name}` });
            }
            totalAmount += medicine.price * item.quantity;
        }

        // Create order
        const order = new Order({
            user: req.user._id,
            items,
            totalAmount,
            orderType,
            subscriptionDetails,
            shippingAddress,
            paymentMethod
        });

        // Update stock
        for (const item of items) {
            await Medicine.findByIdAndUpdate(item.medicine, {
                $inc: { stock: -item.quantity }
            });
        }

        await order.save();
        res.status(201).json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Cancel order
router.put('/:id/cancel', auth, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status !== 'pending') {
            return res.status(400).json({ message: 'Cannot cancel order in current status' });
        }

        // Restore stock
        for (const item of order.items) {
            await Medicine.findByIdAndUpdate(item.medicine, {
                $inc: { stock: item.quantity }
            });
        }

        order.status = 'cancelled';
        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update order status (admin only)
router.put('/:id/status', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 