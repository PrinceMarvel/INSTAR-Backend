/**
 * Service métier de facturation, de commissionnement et de gestion des portefeuilles.
 * Applique la règle d'intégrité bancaire : totalFare = commissionAmount + driverAmount.
 */

const PlatformConfig = require('../models/PlatformConfig');
const DriverWallet = require('../models/DriverWallet');
const { Transaction, TRANSACTION_TYPES } = require('../models/Transaction');
const PlatformRevenue = require('../models/PlatformRevenue');
const { PAYMENT_METHODS } = require('../config/constants');
const ApiError = require('../utils/apiError');

class BillingService {
  /**
   * Calcule la répartition financière exacte entre l'application et le chauffeur.
   * Règle d'or : aucun centime perdu lors des arrondis.
   * @param {number} totalFare - Coût total de la course en FCFA.
   * @param {number|null} [forcedCommissionRate=null] - Taux de commission optionnel.
   */
  static async calculateSplit(totalFare, forcedCommissionRate = null) {
    if (typeof totalFare !== 'number' || totalFare < 0) {
      throw ApiError.badRequest('Le montant total de la course doit être un nombre positif.');
    }

    let commissionRate = forcedCommissionRate;
    if (commissionRate === null || commissionRate === undefined) {
      const config = await PlatformConfig.getActiveConfig();
      commissionRate = config.commissionPercentage;
    }

    // Calcul de la commission avec arrondi bancaire au Franc entier le plus proche
    const commissionAmount = Math.round((totalFare * commissionRate) / 100);

    // La part chauffeur est la différence stricte pour garantir l'égalité exacte
    const driverAmount = totalFare - commissionAmount;

    return {
      totalFare,
      commissionPercentage: commissionRate,
      commissionAmount,
      driverAmount,
    };
  }

  /**
   * Traite la liquidation financière à la clôture d'une course.
   * Met à jour le portefeuille du chauffeur et consigne les revenus plateforme.
   * @param {object} ride - Document de la course clôturée.
   */
  static async processRideSettlement(ride) {
    if (!ride || !ride.driver) {
      throw ApiError.badRequest('Données de course incomplètes pour la facturation.');
    }

    const config = await PlatformConfig.getActiveConfig();
    const split = await this.calculateSplit(ride.finalPrice || ride.estimatedPrice);
    const wallet = await DriverWallet.getOrCreateWallet(ride.driver);

    const balanceBefore = wallet.balance;

    if (ride.paymentMethod === PAYMENT_METHODS.CASH) {
      // PAIEMENT EN ESPÈCES : Le chauffeur a déjà l'argent physique (100%).
      // L'application déduit sa commission de son portefeuille virtuel.
      wallet.balance -= split.commissionAmount;
      wallet.totalCommissionPaid += split.commissionAmount;

      // Vérification du seuil de dette : verrouille le portefeuille si le solde négatif est critique
      if (wallet.balance < config.maxNegativeWalletBalance) {
        wallet.isLocked = true;
      }

      await wallet.save();

      // Enregistrement dans le grand livre immuable des transactions
      await Transaction.create({
        driver: ride.driver,
        ride: ride._id,
        type: TRANSACTION_TYPES.COMMISSION_DEDUCTION,
        direction: 'DEBIT',
        amount: split.commissionAmount,
        currency: config.currency,
        balanceBefore,
        balanceAfter: wallet.balance,
        paymentMethod: 'CASH',
        description: `Commission de ${split.commissionPercentage}% prélevée sur course en espèces #${ride._id}`,
      });
    } else {
      // PAIEMENT MOBILE MONEY / WAVE : L'application a encaissé la totalité.
      // Elle conserve la commission et crédite la part nette (90%) sur le portefeuille du chauffeur.
      wallet.balance += split.driverAmount;
      wallet.totalEarned += split.driverAmount;
      await wallet.save();

      await Transaction.create({
        driver: ride.driver,
        ride: ride._id,
        type: TRANSACTION_TYPES.FARE_CREDIT,
        direction: 'CREDIT',
        amount: split.driverAmount,
        currency: config.currency,
        balanceBefore,
        balanceAfter: wallet.balance,
        paymentMethod: 'MOBILE_MONEY',
        description: `Crédit de la part nette (${100 - split.commissionPercentage}%) suite à course Mobile Money #${ride._id}`,
      });
    }

    // Enregistrement des revenus officiels de la plateforme
    await PlatformRevenue.create({
      ride: ride._id,
      driver: ride.driver,
      totalFare: split.totalFare,
      commissionPercentage: split.commissionPercentage,
      commissionAmount: split.commissionAmount,
      driverAmount: split.driverAmount,
      paymentMethod: ride.paymentMethod,
      currency: config.currency,
    });

    return {
      split,
      wallet: {
        balance: wallet.balance,
        isLocked: wallet.isLocked,
      },
    };
  }

  /**
   * Consultation du solde et de l'historique de portefeuille d'un chauffeur.
   */
  static async getDriverWalletData(driverId) {
    const wallet = await DriverWallet.getOrCreateWallet(driverId);
    const recentTransactions = await Transaction.find({ driver: driverId })
      .sort({ createdAt: -1 })
      .limit(20);

    return {
      wallet,
      recentTransactions,
    };
  }

  /**
   * Mise à jour dynamique du pourcentage de commission de l'application (Action Admin).
   */
  static async updateCommissionRate(adminId, newPercentage) {
    if (newPercentage < 0 || newPercentage > 50) {
      throw ApiError.badRequest('Le pourcentage de commission doit être compris entre 0 et 50%.');
    }

    const config = await PlatformConfig.getActiveConfig();
    config.commissionPercentage = newPercentage;
    config.lastUpdatedBy = adminId;
    await config.save();

    return config;
  }
}

module.exports = BillingService;
