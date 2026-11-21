/**
 * Middleware global de gestion des erreurs Express.
 * Capture toutes les exceptions, normalise la réponse et prévient la fuite d'informations sensibles.
 */

const ApiError = require('../utils/apiError');
const env = require('../config/env');

/**
 * Middleware de traitement d'erreurs global.
 * @param {Error} err - Erreur interceptée.
 * @param {import('express').Request} req - Requête entrante.
 * @param {import('express').Response} res - Réponse Express.
 * @param {import('express').NextFunction} next - Prochain middleware.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Conversion des erreurs standard en ApiError
  if (!(error instanceof ApiError)) {
    // Erreur de cast MongoDB (ex: identifiant invalide)
    if (err.name === 'CastError') {
      const message = `Ressource introuvable. Format d'identifiant invalide : ${err.path}.`;
      error = ApiError.badRequest(message);
    }
    // Erreur de validation Mongoose
    else if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((val) => val.message);
      error = ApiError.badRequest('Erreur de validation des données.', messages);
    }
    // Erreur d'index unique dupliqué MongoDB (code 11000)
    else if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || 'champ';
      const message = `Cette valeur existe déjà pour le champ : ${field}.`;
      error = ApiError.conflict(message);
    }
    // Erreurs liées aux tokens JWT
    else if (err.name === 'JsonWebTokenError') {
      error = ApiError.unauthorized('Token d’authentification invalide.');
    } else if (err.name === 'TokenExpiredError') {
      error = ApiError.unauthorized('Votre session a expiré. Veuillez vous reconnecter.');
    }
    // Erreur serveur inconnue
    else {
      const statusCode = err.statusCode || 500;
      const message = err.message || 'Une erreur interne inattendue est survenue.';
      error = new ApiError(statusCode, message, null, false);
    }
  }

  // Journalisation sécurisée de l'erreur sur le serveur
  if (!error.isOperational) {
    console.error(`💥 [ERREUR NON GÉRÉE] ${req.method} ${req.originalUrl} :`, err);
  }

  const responsePayload = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    ...(error.errors ? { errors: error.errors } : {}),
    // La stack trace n'est JAMAIS exposée en production (standard bancaire)
    ...(!env.IS_PRODUCTION ? { stack: err.stack } : {}),
  };

  return res.status(error.statusCode).json(responsePayload);
};

module.exports = errorHandler;
