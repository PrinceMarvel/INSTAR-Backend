/**
 * Middleware d'interception et de validation des schémas Joi.
 * Bloque les requêtes non conformes dès l'entrée et normalise les messages d'erreur.
 */

const ApiError = require('../utils/apiError');

/**
 * Crée un middleware de validation Express basé sur un schéma Joi.
 * @param {import('joi').ObjectSchema} schema - Schéma Joi attendu pour le corps de la requête.
 * @param {'body'|'query'|'params'} [source='body'] - Partie de la requête à valider.
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false, // Remonte toutes les erreurs en une seule passe
      stripUnknown: true, // Élimine les champs non déclarés (whitelisting strict)
    });

    if (error) {
      const errorDetails = error.details.map((detail) => detail.message);
      return next(ApiError.badRequest('Données d’entrée invalides.', errorDetails));
    }

    // Réassigne les données assainies et typées
    req[source] = value;
    next();
  };
};

module.exports = validate;
