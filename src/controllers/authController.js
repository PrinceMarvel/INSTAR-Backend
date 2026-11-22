/**
 * Contrôleur d'authentification pour la plateforme INSTAR.
 * Réceptionne les requêtes HTTP, délègue aux services métier et formate les réponses.
 */

const AuthService = require('../services/authService');
const ApiResponse = require('../utils/apiResponse');

class AuthController {
  /**
   * Inscription d'un passager.
   */
  static async registerPassenger(req, res, next) {
    try {
      const result = await AuthService.registerPassenger(req.body);
      return ApiResponse.created(
        res,
        'Compte passager créé avec succès.',
        result
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Inscription d'un chauffeur (moto ou taxi).
   */
  static async registerDriver(req, res, next) {
    try {
      const result = await AuthService.registerDriver(req.body);
      return ApiResponse.created(
        res,
        result.message,
        {
          driver: result.driver,
          token: result.token,
        }
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Connexion mobile unifiée (passager ou chauffeur).
   */
  static async loginMobile(req, res, next) {
    try {
      const { phoneNumber, password, userType } = req.body;
      const result = await AuthService.loginMobileUser(phoneNumber, password, userType);

      return ApiResponse.success(
        res,
        'Connexion réussie.',
        result
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Connexion de l'espace administration.
   */
  static async loginAdmin(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.loginAdmin(email, password);

      return ApiResponse.success(
        res,
        'Authentification administrateur réussie.',
        result
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupération du profil de la session en cours (/me).
   */
  static async getCurrentProfile(req, res, next) {
    try {
      const userProfile = req.user.toJSON ? req.user.toJSON() : req.user;

      return ApiResponse.success(
        res,
        'Profil utilisateur récupéré avec succès.',
        {
          user: userProfile,
          role: req.userRole,
        }
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
