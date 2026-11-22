/**
 * Schémas de validation des requêtes de paiement automatique (Joi).
 * Sécurise les transactions financières, les opérateurs Mobile Money et les montants.
 */

const Joi = require('joi');
const { PAYMENT_METHODS } = require('../config/constants');

const MOBILE_OPERATORS = ['WAVE', 'ORANGE_MONEY', 'MTN_MOMO'];

// Validation du déclenchement de paiement automatique
const autoPaymentSchema = Joi.object({
  rideId: Joi.string().hex().length(24).required().messages({
    'string.length': 'Format d’identifiant de course invalide.',
    'any.required': 'L’identifiant de la course est obligatoire.',
  }),
  paymentMethod: Joi.string()
    .valid(PAYMENT_METHODS.CASH, PAYMENT_METHODS.MOBILE_MONEY)
    .required()
    .messages({
      'any.only': 'Le mode de paiement doit être CASH ou MOBILE_MONEY.',
      'any.required': 'Le mode de paiement est obligatoire.',
    }),
  operator: Joi.string()
    .valid(...MOBILE_OPERATORS)
    .when('paymentMethod', {
      is: PAYMENT_METHODS.MOBILE_MONEY,
      then: Joi.required(),
      otherwise: Joi.optional().allow(null, ''),
    })
    .messages({
      'any.only': 'Opérateur non reconnu. Valeurs admises : WAVE, ORANGE_MONEY ou MTN_MOMO.',
      'any.required': 'L’opérateur Mobile Money est obligatoire pour les règlements numériques.',
    }),
  customerPhone: Joi.string()
    .pattern(/^(\+225)?[0-9]{10}$/)
    .when('paymentMethod', {
      is: PAYMENT_METHODS.MOBILE_MONEY,
      then: Joi.required(),
      otherwise: Joi.optional().allow(null, ''),
    })
    .messages({
      'string.pattern.base': 'Numéro de téléphone de débit invalide (10 chiffres attendus).',
      'any.required': 'Le numéro de téléphone associé au compte Mobile Money est obligatoire.',
    }),
}).unknown(false);

module.exports = {
  autoPaymentSchema,
  MOBILE_OPERATORS,
};
