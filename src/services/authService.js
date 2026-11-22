/**
 * Service métier d'authentification et de gestion des identités.
 * Traite les inscriptions, connexions, signatures JWT et vérifications de sécurité.
 */

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/apiError');
const { ROLES } = require('../config/constants');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Admin = require('../models/Admin');

class AuthService {
  /**
   * Génère un jeton JWT signé avec l'identifiant et le rôle de l'utilisateur.
   * @param {string} id - Identifiant MongoDB.
   * @param {string} role - Rôle de l'utilisateur.
   * @returns {string} Jeton JWT signé.
   */
  static generateToken(id, role) {
    return jwt.sign({ id, role }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });
  }

  /**
   * Enregistre un nouveau passager.
   */
  static async registerPassenger(payload) {
    const { fullName, phoneNumber, password } = payload;

    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      throw ApiError.conflict('Un compte passager existe déjà avec ce numéro de téléphone.');
    }

    const newUser = await User.create({
      fullName,
      phoneNumber,
      password,
      role: ROLES.PASSENGER,
    });

    const token = this.generateToken(newUser._id, ROLES.PASSENGER);

    return {
      user: newUser,
      token,
    };
  }

  /**
   * Enregistre un nouveau chauffeur (nécessite validation admin par la suite).
   */
  static async registerDriver(payload) {
    const { fullName, phoneNumber, password, vehicleType, licensePlate } = payload;

    const existingDriver = await Driver.findOne({ phoneNumber });
    if (existingDriver) {
      throw ApiError.conflict('Un compte chauffeur existe déjà avec ce numéro de téléphone.');
    }

    const newDriver = await Driver.create({
      fullName,
      phoneNumber,
      password,
      vehicleType,
      licensePlate,
      isApproved: false, // En attente de vérification administrative
      role: ROLES.DRIVER,
    });

    const token = this.generateToken(newDriver._id, ROLES.DRIVER);

    return {
      driver: newDriver,
      token,
      message: 'Compte chauffeur créé avec succès. Il sera activé après validation administrative.',
    };
  }

  /**
   * Connexion unifiée pour les utilisateurs mobiles (Passagers et Chauffeurs).
   */
  static async loginMobileUser(phoneNumber, candidatePassword, userType) {
    let account = null;

    if (userType === ROLES.DRIVER) {
      account = await Driver.findOne({ phoneNumber }).select('+password');
    } else {
      account = await User.findOne({ phoneNumber }).select('+password');
    }

    if (!account) {
      throw ApiError.unauthorized('Numéro de téléphone ou mot de passe incorrect.');
    }

    const isMatch = await account.comparePassword(candidatePassword);
    if (!isMatch) {
      throw ApiError.unauthorized('Numéro de téléphone ou mot de passe incorrect.');
    }

    if (account.isActive === false) {
      throw ApiError.forbidden('Ce compte a été suspendu ou désactivé.');
    }

    const token = this.generateToken(account._id, userType);

    // Retourner l'objet sans le mot de passe
    const accountData = account.toJSON();

    return {
      account: accountData,
      role: userType,
      token,
    };
  }

  /**
   * Connexion sécurisée pour les administrateurs via adresse e-mail.
   */
  static async loginAdmin(email, candidatePassword) {
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
      throw ApiError.unauthorized('Identifiants administrateur incorrects.');
    }

    const isMatch = await admin.comparePassword(candidatePassword);
    if (!isMatch) {
      throw ApiError.unauthorized('Identifiants administrateur incorrects.');
    }

    if (!admin.isActive) {
      throw ApiError.forbidden('Ce compte administrateur a été désactivé.');
    }

    // Mise à jour de l'horodatage de dernière connexion
    admin.lastLoginAt = new Date();
    await admin.save();

    const token = this.generateToken(admin._id, admin.role);

    return {
      admin: admin.toJSON(),
      role: admin.role,
      token,
    };
  }
}

module.exports = AuthService;
