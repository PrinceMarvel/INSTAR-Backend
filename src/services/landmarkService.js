/**
 * Service de gestion des repères géographiques et de localisation de Gagnoa.
 * Gère l'amorçage automatique des points phares et leur distribution aux clients.
 */

const Landmark = require('../models/Landmark');
const { GAGNOA_LANDMARKS } = require('../config/constants');

class LandmarkService {
  /**
   * Initialise les repères officiels de Gagnoa en base s'ils n'existent pas encore (Seeding idempotent).
   */
  static async seedLandmarksIfEmpty() {
    const count = await Landmark.countDocuments();
    if (count === 0) {
      console.log('📍 [Repères Gagnoa] Initialisation des points phares par défaut...');
      const seedData = GAGNOA_LANDMARKS.map((item) => ({
        landmarkId: item.id,
        name: item.name,
        description: item.description,
        location: {
          type: 'Point',
          coordinates: item.coordinates,
        },
        isActive: true,
      }));

      await Landmark.insertMany(seedData);
      console.log(`✅ [Repères Gagnoa] ${seedData.length} repères configurés avec succès.`);
    }
  }

  /**
   * Récupère la liste de tous les repères actifs de la ville de Gagnoa.
   */
  static async getAllActiveLandmarks() {
    await this.seedLandmarksIfEmpty();

    const landmarks = await Landmark.find({ isActive: true })
      .select('landmarkId name description location')
      .sort({ name: 1 });

    return landmarks;
  }

  /**
   * Trouve un repère par son identifiant unique (ex: 'garahio', 'dokui').
   */
  static async getLandmarkById(landmarkId) {
    return Landmark.findOne({ landmarkId, isActive: true });
  }
}

module.exports = LandmarkService;
