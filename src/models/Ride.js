/**
 * Modèle de données pour les courses sur la plateforme INSTAR.
 * Trace l'intégralité du cycle de vie, les horodatages précis et la facturation.
 */

const mongoose = require('mongoose');
const {
  RIDE_STATUSES,
  VEHICLE_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} = require('../config/constants');

const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  { _id: false }
);

const rideLocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom du lieu ou du repère est requis.'],
      trim: true,
    },
    landmarkId: {
      type: String,
      default: null,
      trim: true,
    },
    location: {
      type: pointSchema,
      required: true,
    },
  },
  { _id: false }
);

const rideSchema = new mongoose.Schema(
  {
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Une course doit être rattachée à un passager.'],
      index: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
      index: true,
    },
    vehicleType: {
      type: String,
      enum: Object.values(VEHICLE_TYPES),
      required: [true, 'Le type de véhicule demandé est obligatoire.'],
      index: true,
    },
    pickup: {
      type: rideLocationSchema,
      required: [true, 'Le point de départ est obligatoire.'],
    },
    destination: {
      type: rideLocationSchema,
      required: [true, 'Le point de destination est obligatoire.'],
    },
    estimatedDistanceKm: {
      type: Number,
      required: true,
      min: 0,
    },
    estimatedDurationMin: {
      type: Number,
      default: 5,
      min: 1,
    },
    estimatedPrice: {
      type: Number,
      required: [true, 'Le prix estimé en FCFA est obligatoire.'],
      min: 0,
    },
    finalPrice: {
      type: Number,
      default: null,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      default: PAYMENT_METHODS.CASH,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUSES),
      default: PAYMENT_STATUSES.PENDING,
    },
    paymentReceiptUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(RIDE_STATUSES),
      default: RIDE_STATUSES.REQUESTED,
      index: true,
    },
    cancellationReason: {
      type: String,
      default: null,
      trim: true,
    },
    cancelledBy: {
      type: String,
      enum: ['PASSENGER', 'DRIVER', 'ADMIN', null],
      default: null,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    arrivedAt: {
      type: Date,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index géospatial sur le point de départ pour l'algorithme de proximité
rideSchema.index({ 'pickup.location': '2dsphere' });
// Index d'historique optimisé pour les requêtes de reporting
rideSchema.index({ status: 1, createdAt: -1 });

const Ride = mongoose.model('Ride', rideSchema);

module.exports = Ride;
