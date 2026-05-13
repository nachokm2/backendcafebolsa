/**
 * Alert Service — monitorea bajadas de precio y notifica a clientes registrados.
 *
 * Flujo:
 *   1. App móvil registra alerta vía POST /api/alerts  { customerId, productId, targetPrice, fcmToken? }
 *   2. El motor de precios llama alertService.checkAlerts(productId, newPrice) después de cada bajada
 *   3. Este servicio busca alertas activas para ese producto, filtra las que se cumplieron
 *      y las despacha: WebSocket broadcast (inmediato) + FCM push (si hay token configurado)
 *
 * FCM: requiere Firebase Admin SDK.
 *   npm install firebase-admin
 *   Configura FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json en .env
 */

const db         = require('../config/database');
const wsService  = require('./websocketService');

let firebaseAdmin = null;

const initFCM = () => {
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!keyPath) return;
  try {
    const admin = require('firebase-admin');
    const serviceAccount = require(keyPath);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    firebaseAdmin = admin;
    console.log('[AlertService] Firebase Admin inicializado');
  } catch (err) {
    console.warn('[AlertService] Firebase Admin no disponible:', err.message);
  }
};

/**
 * Llamado por el motor de precios cada vez que baja el precio de un producto.
 * @param {number} productId
 * @param {number} newPrice
 * @param {string} productName
 * @param {string} productEmoji
 */
const checkAlerts = async (productId, newPrice, productName = '', productEmoji = '☕') => {
  try {
    const result = await db.query(
      `SELECT * FROM price_alerts
       WHERE product_id = $1 AND target_price >= $2 AND active = true`,
      [productId, newPrice]
    );

    if (!result.rows.length) return;

    for (const alert of result.rows) {
      // 1. WebSocket broadcast al cliente específico (si está conectado)
      wsService.broadcastToUser(alert.customer_id, 'price_alert', {
        productId,
        productName,
        productEmoji,
        targetPrice:  alert.target_price,
        currentPrice: newPrice,
      });

      // 2. FCM push si hay token y Admin está disponible
      if (firebaseAdmin && alert.fcm_token) {
        await _sendFCM(alert.fcm_token, {
          title: `${productEmoji} Alerta de precio`,
          body:  `${productName} llegó a $${Math.round(newPrice)} (objetivo: $${Math.round(alert.target_price)})`,
          productId: String(productId),
        }).catch(err => console.warn('[AlertService] FCM error:', err.message));
      }

      // 3. Desactivar alerta para no repetir
      await db.query(
        `UPDATE price_alerts SET active = false, triggered_at = NOW() WHERE id = $1`,
        [alert.id]
      );
    }
  } catch (err) {
    console.error('[AlertService] checkAlerts error:', err.message);
  }
};

const _sendFCM = (token, { title, body, productId }) =>
  firebaseAdmin.messaging().send({
    token,
    notification: { title, body },
    data:         { productId },
    android: { priority: 'high' },
    apns:    { payload: { aps: { sound: 'default' } } },
  });

module.exports = { initFCM, checkAlerts };
