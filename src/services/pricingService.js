/**
 * Service de tarification et de calculs géodésiques pour INSTAR.
 * Calcule les distances réelles (Haversine) et applique les barèmes officiels de Gagnoa.
 */

const { VEHICLE_TYPES, DEFAULT_PRICING } = require('../config/constants');

class PricingService {
  /**
   * Calcule la distance orthodromique entre deux coordonnées GPS via la formule de Haversine.
   * @param {number[]} originCoords - [longitude, latitude] de départ.
   * @param {number[]} destinationCoords - [longitude, latitude] d'arrivée.
   * @returns {number} Distance en kilomètres arrondie à deux décimales.
   */
  static calculateDistanceKm(originCoords, destinationCoords) {
    const [lon1, lat1] = originCoords;
    const [lon2, lat2] = destinationCoords;

    const toRadians = (degrees) => (degrees * Math.PI) / 180;
    const earthRadiusKm = 6371; // Rayon moyen de la Terre en kilomètres

    const deltaLat = toRadians(lat2 - lat1);
    const deltaLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadiusKm * c;

    return Math.round(distance * 100) / 100;
  }

  /**
   * Estime la durée moyenne du trajet en minutes en milieu urbain à Gagnoa.
   * Hypothèse : vitesse moyenne de 25 km/h en ville avec temps de prise en charge.
   */
  static estimateDurationMinutes(distanceKm) {
    const averageSpeedKmH = 25;
    const drivingTimeHours = distanceKm / averageSpeedKmH;
    const drivingTimeMinutes = drivingTimeHours * 60;
    const bufferTimeMinutes = 2; // Temps d'arrêt et de circulation

    return Math.max(3, Math.ceil(drivingTimeMinutes + bufferTimeMinutes));
  }

  /**
   * Calcule le tarif estimé en FCFA pour un type de véhicule donné.
   * @param {string} vehicleType - MOTO_TAXI ou COMMUNAL_TAXI.
   * @param {number} distanceKm - Distance estimée du trajet en km.
   * @returns {number} Montant en Francs CFA (arrondi à la cinquantaine supérieure).
   */
  static calculateFare(vehicleType, distanceKm) {
    const pricingConfig =
      DEFAULT_PRICING[vehicleType] || DEFAULT_PRICING[VEHICLE_TYPES.MOTO_TAXI];

    const rawFare = pricingConfig.BASE_FARE + distanceKm * pricingConfig.PER_KM_RATE;
    const fare = Math.max(pricingConfig.MINIMUM_FARE, rawFare);

    // Arrondi pratique à 50 FCFA près pour faciliter le rendu de monnaie local
    return Math.ceil(fare / 50) * 50;
  }

  /**
   * Génère l'estimation comparative complète (Moto-taxi vs Taxi communal).
   */
  static getFullRideEstimate(originCoords, destinationCoords) {
    const distanceKm = this.calculateDistanceKm(originCoords, destinationCoords);
    const estimatedDurationMin = this.estimateDurationMinutes(distanceKm);

    const motoFare = this.calculateFare(VEHICLE_TYPES.MOTO_TAXI, distanceKm);
    const taxiFare = this.calculateFare(VEHICLE_TYPES.COMMUNAL_TAXI, distanceKm);

    return {
      distanceKm,
      estimatedDurationMin,
      estimates: [
        {
          vehicleType: VEHICLE_TYPES.MOTO_TAXI,
          label: 'Moto-taxi',
          fare: motoFare,
          currency: 'XOF',
        },
        {
          vehicleType: VEHICLE_TYPES.COMMUNAL_TAXI,
          label: 'Taxi communal',
          fare: taxiFare,
          currency: 'XOF',
        },
      ],
    };
  }
}

module.exports = PricingService;
