/**
 * Service métier pour la validation automatique et instantanée des paiements.
 * Orchestre les flux Mobile Money / Espèces et déclenche la répartition des commissions.
 */

const crypto = require('crypto');
const Ride = require('../models/Ride');
const BillingService = require('./billingService');
const { PAYMENT_STATUSES, PAYMENT_METHODS, RIDE_STATUSES } = require('../config/constants');
const ApiError = require('../utils/apiError');
const { getIO } = require('../sockets/socketManager');

class PaymentService {
  /**
   * Traite la validation automatique et sans délai du paiement d'une course.
   */
  static async processAutomaticPayment(payload, userId) {
    const { rideId, paymentMethod, operator } = payload;

    const ride = await Ride.findById(rideId).populate('passenger driver');
    if (!ride) {
      throw ApiError.notFound('Course introuvable.');
    }

    if (ride.paymentStatus === PAYMENT_STATUSES.COMPLETED) {
      throw ApiError.conflict('Cette course a déjà été payée et validée.');
    }

    if (![RIDE_STATUSES.IN_PROGRESS, RIDE_STATUSES.COMPLETED].includes(ride.status)) {
      throw ApiError.badRequest('Le paiement ne peut être validé que pour une course en cours ou terminée.');
    }

    // Génération d'une référence financière unique et traçable
    const transactionReference = `INSTAR-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Mise à jour de la course
    ride.paymentMethod = paymentMethod;
    ride.paymentStatus = PAYMENT_STATUSES.COMPLETED;
    ride.status = RIDE_STATUSES.COMPLETED;
    if (!ride.completedAt) {
      ride.completedAt = new Date();
    }
    if (!ride.finalPrice) {
      ride.finalPrice = ride.estimatedPrice;
    }
    await ride.save();

    // Exécution automatique de la répartition financière et des commissions
    const settlementResult = await BillingService.processRideSettlement(ride);

    // Notification WebSocket instantanée aux deux terminaux (passager et chauffeur)
    try {
      const io = getIO();
      const notificationPayload = {
        rideId: ride._id,
        transactionReference,
        finalPrice: ride.finalPrice,
        paymentMethod,
        operator: operator || null,
        status: PAYMENT_STATUSES.COMPLETED,
        timestamp: new Date().toISOString(),
      };

      if (ride.passenger?._id) {
        io.to(`user:${ride.passenger._id}`).emit('payment:confirmed', notificationPayload);
      }
      if (ride.driver?._id) {
        io.to(`user:${ride.driver._id}`).emit('payment:confirmed', {
          ...notificationPayload,
          netEarnings: settlementResult.split.driverAmount,
          commissionDeducted: settlementResult.split.commissionAmount,
          newWalletBalance: settlementResult.wallet.balance,
        });
      }
      io.to(`ride:${ride._id}`).emit('payment:confirmed', notificationPayload);
    } catch (err) {
      console.warn('⚠️ [PaymentService] Notification socket différée :', err.message);
    }

    return {
      success: true,
      transactionReference,
      rideId: ride._id,
      finalPrice: ride.finalPrice,
      paymentMethod,
      operator: operator || null,
      paymentStatus: PAYMENT_STATUSES.COMPLETED,
      split: settlementResult.split,
    };
  }

  /**
   * Produit le reçu numérique officiel d'une course.
   */
  static async generateReceipt(rideId) {
    const ride = await Ride.findById(rideId)
      .populate('passenger', 'fullName phoneNumber')
      .populate('driver', 'fullName phoneNumber vehicleType licensePlate');

    if (!ride) {
      throw ApiError.notFound('Course introuvable.');
    }

    return {
      receiptNumber: `REC-${ride._id.toString().slice(-8).toUpperCase()}`,
      issuedAt: ride.completedAt || ride.updatedAt,
      passenger: {
        fullName: ride.passenger?.fullName || 'Client INSTAR',
        phoneNumber: ride.passenger?.phoneNumber,
      },
      driver: {
        fullName: ride.driver?.fullName || 'Chauffeur INSTAR',
        vehicleType: ride.driver?.vehicleType,
        licensePlate: ride.driver?.licensePlate,
      },
      trip: {
        pickup: ride.pickup.name,
        destination: ride.destination.name,
        distanceKm: ride.estimatedDistanceKm,
      },
      financials: {
        totalFare: ride.finalPrice || ride.estimatedPrice,
        currency: 'XOF',
        paymentMethod: ride.paymentMethod,
        paymentStatus: ride.paymentStatus,
      },
    };
  }
}

module.exports = PaymentService;
