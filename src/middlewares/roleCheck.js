/**
 * Middlewares de contrôle d'accès basé sur les rôles (RBAC).
 * Exécute un double verrou rigoureux après validation du jeton JWT.
 */

const ApiError = require('../utils/apiError');
const { ROLES } = require('../config/constants');

/**
 * Générateur de middleware vérifiant si le rôle utilisateur est autorisé.
 * @param {...string} allowedRoles - Rôles autorisés à franchir la route.
 */
const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.userRole) {
      return next(ApiError.unauthorized('Accès non authentifié.'));
    }

    if (!allowedRoles.includes(req.userRole)) {
      return next(
        ApiError.forbidden(
          'Accès interdit : vous ne disposez pas des privilèges nécessaires pour exécuter cette action.'
        )
      );
    }

    next();
  };
};

/**
 * Middleware spécifique pour les administrateurs (Super Admin ou Support).
 */
const verifyAdmin = requireRoles(ROLES.SUPER_ADMIN, ROLES.SUPPORT);

/**
 * Middleware strict réservé exclusivement au Super Administrateur.
 */
const verifySuperAdmin = requireRoles(ROLES.SUPER_ADMIN);

/**
 * Middleware vérifiant que l'utilisateur est un chauffeur actif et approuvé.
 */
const verifyDriver = (req, res, next) => {
  if (!req.user || req.userRole !== ROLES.DRIVER) {
    return next(ApiError.forbidden('Accès réservé exclusivement aux chauffeurs de la plateforme.'));
  }

  if (!req.user.isApproved) {
    return next(
      ApiError.forbidden(
        'Votre compte chauffeur est actuellement en cours de vérification par l’administration.'
      )
    );
  }

  next();
};

/**
 * Middleware vérifiant que l'utilisateur est un passager.
 */
const verifyPassenger = requireRoles(ROLES.PASSENGER);

module.exports = {
  requireRoles,
  verifyAdmin,
  verifySuperAdmin,
  verifyDriver,
  verifyPassenger,
};
