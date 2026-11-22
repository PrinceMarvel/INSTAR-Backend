/**
 * Middleware d'authentification par JSON Web Token (JWT).
 * Extrait le jeton Bearer, vérifie sa validité cryptographique et charge l'utilisateur actif.
 */

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/apiError');
const { ROLES } = require('../config/constants');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Driver = require('../models/Driver');

/**
 * Vérifie le token JWT et injecte les informations du compte dans req.user.
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(ApiError.unauthorized('Accès refusé. Jeton d’authentification manquant.'));
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return next(ApiError.unauthorized('Format du jeton Bearer invalide.'));
    }

    // Décodage et vérification de la signature du JWT
    const decoded = jwt.verify(token, env.JWT_SECRET);

    let account = null;

    // Chargement de l'entité appropriée selon le rôle encodé
    if (decoded.role === ROLES.SUPER_ADMIN || decoded.role === ROLES.SUPPORT) {
      account = await Admin.findById(decoded.id);
    } else if (decoded.role === ROLES.DRIVER) {
      account = await Driver.findById(decoded.id);
    } else if (decoded.role === ROLES.PASSENGER) {
      account = await User.findById(decoded.id);
    }

    if (!account) {
      return next(ApiError.unauthorized('Utilisateur associé au jeton introuvable.'));
    }

    // Vérification de l'état actif du compte
    if (account.isActive === false) {
      return next(ApiError.forbidden('Ce compte a été désactivé par l’administration.'));
    }

    // Vérification d'une suspension temporaire éventuelle pour les passagers
    if (account.isSuspended) {
      if (account.suspensionUntil && account.suspensionUntil > new Date()) {
        return next(
          ApiError.forbidden(
            `Votre compte est temporairement suspendu jusqu'au ${account.suspensionUntil.toLocaleString(
              'fr-FR'
            )}.`
          )
        );
      }
    }

    // Injection du compte authentifié et de son rôle dans l'objet de requête Express
    req.user = account;
    req.userRole = decoded.role;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyToken,
};
