/**
 * Service de notification en temps réel (Bridge Pattern).
 * Permet aux services métier d'émettre des événements WebSockets ciblés sans couplage direct avec les sockets.
 */

const { getIO } = require('../sockets/socketManager');

class NotificationService {
  /**
   * Envoie une alerte sonore et visuelle de nouvelle course disponible aux chauffeurs à proximité.
   * @param {object} ride - Document de la course créée.
   * @param {string[]} driverIds - Liste des identifiants des chauffeurs éligibles.
   */
  static notifyNearbyDrivers(ride, driverIds = []) {
    try {
      const io = getIO();
      const payload = {
        rideId: ride._id,
        vehicleType: ride.vehicleType,
        pickup: ride.pickup,
        destination: ride.destination,
        estimatedPrice: ride.estimatedPrice,
        estimatedDistanceKm: ride.estimatedDistanceKm,
        requestedAt: ride.requestedAt,
      };

      if (driverIds.length > 0) {
        // Envoi ciblé aux chauffeurs éligibles les plus proches
        driverIds.forEach((driverId) => {
          io.to(`user:${driverId}`).emit('ride:new_request', payload);
        });
      } else {
        // Diffusion globale dans le canal des chauffeurs
        io.to('drivers:all').emit('ride:new_request', payload);
      }
    } catch (error) {
      console.warn('⚠️ [NotificationService] Émission non disponible (Socket non encore prêt) :', error.message);
    }
  }

  /**
   * Notifie immédiatement le passager que sa course a été acceptée par un chauffeur.
   * @param {string} passengerId - Identifiant du client.
   * @param {object} ride - Document de la course acceptée avec informations chauffeur.
   */
  static notifyRideAccepted(passengerId, ride) {
    try {
      const io = getIO();
      io.to(`user:${passengerId}`).emit('ride:accepted', {
        rideId: ride._id,
        driver: ride.driver,
        status: ride.status,
        acceptedAt: ride.acceptedAt,
      });
    } catch (error) {
      console.warn('⚠️ [NotificationService] Erreur lors de la notification d’acceptation :', error.message);
    }
  }

  /**
   * Notifie le changement d'étape d'une course (ARRIVED, IN_PROGRESS, COMPLETED).
   * @param {string} passengerId - Identifiant du passager.
   * @param {object} ride - Données de la course.
   */
  static notifyRideStatusUpdated(passengerId, ride) {
    try {
      const io = getIO();
      const payload = {
        rideId: ride._id,
        status: ride.status,
        updatedAt: new Date().toISOString(),
      };

      // Notification au passager et sur le canal dédié de la course
      io.to(`user:${passengerId}`).emit('ride:status_updated', payload);
      io.to(`ride:${ride._id}`).emit('ride:status_updated', payload);
    } catch (error) {
      console.warn('⚠️ [NotificationService] Erreur notification statut course :', error.message);
    }
  }

  /**
   * Notifie l'annulation d'une course.
   */
  static notifyRideCancelled(targetUserId, ride, reason) {
    try {
      const io = getIO();
      io.to(`user:${targetUserId}`).emit('ride:cancelled', {
        rideId: ride._id,
        reason,
        cancelledAt: ride.cancelledAt,
      });
      io.to(`ride:${ride._id}`).emit('ride:cancelled', {
        rideId: ride._id,
        reason,
      });
    } catch (error) {
      console.warn('⚠️ [NotificationService] Erreur notification annulation :', error.message);
    }
  }
}

module.exports = NotificationService;
