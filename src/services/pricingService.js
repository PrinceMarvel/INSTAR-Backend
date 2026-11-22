/**
 * Service de tarification par paliers adapté aux réalités de terrain de Gagnoa.
 * Ville de l'intérieur : circulation fluide, trajets courts fréquents et zones périphériques éloignées.
 */

const { VEHICLE_TYPES, PRICING_TIERS, GAGNOA_AVG_SPEED_KMH } = require('../config/constants');

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
    const earthRadiusKm = 6371;

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
   * Estime la durée moyenne du trajet à Gagnoa (circulation fluide, 35 km/h de moyenne).
   * @param {number} distanceKm - Distance du trajet en kilomètres.
   * @returns {number} Durée estimée en minutes (minimum 2 min).
   */
  static estimateDurationMinutes(distanceKm) {
    const drivingTimeHours = distanceKm / GAGNOA_AVG_SPEED_KMH;
    const drivingTimeMinutes = drivingTimeHours * 60;
    const bufferMinutes = 1; // Léger tampon d'embarquement

    return Math.max(2, Math.ceil(drivingTimeMinutes + bufferMinutes));
  }

  /**
   * Calcule le tarif par paliers de distance adapté à Gagnoa.
   *
   * Logique :
   *   - Si la distance tombe dans une tranche définie → tarif fixe de cette tranche.
   *   - Si la distance dépasse toutes les tranches → tarif de la dernière tranche
   *     + supplément par km additionnel.
   *   - Arrondi final à 50 FCFA près (facilité du rendu de monnaie local).
   *
   * @param {string} vehicleType - MOTO_TAXI ou COMMUNAL_TAXI.
   * @param {number} distanceKm - Distance calculée du trajet en km.
   * @returns {number} Montant en Francs CFA (XOF).
   */
  static calculateFare(vehicleType, distanceKm) {
    const pricing = PRICING_TIERS[vehicleType] || PRICING_TIERS[VEHICLE_TYPES.MOTO_TAXI];

    // Parcours des paliers : on retourne le tarif fixe dès qu'on tombe dans une tranche
    for (const tier of pricing.tiers) {
      if (distanceKm <= tier.maxKm) {
        return tier.fixedFare;
      }
    }

    // Distance au-delà de toutes les tranches : tarif de la dernière tranche + supplément par km
    const lastTierMaxKm = pricing.tiers[pricing.tiers.length - 1].maxKm;
    const extraKm = distanceKm - lastTierMaxKm;
    const rawFare = pricing.lastTierBase + extraKm * pricing.extensionRatePerKm;

    // Arrondi pratique à 50 FCFA près pour le rendu de monnaie en environnement urbain
    return Math.ceil(rawFare / 50) * 50;
  }

  /**
   * Génère l'estimation comparative complète (Moto-taxi vs Taxi communal).
   * @param {number[]} originCoords - [longitude, latitude] de départ.
   * @param {number[]} destinationCoords - [longitude, latitude] d'arrivée.
   * @returns {object} Estimation avec distance, durée et comparatif des tarifs.
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
