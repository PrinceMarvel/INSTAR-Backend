/**
 * Gestionnaire de connexion à la base de données MongoDB Atlas.
 * Intègre un pool de connexions optimisé, des écouteurs d'événements et l'arrêt gracieux.
 */

const mongoose = require('mongoose');
const env = require('./env');

const MONGO_OPTIONS = {
  maxPoolSize: 20, // Gestion optimale de la charge concurrente
  minPoolSize: 5,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

/**
 * Initialise la connexion à MongoDB Atlas.
 * @returns {Promise<typeof mongoose>} Instance connectée de Mongoose.
 */
const connectDatabase = async () => {
  try {
    mongoose.connection.on('connected', () => {
      console.log('✅ [Base de Données] Connexion à MongoDB Atlas établie avec succès.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ [Base de Données] Erreur de connexion MongoDB :', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ [Base de Données] Connexion MongoDB interrompue. Tentative de reconnexion...');
    });

    const connection = await mongoose.connect(env.MONGO_URI, MONGO_OPTIONS);
    return connection;
  } catch (error) {
    console.error('❌ [Base de Données] Échec initial de la connexion à MongoDB :', error.message);
    process.exit(1);
  }
};

/**
 * Ferme proprement la connexion à la base de données lors de l'arrêt du serveur.
 */
const disconnectDatabase = async () => {
  try {
    await mongoose.connection.close(false);
    console.log('🔌 [Base de Données] Connexion MongoDB fermée proprement.');
  } catch (error) {
    console.error('❌ [Base de Données] Erreur lors de la fermeture de la connexion :', error.message);
  }
};

module.exports = {
  connectDatabase,
  disconnectDatabase,
};
