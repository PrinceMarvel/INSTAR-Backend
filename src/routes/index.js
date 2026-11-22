/**
 * Routeur racine de l'API INSTAR (version v1).
 * Centralise l'ensemble des modules d'itinéraires et fournit un point de contrôle d'état (Healthcheck).
 */

const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const driverRoutes = require('./driverRoutes');
const landmarkRoutes = require('./landmarkRoutes');
const rideRoutes = require('./rideRoutes');
const paymentRoutes = require('./paymentRoutes');
const adminRoutes = require('./adminRoutes');

// Point de contrôle d'état pour les hébergeurs (Render, monitoring de production)
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'INSTAR API',
    city: 'Gagnoa',
    timestamp: new Date().toISOString(),
  });
});

// Enregistrement des modules de routes
router.use('/auth', authRoutes);
router.use('/drivers', driverRoutes);
router.use('/landmarks', landmarkRoutes);
router.use('/rides', rideRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
