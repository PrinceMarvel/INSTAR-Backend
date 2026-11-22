/**
 * Contrôleur pour l'espace et les fonctionnalités chauffeur de l'API INSTAR.
 * Gère les mises à jour de localisation, de statut et les requêtes de proximité.
 */

const DriverService = require('../services/driverService');
const ApiResponse = require('../utils/apiResponse');

class DriverController {
  /**
   * Mise à jour de la position GPS du chauffeur connecté.
   */
  static async updateLocation(req, res, next) {
    try {
      const { longitude, latitude } = req.body;
      const result = await DriverService.updateLocation(req.user._id, longitude, latitude);

      return ApiResponse.success(
        res,
        'Position géographique mise à jour avec succès.',
        result
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bascule du statut de disponibilité du chauffeur.
   */
  static async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const result = await DriverService.updateStatus(req.user._id, status);

      return ApiResponse.success(
        res,
        `Statut opérationnel mis à jour : ${status}.`,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Consultation du tableau de bord personnel du chauffeur (gains, notes, courses).
   */
  static async getMyStats(req, res, next) {
    try {
      const stats = await DriverService.getDriverStats(req.user._id);

      return ApiResponse.success(
        res,
        'Statistiques du chauffeur récupérées avec succès.',
        stats
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recherche de proximité pour les passagers : liste les chauffeurs disponibles.
   */
  static async getNearbyDrivers(req, res, next) {
    try {
      const { longitude, latitude, radiusKm, vehicleType } = req.query;

      const drivers = await DriverService.findNearbyDrivers(
        parseFloat(longitude),
        parseFloat(latitude),
        radiusKm ? parseFloat(radiusKm) : 5,
        vehicleType
      );

      return ApiResponse.success(
        res,
        `${drivers.length} chauffeur(s) disponible(s) trouvé(s) à proximité.`,
        drivers
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DriverController;
