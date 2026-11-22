/**
 * Point d'entrée principal du serveur backend INSTAR.
 * Assemble Express, Socket.io, la sécurité HTTP (Helmet, CORS) et l'arrêt gracieux.
 */

const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const env = require('./config/env');
const { connectDatabase, disconnectDatabase } = require('./config/db');
const { initSocketServer } = require('./sockets/socketManager');
const LandmarkService = require('./services/landmarkService');
const PlatformConfig = require('./models/PlatformConfig');
const apiRoutes = require('./routes/index');
const errorHandler = require('./middlewares/errorHandler');
const { globalLimiter } = require('./middlewares/rateLimiter');
const ApiError = require('./utils/apiError');

const app = express();
const server = http.createServer(app);

// Initialisation du serveur temps réel Socket.io
initSocketServer(server);

// Sécurisation des en-têtes HTTP avec Helmet
app.use(helmet());

// Configuration stricte des origines CORS autorisées
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Limiteur de débit global anti-DDoS
app.use(globalLimiter);

// Analyse du corps des requêtes en JSON avec limitation de taille préventive
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Montage des routes sous le préfixe officiel de l'API v1
app.use('/api/v1', apiRoutes);

// Capture des routes introuvables (404)
app.use((req, res, next) => {
  next(ApiError.notFound(`Route introuvable : ${req.method} ${req.originalUrl}`));
});

// Middleware centralisé de capture et traitement d'erreurs
app.use(errorHandler);

/**
 * Démarrage ordonné de l'application et de ses dépendances.
 */
const startServer = async () => {
  try {
    // 1. Connexion à la base de données MongoDB Atlas
    await connectDatabase();

    // 2. Amorçage préventif des repères géographiques et de la configuration initiale
    await LandmarkService.seedLandmarksIfEmpty();
    await PlatformConfig.getActiveConfig();

    // 3. Écoute sur le port réseau configuré
    server.listen(env.PORT, () => {
      console.log('====================================================');
      console.log(`🚀 [INSTAR API] Serveur opérationnel sur le port ${env.PORT}`);
      console.log(`🌍 [Environnement] Mode : ${env.NODE_ENV}`);
      console.log(`🏙️  [Mobilité Urbaine] Réseau Gagnoa Transport activé`);
      console.log('====================================================');
    });
  } catch (error) {
    console.error('❌ [Démarrage Échoué] Erreur critique :', error.message);
    process.exit(1);
  }
};

/**
 * Arrêt gracieux (Graceful Shutdown) en cas de signal de terminaison (Render, Docker, OS).
 */
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Signal ${signal} reçu. Fermeture ordonnée du serveur...`);
  server.close(async () => {
    console.log('🔌 [HTTP Server] Serveur HTTP arrêté.');
    await disconnectDatabase();
    process.exit(0);
  });

  // Forcer l'arrêt si les connexions mettent trop de temps à se libérer (10 secondes max)
  setTimeout(() => {
    console.error('⚠️ [Arrêt Forcé] Délai d’extinction dépassé.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();

module.exports = { app, server };
