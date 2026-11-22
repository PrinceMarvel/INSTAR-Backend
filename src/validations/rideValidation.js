/**
 * Schémas de validation des requêtes relatives aux courses (Joi).
 * Sécurise la réservation, la sélection de véhicule et les transitions d'états.
 */

const Joi = require('joi');
const { VEHICLE_TYPES, PAYMENT_METHODS, RIDE_STATUSES } = require('../config/constants');

const locationPointSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Le nom du lieu est obligatoire.',
    'any.required': 'Le nom du lieu est obligatoire.',
  }),
  landmarkId: Joi.string().trim().allow(null, '').optional(),
  coordinates: Joi.array()
    .items(Joi.number().required())
    .length(2)
    .required()
    .messages({
      'array.base': 'Les coordonnées doivent être un tableau [longitude, latitude].',
      'array.length': 'Les coordonnées doivent comporter exactement la longitude et la latitude.',
      'any.required': 'Les coordonnées géographiques sont obligatoires.',
    }),
});

// Création d'une demande de réservation de course
const requestRideSchema = Joi.object({
  vehicleType: Joi.string()
    .valid(VEHICLE_TYPES.MOTO_TAXI, VEHICLE_TYPES.COMMUNAL_TAXI)
    .required()
    .messages({
      'any.only': 'Le type de véhicule doit être MOTO_TAXI ou COMMUNAL_TAXI.',
      'any.required': 'Le type de véhicule est obligatoire.',
    }),
  pickup: locationPointSchema.required().messages({
    'any.required': 'Le point de départ est obligatoire.',
  }),
  destination: locationPointSchema.required().messages({
    'any.required': 'Le point de destination est obligatoire.',
  }),
  paymentMethod: Joi.string()
    .valid(PAYMENT_METHODS.CASH, PAYMENT_METHODS.MOBILE_MONEY)
    .default(PAYMENT_METHODS.CASH)
    .messages({
      'any.only': 'Le mode de paiement doit être CASH ou MOBILE_MONEY.',
    }),
}).unknown(false);

// Transition de statut de course (ARRIVED, IN_PROGRESS, COMPLETED)
const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid(RIDE_STATUSES.ARRIVED, RIDE_STATUSES.IN_PROGRESS, RIDE_STATUSES.COMPLETED)
    .required()
    .messages({
      'any.only': 'Le nouveau statut doit être ARRIVED, IN_PROGRESS ou COMPLETED.',
      'any.required': 'Le statut de progression est obligatoire.',
    }),
}).unknown(false);

// Annulation d'une course
const cancelRideSchema = Joi.object({
  reason: Joi.string().trim().min(3).max(200).required().messages({
    'string.empty': 'Le motif d’annulation est obligatoire.',
    'string.min': 'Le motif d’annulation doit comporter au moins 3 caractères.',
    'any.required': 'Le motif d’annulation est obligatoire.',
  }),
}).unknown(false);

module.exports = {
  requestRideSchema,
  updateStatusSchema,
  cancelRideSchema,
};
