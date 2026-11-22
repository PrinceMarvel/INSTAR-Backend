/**
 * Modèle de configuration dynamique globale du système INSTAR.
 * Permet aux administrateurs de moduler les taux de commission et plafonds sans modifier le code source.
 */

const mongoose = require('mongoose');

const platformConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'DEFAULT_CONFIG',
      trim: true,
    },
    // Pourcentage prélevé par l'application sur chaque course (ex: 10 pour 10%)
    commissionPercentage: {
      type: Number,
      required: [true, 'Le pourcentage de commission de l’application est obligatoire.'],
      default: 10,
      min: [0, 'La commission ne peut pas être négative.'],
      max: [50, 'La commission ne peut pas dépasser 50%.'],
    },
    // Solde négatif maximal toléré sur le portefeuille du chauffeur pour les courses en espèces (en FCFA)
    maxNegativeWalletBalance: {
      type: Number,
      default: -5000, // Bloque les courses en espèces si la dette de commission dépasse 5000 FCFA
      max: [0, 'Le seuil de dette doit être une valeur inférieure ou égale à 0.'],
    },
    // Devise officielle
    currency: {
      type: String,
      default: 'XOF',
      uppercase: true,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Récupère la configuration courante active ou en crée une avec les valeurs par défaut (Singleton).
 */
platformConfigSchema.statics.getActiveConfig = async function () {
  let config = await this.findOne({ key: 'DEFAULT_CONFIG' });
  if (!config) {
    config = await this.create({
      key: 'DEFAULT_CONFIG',
      commissionPercentage: 10,
      maxNegativeWalletBalance: -5000,
      currency: 'XOF',
    });
  }
  return config;
};

const PlatformConfig = mongoose.model('PlatformConfig', platformConfigSchema);

module.exports = PlatformConfig;
