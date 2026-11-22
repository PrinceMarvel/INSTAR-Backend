/**
 * Modèle de données pour les chauffeurs (Motos-taxis et Taxis communaux) de Gagnoa.
 * Comporte l'indexation géospatiale 2dsphere pour le matching haute performance en temps réel.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, VEHICLE_TYPES, DRIVER_STATUSES } = require('../config/constants');

const driverSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Le nom complet du chauffeur est obligatoire.'],
      trim: true,
      maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères.'],
    },
    phoneNumber: {
      type: String,
      required: [true, 'Le numéro de téléphone est obligatoire.'],
      unique: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est obligatoire.'],
      minlength: [6, 'Le mot de passe doit comporter au moins 6 caractères.'],
      select: false,
    },
    role: {
      type: String,
      default: ROLES.DRIVER,
      immutable: true,
    },
    vehicleType: {
      type: String,
      required: [true, 'Le type de véhicule est obligatoire.'],
      enum: {
        values: [VEHICLE_TYPES.MOTO_TAXI, VEHICLE_TYPES.COMMUNAL_TAXI],
        message: 'Le type de véhicule doit être soit MOTO_TAXI soit COMMUNAL_TAXI.',
      },
      index: true,
    },
    licensePlate: {
      type: String,
      required: [true, 'Le numéro d’immatriculation ou de registre est requis.'],
      trim: true,
      uppercase: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: [DRIVER_STATUSES.OFFLINE, DRIVER_STATUSES.AVAILABLE, DRIVER_STATUSES.BUSY],
        message: 'Statut de chauffeur invalide.',
      },
      default: DRIVER_STATUSES.OFFLINE,
      index: true,
    },
    // Données géospatiales normalisées GeoJSON
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [-5.9501, 6.1302], // Centre de Gagnoa par défaut
      },
    },
    lastLocationUpdate: {
      type: Date,
      default: Date.now,
    },
    dailyEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageRating: {
      type: Number,
      default: 5.0,
      min: 1,
      max: 5,
    },
    totalRides: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index géospatial critique pour la recherche par proximité ($near / $geoWithin)
driverSchema.index({ location: '2dsphere' });
// Index combiné pour filtrer rapidement les chauffeurs éligibles et disponibles
driverSchema.index({ isApproved: 1, status: 1, vehicleType: 1 });

// Hachage du mot de passe avant enregistrement si modifié
driverSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Comparaison sécurisée du mot de passe
driverSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const Driver = mongoose.model('Driver', driverSchema);

module.exports = Driver;
