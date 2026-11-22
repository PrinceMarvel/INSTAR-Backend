/**
 * Modèle de données pour les passagers / clients de la plateforme INSTAR.
 * Gère l'authentification par numéro de téléphone, l'évaluation et la conformité.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Le nom complet du passager est requis.'],
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
      default: ROLES.PASSENGER,
      immutable: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    cancellationCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspensionUntil: {
      type: Date,
      default: null,
    },
    averageRating: {
      type: Number,
      default: 5.0,
      min: [1, 'La note minimale est de 1.'],
      max: [5, 'La note maximale est de 5.'],
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

// Hachage du mot de passe avant enregistrement si modifié
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Comparaison sécurisée du mot de passe
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
