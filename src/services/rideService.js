/**
 * Service métier pour la gestion du cycle de vie des courses.
 * Garantit l'absence de race condition grâce aux verrous atomiques MongoDB.
 */

const Ride = require('../models/Ride');
const Driver = require('../models/Driver');
const User = require('../models/User');
const PricingService = require('./pricingService');
const ApiError = require('../utils/apiError');
const { RIDE_STATUSES, DRIVER_STATUSES, ROLES } = require('../config/constants');

class RideService {
  /**
   * Crée une nouvelle demande de course pour un passager.
   */
  static async requestRide(passengerId, ridePayload) {
    const { vehicleType, pickup, destination, paymentMethod } = ridePayload;

    // Vérifier si le passager n'a pas déjà une course active en cours
    const activeRide = await Ride.findOne({
      passenger: passengerId,
      status: { $in: [RIDE_STATUSES.REQUESTED, RIDE_STATUSES.ACCEPTED, RIDE_STATUSES.ARRIVED, RIDE_STATUSES.IN_PROGRESS] },
    });

    if (activeRide) {
      throw ApiError.conflict('Vous avez déjà une course en cours. Veuillez la terminer avant d’en commander une autre.');
    }

    // Calcul de la distance et estimation tarifaire officielle
    const distanceKm = PricingService.calculateDistanceKm(pickup.coordinates, destination.coordinates);
    const estimatedDurationMin = PricingService.estimateDurationMinutes(distanceKm);
    const estimatedPrice = PricingService.calculateFare(vehicleType, distanceKm);

    const ride = await Ride.create({
      passenger: passengerId,
      vehicleType,
      pickup: {
        name: pickup.name,
        landmarkId: pickup.landmarkId || null,
        location: {
          type: 'Point',
          coordinates: pickup.coordinates,
        },
      },
      destination: {
        name: destination.name,
        landmarkId: destination.landmarkId || null,
        location: {
          type: 'Point',
          coordinates: destination.coordinates,
        },
      },
      estimatedDistanceKm: distanceKm,
      estimatedDurationMin,
      estimatedPrice,
      paymentMethod,
      status: RIDE_STATUSES.REQUESTED,
      requestedAt: new Date(),
    });

    return ride;
  }

  /**
   * Acceptation atomique d'une course par un chauffeur (résolution des conflits de concurrence).
   */
  static async acceptRide(driverId, rideId) {
    const driver = await Driver.findById(driverId);
    if (!driver || !driver.isApproved) {
      throw ApiError.forbidden('Votre compte chauffeur n’est pas autorisé à prendre des courses.');
    }

    if (driver.status === DRIVER_STATUSES.BUSY) {
      throw ApiError.conflict('Vous êtes actuellement en train d’effectuer une autre course.');
    }

    // Verrouillage atomique : seule la première requête modifiant une course 'REQUESTED' réussit
    const ride = await Ride.findOneAndUpdate(
      {
        _id: rideId,
        status: RIDE_STATUSES.REQUESTED,
        vehicleType: driver.vehicleType,
      },
      {
        driver: driverId,
        status: RIDE_STATUSES.ACCEPTED,
        acceptedAt: new Date(),
      },
      { new: true }
    ).populate('passenger', 'fullName phoneNumber averageRating');

    if (!ride) {
      throw ApiError.conflict('Cette course n’est plus disponible ou a déjà été prise en charge par un autre conducteur.');
    }

    // Marquer le chauffeur comme occupé
    driver.status = DRIVER_STATUSES.BUSY;
    await driver.save();

    return ride;
  }

  /**
   * Fait progresser la course (ARRIVED, IN_PROGRESS, COMPLETED).
   */
  static async updateRideStatus(driverId, rideId, nextStatus) {
    const ride = await Ride.findOne({ _id: rideId, driver: driverId });
    if (!ride) {
      throw ApiError.notFound('Course introuvable pour ce chauffeur.');
    }

    // Validation de la machine à états finis
    const allowedTransitions = {
      [RIDE_STATUSES.ACCEPTED]: [RIDE_STATUSES.ARRIVED, RIDE_STATUSES.CANCELLED],
      [RIDE_STATUSES.ARRIVED]: [RIDE_STATUSES.IN_PROGRESS, RIDE_STATUSES.CANCELLED],
      [RIDE_STATUSES.IN_PROGRESS]: [RIDE_STATUSES.COMPLETED],
    };

    const validNextStates = allowedTransitions[ride.status] || [];
    if (!validNextStates.includes(nextStatus)) {
      throw ApiError.badRequest(`Transition interdite du statut ${ride.status} vers ${nextStatus}.`);
    }

    ride.status = nextStatus;

    if (nextStatus === RIDE_STATUSES.ARRIVED) {
      ride.arrivedAt = new Date();
    } else if (nextStatus === RIDE_STATUSES.IN_PROGRESS) {
      ride.startedAt = new Date();
    } else if (nextStatus === RIDE_STATUSES.COMPLETED) {
      ride.completedAt = new Date();
      ride.finalPrice = ride.estimatedPrice;

      // Libérer le chauffeur et créditer ses gains
      const driver = await Driver.findById(driverId);
      if (driver) {
        driver.status = DRIVER_STATUSES.AVAILABLE;
        driver.dailyEarnings += ride.finalPrice;
        driver.totalEarnings += ride.finalPrice;
        driver.totalRides += 1;
        await driver.save();
      }

      // Incrémenter les courses du passager
      await User.findByIdAndUpdate(ride.passenger, { $inc: { totalRides: 1 } });
    }

    await ride.save();
    return ride;
  }

  /**
   * Annulation d'une course (par le passager ou le chauffeur).
   */
  static async cancelRide(userId, userRole, rideId, reason) {
    const ride = await Ride.findById(rideId);
    if (!ride) {
      throw ApiError.notFound('Course introuvable.');
    }

    if ([RIDE_STATUSES.COMPLETED, RIDE_STATUSES.CANCELLED].includes(ride.status)) {
      throw ApiError.badRequest('Cette course est déjà clôturée.');
    }

    // Une course en cours de trajet ne peut pas être annulée directement
    if (ride.status === RIDE_STATUSES.IN_PROGRESS) {
      throw ApiError.badRequest('Une course en cours de route ne peut pas être annulée.');
    }

    ride.status = RIDE_STATUSES.CANCELLED;
    ride.cancelledAt = new Date();
    ride.cancellationReason = reason;
    ride.cancelledBy = userRole === ROLES.DRIVER ? 'DRIVER' : 'PASSENGER';
    await ride.save();

    // Si un chauffeur était assigné, on le libère
    if (ride.driver) {
      await Driver.findByIdAndUpdate(ride.driver, { status: DRIVER_STATUSES.AVAILABLE });
    }

    // Gestion de l'angle mort des annulations répétitives
    if (userRole === ROLES.PASSENGER) {
      const passenger = await User.findById(userId);
      if (passenger) {
        passenger.cancellationCount += 1;
        // Pénalité : suspension temporaire de 30 minutes après 3 annulations abusives
        if (passenger.cancellationCount >= 3) {
          passenger.isSuspended = true;
          passenger.suspensionUntil = new Date(Date.now() + 30 * 60 * 1000);
          passenger.cancellationCount = 0; // Réinitialisation du compteur après sanction
        }
        await passenger.save();
      }
    }

    return ride;
  }

  /**
   * Récupère la course active courante d'un utilisateur (pour gestion de reprise après coupure).
   */
  static async getActiveRide(userId, userRole) {
    const filter = {
      status: { $in: [RIDE_STATUSES.REQUESTED, RIDE_STATUSES.ACCEPTED, RIDE_STATUSES.ARRIVED, RIDE_STATUSES.IN_PROGRESS] },
    };

    if (userRole === ROLES.DRIVER) {
      filter.driver = userId;
    } else {
      filter.passenger = userId;
    }

    const activeRide = await Ride.findOne(filter)
      .populate('passenger', 'fullName phoneNumber averageRating')
      .populate('driver', 'fullName phoneNumber vehicleType licensePlate location averageRating');

    return activeRide;
  }

  /**
   * Récupère les détails d'une course par son identifiant.
   */
  static async getRideById(rideId) {
    const ride = await Ride.findById(rideId)
      .populate('passenger', 'fullName phoneNumber averageRating')
      .populate('driver', 'fullName phoneNumber vehicleType licensePlate location averageRating');

    if (!ride) {
      throw ApiError.notFound('Course introuvable.');
    }

    return ride;
  }
}

module.exports = RideService;
