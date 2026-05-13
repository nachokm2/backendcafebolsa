const db = require('../config/database');

/** POST /api/alerts — upsert a price alert for the authenticated customer. */
const upsertAlert = async (req, res) => {
  const customerId = req.user.id;
  const { productId, targetPrice, fcmToken } = req.body;

  if (!productId || targetPrice == null) {
    return res.status(400).json({ success: false, message: 'productId y targetPrice son requeridos' });
  }

  try {
    const result = await db.query(
      `INSERT INTO price_alerts (customer_id, product_id, target_price, fcm_token)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (customer_id, product_id)
       DO UPDATE SET target_price = EXCLUDED.target_price,
                     fcm_token    = COALESCE(EXCLUDED.fcm_token, price_alerts.fcm_token),
                     active       = true,
                     triggered_at = NULL
       RETURNING *`,
      [customerId, productId, targetPrice, fcmToken || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[AlertController] upsertAlert error:', err.message);
    res.status(500).json({ success: false, message: 'Error al guardar alerta' });
  }
};

/** DELETE /api/alerts/:productId — remove the alert for a product. */
const deleteAlert = async (req, res) => {
  const customerId = req.user.id;
  const productId  = parseInt(req.params.productId);

  try {
    await db.query(
      `DELETE FROM price_alerts WHERE customer_id = $1 AND product_id = $2`,
      [customerId, productId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[AlertController] deleteAlert error:', err.message);
    res.status(500).json({ success: false, message: 'Error al eliminar alerta' });
  }
};

/** GET /api/alerts — list all active alerts for the authenticated customer. */
const getAlerts = async (req, res) => {
  const customerId = req.user.id;
  try {
    const result = await db.query(
      `SELECT * FROM price_alerts WHERE customer_id = $1 AND active = true ORDER BY created_at DESC`,
      [customerId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[AlertController] getAlerts error:', err.message);
    res.status(500).json({ success: false, message: 'Error al obtener alertas' });
  }
};

module.exports = { upsertAlert, deleteAlert, getAlerts };
