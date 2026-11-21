/**
 * Classe d'erreur opérationnelle standardisée de l'API INSTAR.
 * Permet de lever des exceptions maîtrisées sans divulguer la stack trace en production.
 */

class ApiError extends Error {
  /**
   * @param {number} statusCode - Code de statut HTTP.
   * @param {string} message - Message d'erreur explicite en français.
   * @param {array|null} errors - Liste détaillée d'erreurs éventuelles (ex: validation).
   * @param {boolean} isOperational - Indique si l'erreur est prévisible/maîtrisée.
   */
  constructor(statusCode, message, errors = null, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }

  // Fabriques statiques pour les erreurs courantes
  static badRequest(message = 'Requête invalide.', errors = null) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Authentification requise pour accéder à cette ressource.') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Accès interdit. Droits insuffisants.') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Ressource demandée introuvable.') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Conflit détecté avec une ressource existante.') {
    return new ApiError(409, message);
  }

  static tooManyRequests(message = 'Trop de requêtes effectuées. Veuillez patienter un instant.') {
    return new ApiError(429, message);
  }

  static internal(message = 'Une erreur interne inattendue est survenue.') {
    return new ApiError(500, message, null, false);
  }
}

module.exports = ApiError;
