/**
 * Définition des routes pour les repères de Gagnoa et l'estimation tarifaire.
 */

const express = require('express');
const router = express.Router();
const LandmarkController = require('../controllers/landmarkController');

// Liste de tous les repères locaux officiels (accès public / sans auth pour alimenter les formulaires)
router.get('/', LandmarkController.getAllLandmarks);

// Calcul immédiat d'estimation tarifaire (transparent)
router.post('/estimate', LandmarkController.estimateFare);

module.exports = router;
