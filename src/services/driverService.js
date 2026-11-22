/**
 * Service métier pour la gestion des chauffeurs et l'algorithme géospatial.
 * Exploite l'index 2dsphere de MongoDB pour des recherches de proximité ultra-rapides.
 */

const Driver = require('../models/Driver');
const ApiError = require('../utils/apiError');
const { DRIVER_STATUSES } = require('../config/constants');

class DriverService {
  /**
   * Met à jour la position GPS d'un chauffeur en temps réel.
   */
  static async updateLocation(driverId, longitude, latitude) {
    const updatedDriver = await Driver.findByIdAndUpdate(
      driverId,
      {
        location: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        lastLocationUpdate: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedDriver) {
      throw ApiError.notFound('Chauffeur introuvable.');
    }

    return {
      driverId: updatedDriver._id,
      coordinates: updatedDriver.location.coordinates,
      lastLocationUpdate: updatedDriver.lastLocationUpdate,
    };
  }

  /**
   * Modifie le statut opérationnel d'un chauffeur (OFFLINE / AVAILABLE / BUSY).
   */
  static async updateStatus(driverId, status) {
    const driver = await Driver.findById(driverId);
    if (!driver) {
      throw ApiError.notFound('Chauffeur introuvable.');
    }

    if (!driver.isApproved && status === DRIVER_STATUSES.AVAILABLE) {
      throw ApiError.forbidden(
        'Votre compte n’a pas encore été validé par l’administration. Vous ne pouvez pas passer en ligne.'
      );
    }

    driver.status = status;
    await driver.save();

    return {
      driverId: driver._id,
      status: driver.status,
    };
  }

  /**
   * Récupère les métriques de performance et de gains d'un chauffeur.
   */
  static async getDriverStats(driverId) {
    const driver = await Driver.findById(driverId);
    if (!driver) {
      throw ApiError.notFound('Chauffeur introuvable.');
    }

    return {
      fullName: driver.fullName,
      vehicleType: driver.vehicleType,
      licensePlate: driver.licensePlate,
      status: driver.status,
      isApproved: driver.isApproved,
      dailyEarnings: driver.dailyEarnings,
      totalEarnings: driver.totalEarnings,
      averageRating: driver.averageRating,
      totalRides: driver.totalRides,
    };
  }

  /**
   * Algorithme de recherche par proximité : trouve les chauffeurs disponibles les plus proches.
   * @param {number} longitude - Longitude du client.
   * @param {number} latitude - Latitude du client.
   * @param {number} radiusKm - Rayon maximal en kilomètres (défaut : 5 km).
   * @param {string} [vehicleType] - Filtre optionnel (MOTO_TAXI ou COMMUNAL_TAXI).
   */
  static async findNearbyDrivers(longitude, latitude, radiusKm = 5, vehicleType = null) {
    const maxDistanceMeters = radiusKm * 1000;

    const query = {
      isApproved: true,
      status: DRIVER_STATUSES.AVAILABLE,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistanceMeters,
        },
      },
    };

    if (vehicleType) {
      query.vehicleType = vehicleType;
    }

    const drivers = await Driver.find(query)
      .select('fullName vehicleType licensePlate location averageRating totalRides')
      .limit(20);

    return drivers;
  }
}

module.exports = DriverService;
