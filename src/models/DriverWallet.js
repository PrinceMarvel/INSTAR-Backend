/**
 * Modèle de données pour le portefeuille virtuel (Wallet) des chauffeurs INSTAR.
 * Assure le suivi du solde, des gains cumulés et des commissions dues en FCFA.
 */

const mongoose = require('mongoose');

const driverWalletSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: [true, 'Le portefeuille doit être obligatoirement rattaché à un chauffeur.'],
      unique: true,
      index: true,
    },
    // Solde courant disponible en FCFA (peut devenir négatif si commission sur courses en espèces impayée)
    balance: {
      type: Number,
      default: 0,
      required: true,
    },
    currency: {
      type: String,
      default: 'XOF',
      uppercase: true,
    },
    // Cumul historique de tous les gains nets perçus
    totalEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Cumul historique de toutes les commissions reversées à l'application
    totalCommissionPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Verrouillage automatique si la dette de commission dépasse le seuil autorisé
    isLocked: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Méthode statique d'assistance pour obtenir ou initialiser le portefeuille d'un chauffeur
driverWalletSchema.statics.getOrCreateWallet = async function (driverId) {
  let wallet = await this.findOne({ driver: driverId });
  if (!wallet) {
    wallet = await this.create({
      driver: driverId,
      balance: 0,
      totalEarned: 0,
      totalCommissionPaid: 0,
    });
  }
  return wallet;
};

const DriverWallet = mongoose.model('DriverWallet', driverWalletSchema);

module.exports = DriverWallet;
