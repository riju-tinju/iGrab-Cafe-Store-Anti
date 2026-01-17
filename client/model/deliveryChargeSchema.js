const mongoose = require('mongoose');

const deliveryChargeSchema = new mongoose.Schema({
    emirate: {
        type: String,
        required: true,
        enum: ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'],
        unique: true
    },
    chargeType: {
        type: String,
        required: true,
        enum: ['fixed', 'distance']
    },
    fixedCharge: {
        type: Number,
        default: 0
    },
    distanceCharge: {
        baseDistance: { type: Number, default: 10 },
        baseCost: { type: Number, default: 0 },
        extraCostPerKm: { type: Number, default: 0 }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('DeliveryCharge', deliveryChargeSchema);
