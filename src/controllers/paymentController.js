/**
 * Contrôleur de paiement pour l'API INSTAR.
 * Réceptionne les ordres de paiement automatique et diffuse les reçus de course.
 */

const PaymentService = require('../services/paymentService');
const ApiResponse = require('../utils/apiResponse');

class PaymentController {
  /**
   * Traitement et validation automatique du règlement d'une course.
   */
  static async processPayment(req, res, next) {
    try {
      const result = await PaymentService.processAutomaticPayment(req.body, req.user._id);

      return ApiResponse.success(
        res,
        'Paiement validé avec succès par la plateforme INSTAR.',
        result
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Consultation du reçu numérique officiel d'une course.
   */
  static async getReceipt(req, res, next) {
    try {
      const { rideId } = req.params;
      const receipt = await PaymentService.generateReceipt(rideId);

      return ApiResponse.success(
        res,
        'Reçu numérique généré avec succès.',
        receipt
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PaymentController;
