/**
 * Middlewares de limitation du débit des requêtes (Rate Limiting).
 * Prévient les attaques par force brute, les abus d'API et les dénis de service applicatifs.
 */

const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/apiError');

/**
 * Limiteur global appliqué à l'ensemble des routes de l'API.
 * 150 requêtes par fenêtre de 15 minutes par adresse IP.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      ApiError.tooManyRequests(
        'Limite globale de requêtes atteinte. Veuillez patienter avant de renouveler vos requêtes.'
      )
    );
  },
});

/**
 * Limiteur renforcé pour les routes sensibles d'authentification (connexion, inscription).
 * 10 tentatives maximum par fenêtre de 15 minutes pour contrer le credential stuffing.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      ApiError.tooManyRequests(
        'Trop de tentatives d’authentification échouées. Par mesure de sécurité, votre accès est temporairement suspendu pendant 15 minutes.'
      )
    );
  },
});

/**
 * Limiteur pour la création des commandes de courses.
 * 10 commandes maximum par minute pour éviter les doubles clics ou le spamming de chauffeurs.
 */
const rideOrderLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      ApiError.tooManyRequests(
        'Veuillez patienter quelques instants avant de soumettre une nouvelle demande de course.'
      )
    );
  },
});

module.exports = {
  globalLimiter,
  authLimiter,
  rideOrderLimiter,
};
