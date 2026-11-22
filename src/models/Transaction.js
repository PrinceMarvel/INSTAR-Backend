/**
 * Modèle de journal d'audit des transactions financières (Ledger).
 * Chaque mouvement d'argent est consigné de façon immuable pour conformité et audit.
 */

const mongoose = require('mongoose');

const TRANSACTION_TYPES = Object.freeze({
  COMMISSION_DEDUCTION: 'COMMISSION_DEDUCTION', // Débit de la commission suite à course en espèces
  FARE_CREDIT: 'FARE_CREDIT',                   // Crédit des 90% nets suite à course Mobile Money
  WALLET_TOPUP: 'WALLET_TOPUP',                 // Rechargement du solde par le chauffeur (Wave/MoMo)
  WITHDRAWAL: 'WITHDRAWAL',                     // Retrait des gains vers son compte Mobile Money
  PENALTY: 'PENALTY',                           // Débit suite à pénalité validée
});

const transactionSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: [true, 'Une transaction doit être rattachée à un chauffeur.'],
      index: true,
    },
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(TRANSACTION_TYPES),
      required: true,
      index: true,
    },
    direction: {
      type: String,
      enum: ['CREDIT', 'DEBIT'],
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Le montant de la transaction est obligatoire.'],
      min: [1, 'Le montant doit être supérieur à 0.'],
    },
    currency: {
      type: String,
      default: 'XOF',
      uppercase: true,
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'MOBILE_MONEY', 'SYSTEM'],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Enregistrement immuable (pas d'update)
  }
);

// Index composite pour l'historique chronologique des transactions d'un chauffeur
transactionSchema.index({ driver: 1, createdAt: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = {
  Transaction,
  TRANSACTION_TYPES,
};
