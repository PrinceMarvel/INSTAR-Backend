/**
 * Modèle de données pour les administrateurs du système INSTAR.
 * Intègre le contrôle d'accès basé sur les rôles (RBAC) et la sécurisation des mots de passe.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/constants');

const adminSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Le nom complet de l’administrateur est requis.'],
      trim: true,
      maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères.'],
    },
    email: {
      type: String,
      required: [true, 'L’adresse e-mail est obligatoire.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Veuillez fournir une adresse e-mail valide.'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est obligatoire.'],
      minlength: [8, 'Le mot de passe doit comporter au moins 8 caractères.'],
      select: false, // Ne jamais renvoyer le hash dans les requêtes par défaut
    },
    role: {
      type: String,
      enum: {
        values: [ROLES.SUPER_ADMIN, ROLES.SUPPORT],
        message: 'Rôle administrateur non reconnu.',
      },
      default: ROLES.SUPPORT,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
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
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Méthode d'instance pour comparer les mots de passe
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
