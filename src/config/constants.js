/**
 * Constantes métier et énumérations du système INSTAR.
 * Utilisées pour garantir l'intégrité des données à travers toute l'application.
 */

// Rôles utilisateurs du système
const ROLES = Object.freeze({
  PASSENGER: 'PASSENGER',
  DRIVER: 'DRIVER',
  SUPER_ADMIN: 'SUPER_ADMIN',
  SUPPORT: 'SUPPORT',
});

// Types de véhicules autorisés sur le réseau de Gagnoa
const VEHICLE_TYPES = Object.freeze({
  MOTO_TAXI: 'MOTO_TAXI',
  COMMUNAL_TAXI: 'COMMUNAL_TAXI',
});

// Cycle de vie d'une course
const RIDE_STATUSES = Object.freeze({
  REQUESTED: 'REQUESTED',       // En attente d'un chauffeur
  ACCEPTED: 'ACCEPTED',         // Chauffeur assigné en route vers le client
  ARRIVED: 'ARRIVED',           // Chauffeur arrivé au point de rendez-vous
  IN_PROGRESS: 'IN_PROGRESS',   // Course en cours de trajet
  COMPLETED: 'COMPLETED',       // Course terminée et validée
  CANCELLED: 'CANCELLED',       // Course annulée
});

// Modes de règlement autorisés
const PAYMENT_METHODS = Object.freeze({
  CASH: 'CASH',
  MOBILE_MONEY: 'MOBILE_MONEY',
});

// Statuts des transactions financières
const PAYMENT_STATUSES = Object.freeze({
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
});

// Statuts de disponibilité du chauffeur
const DRIVER_STATUSES = Object.freeze({
  OFFLINE: 'OFFLINE',
  AVAILABLE: 'AVAILABLE',
  BUSY: 'BUSY',
});

// Repères géographiques phares de la ville de Gagnoa (coordonnées WGS84 [longitude, latitude])
const GAGNOA_LANDMARKS = Object.freeze([
  {
    id: 'garahio',
    name: 'Garahio',
    description: 'Carrefour principal et quartier historique de Garahio',
    coordinates: [-5.9525, 6.1319],
  },
  {
    id: 'dokui',
    name: 'Dokui',
    description: 'Zone résidentielle et commerciale de Dokui',
    coordinates: [-5.9412, 6.1385],
  },
  {
    id: 'grand_marche',
    name: 'Grand Marché',
    description: 'Cœur économique et commercial de Gagnoa',
    coordinates: [-5.9501, 6.1302],
  },
  {
    id: 'dioulabougou',
    name: 'Dioulabougou',
    description: 'Quartier central très animé et accessible',
    coordinates: [-5.9482, 6.1264],
  },
  {
    id: 'babre',
    name: 'Babré',
    description: 'Zone urbaine et carrefour stratégique',
    coordinates: [-5.9578, 6.1245],
  },
  {
    id: 'soleil',
    name: 'Quartier Soleil',
    description: 'Secteur dynamique résidentiel et étudiant',
    coordinates: [-5.9621, 6.1354],
  },
]);

/**
 * Grille tarifaire par paliers de distance adaptée aux réalités de terrain de Gagnoa.
 * Ville de l'intérieur du pays : circulation fluide, trajets courts fréquents,
 * mais aussi des zones périphériques éloignées.
 *
 * | Tranche        | Distance        | Réalité terrain                           |
 * |----------------|-----------------|-------------------------------------------|
 * | Courte         | 0 – 1,5 km      | Même quartier (ex: dans Garahio)          |
 * | Moyenne        | 1,5 – 3 km      | Quartiers voisins (ex: Garahio → Dokui)   |
 * | Longue         | 3 – 6 km        | Traversée de la ville (ex: Dokui → Babré) |
 * | Très éloignée  | 6+ km           | Périphérie éloignée                       |
 */
const PRICING_TIERS = Object.freeze({
  MOTO_TAXI: {
    tiers: [
      { maxKm: 1.5, fixedFare: 200 },   // Trajet court : tarif fixe de quartier
      { maxKm: 3,   fixedFare: 300 },   // Trajet moyen : inter-quartier
      { maxKm: 6,   fixedFare: 500 },   // Trajet long : traversée de la ville
    ],
    extensionRatePerKm: 100,              // Supplément par km au-delà de 6 km
    lastTierBase: 500,                    // Base à partir de laquelle le supplément s'applique
  },
  COMMUNAL_TAXI: {
    tiers: [
      { maxKm: 1.5, fixedFare: 300 },   // Trajet court : tarif fixe de quartier
      { maxKm: 3,   fixedFare: 500 },   // Trajet moyen : inter-quartier
      { maxKm: 6,   fixedFare: 750 },   // Trajet long : traversée de la ville
    ],
    extensionRatePerKm: 150,              // Supplément par km au-delà de 6 km
    lastTierBase: 750,                    // Base à partir de laquelle le supplément s'applique
  },
});

// Vitesse moyenne de circulation à Gagnoa (ville fluide de l'intérieur du pays)
const GAGNOA_AVG_SPEED_KMH = 35;

module.exports = {
  ROLES,
  VEHICLE_TYPES,
  RIDE_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  DRIVER_STATUSES,
  GAGNOA_LANDMARKS,
  PRICING_TIERS,
  GAGNOA_AVG_SPEED_KMH,
};
