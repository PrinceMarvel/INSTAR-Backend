/**
 * Définition des routes chauffeurs pour l'API INSTAR.
 * Intègre la protection par jeton JWT, le rôle chauffeur et la validation Joi.
 */

const express = require('express');
const router = express.Router();
const DriverController = require('../controllers/driverController');
const validate = require('../middlewares/validate');
const { verifyToken } = require('../middlewares/auth');
const { verifyDriver } = require('../middlewares/roleCheck');
const {
  locationUpdateSchema,
  statusUpdateSchema,
  nearbyDriversQuerySchema,
} = require('../validations/driverValidation');

// Recherche publique / passager de chauffeurs disponibles à proximité
router.get(
  '/nearby',
  validate(nearbyDriversQuerySchema, 'query'),
  DriverController.getNearbyDrivers
);

// Mise à jour de la position GPS en temps réel (réservé aux chauffeurs approuvés)
router.post(
  '/location',
  verifyToken,
  verifyDriver,
  validate(locationUpdateSchema),
  DriverController.updateLocation
);

// Modification du statut opérationnel (En ligne / Hors ligne / Occupé)
router.patch(
  '/status',
  verifyToken,
  verifyDriver,
  validate(statusUpdateSchema),
  DriverController.updateStatus
);

// Récupération des statistiques personnelles et gains journaliers
router.get(
  '/stats',
  verifyToken,
  verifyDriver,
  DriverController.getMyStats
);

module.exports = router;
