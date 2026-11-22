/**
 * Schémas de validation des requêtes d'authentification (Joi).
 * Sécurité audit : validation stricte, whitelisting et messages d'erreurs en français.
 */

const Joi = require('joi');
const { VEHICLE_TYPES, ROLES } = require('../config/constants');

// Expression régulière internationale E.164 (avec ou sans indicatif pays, ex: +2250102030405, +33612345678, etc.)
const phoneRegex = /^\+?[0-9]{8,15}$/;

const passengerRegisterSchema = Joi.object({
  fullName: Joi.string().trim().min(3).max(100).required().messages({
    'string.empty': 'Le nom complet est obligatoire.',
    'string.min': 'Le nom doit comporter au moins 3 caractères.',
    'string.max': 'Le nom ne peut pas dépasser 100 caractères.',
    'any.required': 'Le nom complet est obligatoire.',
  }),
  phoneNumber: Joi.string().trim().pattern(phoneRegex).required().messages({
    'string.empty': 'Le numéro de téléphone est obligatoire.',
    'string.pattern.base': 'Veuillez saisir un numéro de téléphone valide avec l’indicatif de votre pays (ex: +2250708091011 ou +33612345678).',
    'any.required': 'Le numéro de téléphone est obligatoire.',
  }),
  password: Joi.string().min(6).max(128).required().messages({
    'string.empty': 'Le mot de passe est obligatoire.',
    'string.min': 'Le mot de passe doit comporter au moins 6 caractères.',
    'string.max': 'Le mot de passe ne peut pas dépasser 128 caractères.',
    'any.required': 'Le mot de passe est obligatoire.',
  }),
}).unknown(false);

const driverRegisterSchema = Joi.object({
  fullName: Joi.string().trim().min(3).max(100).required().messages({
    'string.empty': 'Le nom complet est obligatoire.',
    'string.min': 'Le nom doit comporter au moins 3 caractères.',
    'string.max': 'Le nom ne peut pas dépasser 100 caractères.',
    'any.required': 'Le nom complet est obligatoire.',
  }),
  phoneNumber: Joi.string().trim().pattern(phoneRegex).required().messages({
    'string.empty': 'Le numéro de téléphone est obligatoire.',
    'string.pattern.base': 'Le numéro de téléphone doit être un numéro valide à 10 chiffres.',
    'any.required': 'Le numéro de téléphone est obligatoire.',
  }),
  password: Joi.string().min(6).max(128).required().messages({
    'string.empty': 'Le mot de passe est obligatoire.',
    'string.min': 'Le mot de passe doit comporter au moins 6 caractères.',
    'any.required': 'Le mot de passe est obligatoire.',
  }),
  vehicleType: Joi.string()
    .valid(VEHICLE_TYPES.MOTO_TAXI, VEHICLE_TYPES.COMMUNAL_TAXI)
    .required()
    .messages({
      'any.only': 'Le type de véhicule doit être soit MOTO_TAXI soit COMMUNAL_TAXI.',
      'any.required': 'Le type de véhicule est obligatoire.',
    }),
  licensePlate: Joi.string().trim().min(2).max(20).required().messages({
    'string.empty': 'Le numéro de plaque ou d’immatriculation est obligatoire.',
    'any.required': 'Le numéro de plaque ou d’immatriculation est obligatoire.',
  }),
}).unknown(false);

const phoneLoginSchema = Joi.object({
  phoneNumber: Joi.string().trim().pattern(phoneRegex).required().messages({
    'string.empty': 'Le numéro de téléphone est obligatoire.',
    'string.pattern.base': 'Numéro de téléphone invalide.',
    'any.required': 'Le numéro de téléphone est obligatoire.',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Le mot de passe est obligatoire.',
    'any.required': 'Le mot de passe est obligatoire.',
  }),
  userType: Joi.string().valid(ROLES.PASSENGER, ROLES.DRIVER).required().messages({
    'any.only': 'Le type de compte doit être PASSENGER ou DRIVER.',
    'any.required': 'Le type d’utilisateur est obligatoire.',
  }),
}).unknown(false);

const adminLoginSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.empty': 'L’adresse e-mail est obligatoire.',
    'string.email': 'Veuillez renseigner une adresse e-mail valide.',
    'any.required': 'L’adresse e-mail est obligatoire.',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Le mot de passe est obligatoire.',
    'any.required': 'Le mot de passe est obligatoire.',
  }),
}).unknown(false);

module.exports = {
  passengerRegisterSchema,
  driverRegisterSchema,
  phoneLoginSchema,
  adminLoginSchema,
};
