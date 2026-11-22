/**
 * Gestionnaire WebSocket des événements de courses en temps réel.
 * Permet aux participants de rejoindre le canal de suivi spécifique d'une course.
 */

/**
 * Enregistre les écouteurs de cycle de vie des courses.
 * @param {import('socket.io').Server} io - Instance Socket.io.
 * @param {import('socket.io').Socket} socket - Socket connecté.
 */
const registerRideEventsHandler = (io, socket) => {
  const { id: userId } = socket.user;

  // Permet à un utilisateur (passager ou chauffeur) de rejoindre le canal dédié à sa course
  socket.on('ride:join_room', (data) => {
    const { rideId } = data || {};
    if (rideId) {
      socket.join(`ride:${rideId}`);
      console.log(`📡 [WebSocket] Utilisateur #${userId} a rejoint le canal de la course #${rideId}`);
    }
  });

  // Quitter le canal d'une course terminée ou annulée
  socket.on('ride:leave_room', (data) => {
    const { rideId } = data || {};
    if (rideId) {
      socket.leave(`ride:${rideId}`);
      console.log(`📡 [WebSocket] Utilisateur #${userId} a quitté le canal de la course #${rideId}`);
    }
  });
};

module.exports = registerRideEventsHandler;
