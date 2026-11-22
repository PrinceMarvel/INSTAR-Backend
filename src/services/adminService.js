/**
 * Service métier pour l'espace d'administration et la supervision globale.
 * Agrège les indicateurs clés de performance (KPIs) et gère la modération des comptes.
 */

const Driver = require('../models/Driver');
const User = require('../models/User');
const Ride = require('../models/Ride');
const PlatformRevenue = require('../models/PlatformRevenue');
const PlatformConfig = require('../models/PlatformConfig');
const ApiError = require('../utils/apiError');
const { RIDE_STATUSES, DRIVER_STATUSES } = require('../config/constants');

class AdminService {
  /**
   * Consolide les métriques financières et opérationnelles de la plateforme en temps réel.
   */
  static async getDashboardMetrics() {
    const [
      totalDrivers,
      pendingDrivers,
      availableDrivers,
      totalPassengers,
      totalRides,
      completedRides,
      revenueStats,
      activeConfig,
    ] = await Promise.all([
      Driver.countDocuments(),
      Driver.countDocuments({ isApproved: false }),
      Driver.countDocuments({ isApproved: true, status: DRIVER_STATUSES.AVAILABLE }),
      User.countDocuments(),
      Ride.countDocuments(),
      Ride.countDocuments({ status: RIDE_STATUSES.COMPLETED }),
      PlatformRevenue.aggregate([
        {
          $group: {
            _id: null,
            totalGrossVolume: { $sum: '$totalFare' },
            totalCommissions: { $sum: '$commissionAmount' },
            totalDriverPayouts: { $sum: '$driverAmount' },
          },
        },
      ]),
      PlatformConfig.getActiveConfig(),
    ]);

    const financialTotals = revenueStats[0] || {
      totalGrossVolume: 0,
      totalCommissions: 0,
      totalDriverPayouts: 0,
    };

    return {
      kpis: {
        totalDrivers,
        pendingDrivers,
        availableDrivers,
        totalPassengers,
        totalRides,
        completedRides,
      },
      financials: {
        totalGrossVolume: financialTotals.totalGrossVolume,
        totalCommissions: financialTotals.totalCommissions,
        totalDriverPayouts: financialTotals.totalDriverPayouts,
        currentCommissionRate: activeConfig.commissionPercentage,
        currency: activeConfig.currency,
      },
    };
  }

  /**
   * Liste les chauffeurs en attente de vérification administrative.
   */
  static async getPendingDrivers() {
    return Driver.find({ isApproved: false })
      .select('fullName phoneNumber vehicleType licensePlate createdAt')
      .sort({ createdAt: -1 });
  }

  /**
   * Valide ou refuse l'accès d'un chauffeur au réseau INSTAR.
   */
  static async setDriverApproval(driverId, isApproved) {
    const driver = await Driver.findById(driverId);
    if (!driver) {
      throw ApiError.notFound('Chauffeur introuvable.');
    }

    driver.isApproved = Boolean(isApproved);
    // Si approuvé, on place son statut initial sur OFFLINE pour qu'il choisisse quand passer en ligne
    if (driver.isApproved && driver.status === DRIVER_STATUSES.BUSY) {
      driver.status = DRIVER_STATUSES.OFFLINE;
    }
    await driver.save();

    return {
      driverId: driver._id,
      fullName: driver.fullName,
      isApproved: driver.isApproved,
      status: driver.status,
    };
  }

  /**
   * Liste l'ensemble des chauffeurs avec options de filtrage par type ou statut.
   */
  static async getAllDrivers(filter = {}) {
    return Driver.find(filter)
      .select('fullName phoneNumber vehicleType licensePlate isApproved status averageRating totalRides dailyEarnings totalEarnings')
      .sort({ createdAt: -1 });
  }

  /**
   * Suspend ou réactive un compte passager (ex: après litige ou abus).
   */
  static async toggleUserStatus(userId, isActive) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('Passager introuvable.');
    }

    user.isActive = Boolean(isActive);
    if (user.isActive) {
      user.isSuspended = false;
      user.suspensionUntil = null;
    }
    await user.save();

    return {
      userId: user._id,
      fullName: user.fullName,
      isActive: user.isActive,
    };
  }
}

module.exports = AdminService;
