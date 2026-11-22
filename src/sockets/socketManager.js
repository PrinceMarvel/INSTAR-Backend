/**
 * Gestionnaire centralisé des WebSockets (Socket.io) pour INSTAR.
 * Intègre l'authentification cryptographique sur le handshake et la gestion des salons (rooms).
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { ROLES } = require('../config/constants');
const registerDriverLocationHandler = require('./driverLocationHandler');
const registerRideEventsHandler = require('./rideEventsHandler');

let io = null;

/**
 * Initialise Socket.io sur le serveur HTTP existant.
 * @param {import('http').Server} httpServer - Serveur HTTP Node.js.
 */
const initSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Middleware d'authentification sur le handshake WebSocket
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentification WebSocket échouée : jeton manquant.'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.user = decoded; // { id, role }
      next();
    } catch (err) {
      return next(new Error('Authentification WebSocket échouée : jeton invalide ou expiré.'));
    }
  });

  io.on('connection', (socket) => {
    const { id: userId, role } = socket.user;
    console.log(`🔌 [WebSocket] Connexion établie : Utilisateur #${userId} (Rôle: ${role})`);

    // Rejoindre un salon privé exclusif à l'utilisateur
    socket.join(`user:${userId}`);

    // Si l'utilisateur est un chauffeur, il rejoint le salon général des chauffeurs
    if (role === ROLES.DRIVER) {
      socket.join('drivers:all');
    }

    // Enregistrement des gestionnaires d'événements spécialisés
    registerDriverLocationHandler(io, socket);
    registerRideEventsHandler(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`🔌 [WebSocket] Déconnexion : Utilisateur #${userId} (Raison: ${reason})`);
    });
  });

  return io;
};

/**
 * Retourne l'instance active de Socket.io.
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io n’a pas encore été initialisé.');
  }
  return io;
};

module.exports = {
  initSocketServer,
  getIO,
};
