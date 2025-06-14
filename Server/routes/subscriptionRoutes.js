const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const Medicine = require('../models/medicineModel');
const Order = require('../models/orderModel');
const auth = require('../middleware/auth');

// Get user's active subscriptions
router.get('/my-subscriptions', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('activeSubscriptions.medicine');
        res.json(user.activeSubscriptions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new subscription
router.post('/', auth, async (req, res) => {
    try {
        const { medicineId, duration } = req.body;

        // Validate medicine
        const medicine = await Medicine.findById(medicineId);
        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }

        if (!medicine.isAvailableForSubscription) {
            return res.status(400).json({ message: 'Medicine not available for subscription' });
        }

        // Validate subscription option
        const subscriptionOption = medicine.subscriptionOptions.find(
            option => option.duration === duration
        );
        if (!subscriptionOption) {
            return res.status(400).json({ message: 'Invalid subscription duration' });
        }

        // Calculate dates
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + duration);

        // Create subscription order
        const order = new Order({
            user: req.user._id,
            items: [{
                medicine: medicineId,
                quantity: 1,
                price: subscriptionOption.price
            }],
            totalAmount: subscriptionOption.price,
            orderType: 'subscription',
            subscriptionDetails: {
                duration,
                startDate,
                endDate,
                renewalDate: endDate
            },
            status: 'pending'
        });

        await order.save();

        // Add to user's active subscriptions
        await User.findByIdAndUpdate(req.user._id, {
            $push: {
                activeSubscriptions: {
                    medicine: medicineId,
                    startDate,
                    endDate,
                    status: 'active'
                }
            }
        });

        res.status(201).json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Cancel subscription
router.put('/:subscriptionId/cancel', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const subscription = user.activeSubscriptions.id(req.params.subscriptionId);

        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        subscription.status = 'cancelled';
        await user.save();

        res.json({ message: 'Subscription cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Renew subscription
router.post('/:subscriptionId/renew', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const subscription = user.activeSubscriptions.id(req.params.subscriptionId);

        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        const medicine = await Medicine.findById(subscription.medicine);
        const subscriptionOption = medicine.subscriptionOptions.find(
            option => option.duration === subscription.duration
        );

        // Create renewal order
        const order = new Order({
            user: req.user._id,
            items: [{
                medicine: subscription.medicine,
                quantity: 1,
                price: subscriptionOption.price
            }],
            totalAmount: subscriptionOption.price,
            orderType: 'subscription',
            subscriptionDetails: {
                duration: subscription.duration,
                startDate: new Date(),
                endDate: new Date(Date.now() + subscription.duration * 24 * 60 * 60 * 1000),
                renewalDate: new Date(Date.now() + subscription.duration * 24 * 60 * 60 * 1000)
            },
            status: 'pending'
        });

        await order.save();

        // Update subscription dates
        subscription.startDate = new Date();
        subscription.endDate = new Date(Date.now() + subscription.duration * 24 * 60 * 60 * 1000);
        subscription.status = 'active';
        await user.save();

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 