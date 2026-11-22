/**
 * Contrôleur des courses pour l'API INSTAR.
 * Réceptionne les commandes, transitions d'étapes et demandes d'annulation.
 */

const RideService = require('../services/rideService');
const ApiResponse = require('../utils/apiResponse');

class RideController {
  /**
   * Création d'une nouvelle réservation de course par un passager.
   */
  static async requestRide(req, res, next) {
    try {
      const ride = await RideService.requestRide(req.user._id, req.body);

      return ApiResponse.created(
        res,
        'Demande de course enregistrée. Recherche d’un conducteur à proximité...',
        ride
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Prise en charge d'une course par un chauffeur (acceptation atomique).
   */
  static async acceptRide(req, res, next) {
    try {
      const { id } = req.params;
      const ride = await RideService.acceptRide(req.user._id, id);

      return ApiResponse.success(
        res,
        'Course acceptée avec succès. Vous pouvez vous rendre au point de rendez-vous.',
        ride
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Progression du statut de la course (ARRIVED, IN_PROGRESS, COMPLETED).
   */
  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const ride = await RideService.updateRideStatus(req.user._id, id, status);

      return ApiResponse.success(
        res,
        `Statut de la course mis à jour : ${status}.`,
        ride
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Annulation d'une course avec justification.
   */
  static async cancelRide(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const ride = await RideService.cancelRide(req.user._id, req.userRole, id, reason);

      return ApiResponse.success(
        res,
        'La course a été annulée.',
        ride
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupération de la course active en cours (résilience perte réseau / reconnexion).
   */
  static async getActiveRide(req, res, next) {
    try {
      const activeRide = await RideService.getActiveRide(req.user._id, req.userRole);

      return ApiResponse.success(
        res,
        activeRide ? 'Course active en cours récupérée.' : 'Aucune course active en cours.',
        activeRide
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupération des informations détaillées d'une course par son identifiant.
   */
  static async getRideDetails(req, res, next) {
    try {
      const { id } = req.params;
      const ride = await RideService.getRideById(id);

      return ApiResponse.success(
        res,
        'Détails de la course obtenus avec succès.',
        ride
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = RideController;
