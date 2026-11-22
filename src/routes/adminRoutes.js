/**
 * Définition des routes d'administration pour l'API INSTAR.
 * Sécurisé par le double verrou obligatoire : authentification JWT + rôle administrateur.
 */

const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { verifyToken } = require('../middlewares/auth');
const { verifyAdmin, verifySuperAdmin } = require('../middlewares/roleCheck');

// Verrouillage global de toutes les routes sous le rôle Administrateur
router.use(verifyToken, verifyAdmin);

// Tableau de bord exécutif et indicateurs de performance
router.get('/metrics', AdminController.getDashboardMetrics);

// Consultation des chauffeurs en attente de validation
router.get('/drivers/pending', AdminController.getPendingDrivers);

// Approbation ou rejet d'un dossier chauffeur
router.patch('/drivers/:driverId/approve', AdminController.approveDriver);

// Répertoire global de tous les chauffeurs enregistrés
router.get('/drivers', AdminController.getAllDrivers);

// Ajustement dynamique du pourcentage de commission (réservé au Super Admin)
router.patch('/commission', verifySuperAdmin, AdminController.updateCommissionRate);

// Suspension ou réactivation d'un utilisateur
router.patch('/users/:userId/status', AdminController.toggleUserStatus);

module.exports = router;
