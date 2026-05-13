const db = require('../config/database');

// Ventas agrupadas por hora del día (heatmap)
const getSalesByHour = async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 7;
    const result = await db.query(
      `SELECT
         EXTRACT(HOUR FROM created_at)::int AS hour,
         COUNT(*)::int                      AS sales_count,
         COALESCE(SUM(total), 0)            AS total_revenue
       FROM sales
       WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL
       GROUP BY hour
       ORDER BY hour`,
      [days]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[ReportsCtrl] salesByHour:', err.message);
    res.status(500).json({ success: false, error: 'Error en reporte' });
  }
};

// Ranking de productos más vendidos
const getTopProducts = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 20);
    const days  = parseInt(req.query.days, 10) || 30;
    const result = await db.query(
      `SELECT
         sd.product_name,
         SUM(sd.quantity)::int AS total_qty,
         SUM(sd.subtotal)      AS total_revenue,
         COUNT(DISTINCT sd.sale_id)::int AS appearances
       FROM sale_details sd
       JOIN sales s ON s.id = sd.sale_id
       WHERE s.created_at >= NOW() - ($1 || ' days')::INTERVAL
       GROUP BY sd.product_name
       ORDER BY total_qty DESC
       LIMIT $2`,
      [days, limit]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[ReportsCtrl] topProducts:', err.message);
    res.status(500).json({ success: false, error: 'Error en reporte' });
  }
};

// Historial de precio de un producto (para gráfico)
const getPriceChart = async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const limit     = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    if (isNaN(productId)) return res.status(400).json({ success: false, error: 'ID inválido' });

    const result = await db.query(
      `SELECT new_price, change_reason, change_percent, created_at
       FROM price_history
       WHERE product_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [productId, limit]
    );
    res.json({ success: true, data: result.rows.reverse() });
  } catch (err) {
    console.error('[ReportsCtrl] priceChart:', err.message);
    res.status(500).json({ success: false, error: 'Error en reporte' });
  }
};

// Resumen diario: ingresos por día (últimos N días)
const getDailyRevenue = async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 14, 90);
    const result = await db.query(
      `SELECT
         DATE(created_at)        AS day,
         COUNT(*)::int           AS sales_count,
         SUM(subtotal)           AS subtotal,
         SUM(tax_amount)         AS tax_amount,
         SUM(total)              AS total_revenue
       FROM sales
       WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL
       GROUP BY day
       ORDER BY day`,
      [days]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[ReportsCtrl] dailyRevenue:', err.message);
    res.status(500).json({ success: false, error: 'Error en reporte' });
  }
};

module.exports = { getSalesByHour, getTopProducts, getPriceChart, getDailyRevenue };
