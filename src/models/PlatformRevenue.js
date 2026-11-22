/**
 * Modèle de suivi des revenus et commissions de l'application INSTAR.
 * Permet un reporting financier précis et transparent pour la direction.
 */

const mongoose = require('mongoose');

const platformRevenueSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: true,
      unique: true,
      index: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
      index: true,
    },
    totalFare: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    commissionAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    driverAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'MOBILE_MONEY'],
      required: true,
    },
    currency: {
      type: String,
      default: 'XOF',
      uppercase: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index d'agrégation pour les statistiques de chiffre d'affaires
platformRevenueSchema.index({ createdAt: -1 });

const PlatformRevenue = mongoose.model('PlatformRevenue', platformRevenueSchema);

module.exports = PlatformRevenue;
