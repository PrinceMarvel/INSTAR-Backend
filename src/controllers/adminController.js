/**
 * Contrôleur d'administration pour la plateforme INSTAR.
 * Expose les endpoints de monitoring, d'approbation et de gestion des commissions.
 */

const AdminService = require('../services/adminService');
const BillingService = require('../services/billingService');
const ApiResponse = require('../utils/apiResponse');

class AdminController {
  /**
   * Consultation du tableau de bord exécutif (KPIs opérationnels et financiers).
   */
  static async getDashboardMetrics(req, res, next) {
    try {
      const metrics = await AdminService.getDashboardMetrics();

      return ApiResponse.success(
        res,
        'Métriques de supervision récupérées avec succès.',
        metrics
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupération des dossiers chauffeurs en attente de validation.
   */
  static async getPendingDrivers(req, res, next) {
    try {
      const pendingDrivers = await AdminService.getPendingDrivers();

      return ApiResponse.success(
        res,
        `${pendingDrivers.length} chauffeur(s) en attente d’approbation.`,
        pendingDrivers
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validation administrative d'un compte chauffeur.
   */
  static async approveDriver(req, res, next) {
    try {
      const { driverId } = req.params;
      const { isApproved } = req.body;
      const result = await AdminService.setDriverApproval(driverId, isApproved);

      return ApiResponse.success(
        res,
        `Statut d'approbation mis à jour pour le chauffeur ${result.fullName}.`,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Liste complète de la flotte des chauffeurs.
   */
  static async getAllDrivers(req, res, next) {
    try {
      const drivers = await AdminService.getAllDrivers(req.query);

      return ApiResponse.success(
        res,
        'Liste des chauffeurs récupérée avec succès.',
        drivers
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mise à jour du taux de commission globale de l'application.
   */
  static async updateCommissionRate(req, res, next) {
    try {
      const { commissionPercentage } = req.body;
      const updatedConfig = await BillingService.updateCommissionRate(
        req.user._id,
        commissionPercentage
      );

      return ApiResponse.success(
        res,
        `Nouveau taux de commission fixé à ${updatedConfig.commissionPercentage}%.`,
        updatedConfig
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Modération d'un compte utilisateur (blocage / déblocage).
   */
  static async toggleUserStatus(req, res, next) {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;
      const result = await AdminService.toggleUserStatus(userId, isActive);

      return ApiResponse.success(
        res,
        `Statut du passager mis à jour : ${result.isActive ? 'Actif' : 'Désactivé'}.`,
        result
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AdminController;
