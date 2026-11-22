/**
 * Schémas de validation des requêtes relatives aux chauffeurs (Joi).
 * Sécurise les entrées de géolocalisation et les changements d'états opérationnels.
 */

const Joi = require('joi');
const { DRIVER_STATUSES, VEHICLE_TYPES } = require('../config/constants');

// Validation des coordonnées GPS [longitude, latitude]
const locationUpdateSchema = Joi.object({
  longitude: Joi.number().min(-180).max(180).required().messages({
    'number.base': 'La longitude doit être un nombre décimal valide.',
    'number.min': 'La longitude minimale est de -180 degrés.',
    'number.max': 'La longitude maximale est de 180 degrés.',
    'any.required': 'La longitude est obligatoire.',
  }),
  latitude: Joi.number().min(-90).max(90).required().messages({
    'number.base': 'La latitude doit être un nombre décimal valide.',
    'number.min': 'La latitude minimale est de -90 degrés.',
    'number.max': 'La latitude maximale est de 90 degrés.',
    'any.required': 'La latitude est obligatoire.',
  }),
}).unknown(false);

// Validation du changement de statut de disponibilité
const statusUpdateSchema = Joi.object({
  status: Joi.string()
    .valid(DRIVER_STATUSES.OFFLINE, DRIVER_STATUSES.AVAILABLE, DRIVER_STATUSES.BUSY)
    .required()
    .messages({
      'any.only': 'Le statut doit être OFFLINE, AVAILABLE ou BUSY.',
      'any.required': 'Le statut de disponibilité est obligatoire.',
    }),
}).unknown(false);

// Validation de la recherche de chauffeurs à proximité
const nearbyDriversQuerySchema = Joi.object({
  longitude: Joi.number().min(-180).max(180).required().messages({
    'number.base': 'La longitude est requise sous forme de nombre décimal.',
    'any.required': 'La longitude de référence est obligatoire.',
  }),
  latitude: Joi.number().min(-90).max(90).required().messages({
    'number.base': 'La latitude est requise sous forme de nombre décimal.',
    'any.required': 'La latitude de référence est obligatoire.',
  }),
  vehicleType: Joi.string()
    .valid(VEHICLE_TYPES.MOTO_TAXI, VEHICLE_TYPES.COMMUNAL_TAXI)
    .optional()
    .messages({
      'any.only': 'Type de véhicule invalide.',
    }),
  radiusKm: Joi.number().min(0.5).max(30).default(5).messages({
    'number.min': 'Le rayon de recherche minimal est de 0.5 km.',
    'number.max': 'Le rayon de recherche maximal est de 30 km.',
  }),
}).unknown(false);

module.exports = {
  locationUpdateSchema,
  statusUpdateSchema,
  nearbyDriversQuerySchema,
};
