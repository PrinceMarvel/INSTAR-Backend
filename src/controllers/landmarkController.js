/**
 * Contrôleur pour la gestion des repères de Gagnoa et l'estimation tarifaire.
 */

const LandmarkService = require('../services/landmarkService');
const PricingService = require('../services/pricingService');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

class LandmarkController {
  /**
   * Retourne la liste complète des repères de Gagnoa pour les interfaces utilisateurs.
   */
  static async getAllLandmarks(req, res, next) {
    try {
      const landmarks = await LandmarkService.getAllActiveLandmarks();

      return ApiResponse.success(
        res,
        'Repères géographiques de Gagnoa récupérés avec succès.',
        landmarks
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calcule une estimation tarifaire transparente entre un point de départ et une destination.
   */
  static async estimateFare(req, res, next) {
    try {
      const { originCoords, destinationCoords } = req.body;

      if (!Array.isArray(originCoords) || originCoords.length !== 2) {
        throw ApiError.badRequest('Coordonnées de départ invalides. Format attendu : [longitude, latitude].');
      }

      if (!Array.isArray(destinationCoords) || destinationCoords.length !== 2) {
        throw ApiError.badRequest('Coordonnées de destination invalides. Format attendu : [longitude, latitude].');
      }

      const estimate = PricingService.getFullRideEstimate(originCoords, destinationCoords);

      return ApiResponse.success(
        res,
        'Estimation tarifaire calculée avec succès.',
        estimate
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = LandmarkController;
