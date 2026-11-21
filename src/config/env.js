/**
 * Configuration et validation stricte des variables d'environnement.
 * Module clé pour la sécurité : fail-fast si un secret ou une variable critique est absente.
 */

const dotenv = require('dotenv');
const path = require('path');

// Chargement du fichier .env s'il existe
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// Liste des variables obligatoires en production
const requiredInProduction = [
  'MONGO_URI',
  'JWT_SECRET',
  'CLIENT_URL',
];

if (isProduction) {
  const missingVariables = requiredInProduction.filter((variableName) => !process.env[variableName]);
  if (missingVariables.length > 0) {
    throw new Error(
      `[ERREUR CRITIQUE] Variables d'environnement manquantes en production : ${missingVariables.join(', ')}`
    );
  }
}

const env = Object.freeze({
  NODE_ENV,
  IS_PRODUCTION: isProduction,
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/instar_db',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_key_change_in_production_instar_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
});

module.exports = env;
