/**
 * Format standardisé des réponses HTTP positives de l'API INSTAR.
 * Assure une structure de données prévisible et uniforme pour tous les clients frontend.
 */

class ApiResponse {
  /**
   * Crée une instance de réponse réussie.
   * @param {number} statusCode - Code HTTP de statut (ex: 200, 201).
   * @param {string} message - Message explicite en français.
   * @param {object|array|null} data - Données utiles à transmettre au client.
   * @param {object|null} meta - Métadonnées facultatives (ex: pagination, filtres).
   */
  constructor(statusCode, message, data = null, meta = null) {
    this.success = statusCode >= 200 && statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;

    if (meta) {
      this.meta = meta;
    }
  }

  /**
   * Envoie la réponse au format JSON via l'objet Response d'Express.
   * @param {import('express').Response} res - Objet de réponse Express.
   */
  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
      ...(this.meta ? { meta: this.meta } : {}),
    });
  }

  /**
   * Fabrique statique pour une réponse de succès standard (200 OK).
   */
  static success(res, message, data = null, meta = null) {
    return new ApiResponse(200, message, data, meta).send(res);
  }

  /**
   * Fabrique statique pour une ressource créée (201 Created).
   */
  static created(res, message, data = null) {
    return new ApiResponse(201, message, data).send(res);
  }
}

module.exports = ApiResponse;
