/**
 * Définition des routes d'authentification de l'API INSTAR.
 * Intègre la limitation de débit (anti-brute force), la validation Joi et la vérification de jeton.
 */

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const validate = require('../middlewares/validate');
const { verifyToken } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');
const {
  passengerRegisterSchema,
  driverRegisterSchema,
  phoneLoginSchema,
  adminLoginSchema,
} = require('../validations/authValidation');

// Inscription d'un passager
router.post(
  '/register/passenger',
  authLimiter,
  validate(passengerRegisterSchema),
  AuthController.registerPassenger
);

// Inscription d'un chauffeur
router.post(
  '/register/driver',
  authLimiter,
  validate(driverRegisterSchema),
  AuthController.registerDriver
);

// Connexion mobile (passager ou chauffeur)
router.post(
  '/login',
  authLimiter,
  validate(phoneLoginSchema),
  AuthController.loginMobile
);

// Connexion administrative
router.post(
  '/admin/login',
  authLimiter,
  validate(adminLoginSchema),
  AuthController.loginAdmin
);

// Consultation du profil courant authentifié
router.get(
  '/me',
  verifyToken,
  AuthController.getCurrentProfile
);

module.exports = router;
