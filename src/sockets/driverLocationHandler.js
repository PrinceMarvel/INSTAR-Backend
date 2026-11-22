/**
 * Gestionnaire WebSocket pour la diffusion de position GPS des chauffeurs en temps réel.
 * Transmet en continu le mouvement du conducteur vers le passager qui attend sa course.
 */

const DriverService = require('../services/driverService');
const { ROLES } = require('../config/constants');

/**
 * Enregistre les écouteurs de géolocalisation pour un socket client.
 * @param {import('socket.io').Server} io - Instance Socket.io.
 * @param {import('socket.io').Socket} socket - Socket connecté.
 */
const registerDriverLocationHandler = (io, socket) => {
  const { id: userId, role } = socket.user;

  // Seuls les chauffeurs ont le droit d'émettre des mises à jour de position
  if (role !== ROLES.DRIVER) {
    return;
  }

  socket.on('driver:update_location', async (payload) => {
    try {
      const { longitude, latitude, activeRideId, passengerId } = payload;

      if (typeof longitude !== 'number' || typeof latitude !== 'number') {
        return socket.emit('error', { message: 'Coordonnées GPS invalides.' });
      }

      // Mise à jour en base de données de manière asynchrone
      await DriverService.updateLocation(userId, longitude, latitude);

      // Si le chauffeur effectue une course, on diffuse sa position directement au passager
      if (passengerId) {
        io.to(`user:${passengerId}`).emit('ride:driver_moved', {
          driverId: userId,
          rideId: activeRideId,
          coordinates: [longitude, latitude],
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      socket.emit('error', { message: 'Échec de transmission de la position GPS.' });
    }
  });
};

module.exports = registerDriverLocationHandler;
