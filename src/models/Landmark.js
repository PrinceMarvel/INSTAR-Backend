/**
 * Modèle de données pour les repères géographiques officiels de Gagnoa.
 * Permet un repérage précis et intuitif adapté aux réalités locales (Garahio, Dokui, etc.).
 */

const mongoose = require('mongoose');

const landmarkSchema = new mongoose.Schema(
  {
    landmarkId: {
      type: String,
      required: [true, 'L’identifiant unique du repère est obligatoire.'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Le nom du repère est obligatoire.'],
      trim: true,
      maxlength: [100, 'Le nom du repère ne peut pas dépasser 100 caractères.'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [255, 'La description ne peut pas dépasser 255 caractères.'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Les coordonnées géographiques [longitude, latitude] sont requises.'],
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index géospatial pour la sélection par proximité
landmarkSchema.index({ location: '2dsphere' });

const Landmark = mongoose.model('Landmark', landmarkSchema);

module.exports = Landmark;
