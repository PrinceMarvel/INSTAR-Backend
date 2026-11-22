/**
 * Définition des routes pour la gestion du cycle de vie des courses.
 * Applique la protection d'authentification, les rôles RBAC et le rate limiting anti-abus.
 */

const express = require('express');
const router = express.Router();
const RideController = require('../controllers/rideController');
const validate = require('../middlewares/validate');
const { verifyToken } = require('../middlewares/auth');
const { verifyPassenger, verifyDriver } = require('../middlewares/roleCheck');
const { rideOrderLimiter } = require('../middlewares/rateLimiter');
const {
  requestRideSchema,
  updateStatusSchema,
  cancelRideSchema,
} = require('../validations/rideValidation');

// Toutes les routes de courses exigent d'être authentifié
router.use(verifyToken);

// Récupération de la course active en cours (passager ou chauffeur)
router.get('/active', RideController.getActiveRide);

// Consultation du détail d'une course
router.get('/:id', RideController.getRideDetails);

// Réservation d'une course (réservé aux passagers avec limiteur de débit)
router.post(
  '/',
  verifyPassenger,
  rideOrderLimiter,
  validate(requestRideSchema),
  RideController.requestRide
);

// Acceptation d'une course (réservé aux chauffeurs approuvés)
router.post(
  '/:id/accept',
  verifyDriver,
  RideController.acceptRide
);

// Mise à jour de la progression d'une course (ARRIVED, IN_PROGRESS, COMPLETED)
router.patch(
  '/:id/status',
  verifyDriver,
  validate(updateStatusSchema),
  RideController.updateStatus
);

// Annulation d'une course avec justification (passager ou chauffeur)
router.post(
  '/:id/cancel',
  validate(cancelRideSchema),
  RideController.cancelRide
);

module.exports = router;
