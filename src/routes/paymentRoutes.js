/**
 * Définition des routes de paiement automatique pour l'API INSTAR.
 * Intègre la protection JWT et la validation Joi stricte.
 */

const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const validate = require('../middlewares/validate');
const { verifyToken } = require('../middlewares/auth');
const { autoPaymentSchema } = require('../validations/paymentValidation');

// Toutes les requêtes financières exigent d'être authentifié
router.use(verifyToken);

// Déclenchement de la validation automatique du paiement
router.post(
  '/process',
  validate(autoPaymentSchema),
  PaymentController.processPayment
);

// Consultation du reçu numérique d'une course
router.get(
  '/receipt/:rideId',
  PaymentController.getReceipt
);

module.exports = router;
