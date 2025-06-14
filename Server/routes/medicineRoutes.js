const express = require('express');
const router = express.Router();
const Medicine = require('../models/medicineModel');
const auth = require('../middleware/auth');

// Get all medicines
router.get('/', async (req, res) => {
    try {
        const medicines = await Medicine.find({});
        res.json(medicines);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get medicine by ID
router.get('/:id', async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id);
        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }
        res.json(medicine);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add new medicine (admin only)
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const medicine = new Medicine(req.body);
        const savedMedicine = await medicine.save();
        res.status(201).json(savedMedicine);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


// Update medicine (admin only)
router.put('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const medicine = await Medicine.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }
        res.json(medicine);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete medicine (admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const medicine = await Medicine.findByIdAndDelete(req.params.id);
        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }
        res.json({ message: 'Medicine deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get medicines available for subscription
router.get('/subscription/available', async (req, res) => {
    try {
        const medicines = await Medicine.find({ isAvailableForSubscription: true });
        res.json(medicines);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 