const db = require('../config/database');

const openSession = async (req, res) => {
  const { userId, cashierName } = req.body;
  if (!userId) return res.status(400).json({ success: false, error: 'userId requerido' });

  try {
    const result = await db.query(
      `INSERT INTO cash_sessions (user_id, cashier_name) VALUES ($1, $2) RETURNING *`,
      [userId, cashierName || 'Cajero']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[SessionCtrl] openSession:', err.message);
    res.status(500).json({ success: false, error: 'Error al abrir sesión' });
  }
};

const closeSession = async (req, res) => {
  const sessionId = parseInt(req.params.id, 10);
  if (isNaN(sessionId)) return res.status(400).json({ success: false, error: 'ID inválido' });

  try {
    // Calcular totales de la sesión
    const totals = await db.query(
      `SELECT
         COUNT(*)::int         AS total_sales,
         COALESCE(SUM(subtotal),0)   AS total_subtotal,
         COALESCE(SUM(tax_amount),0) AS total_tax,
         COALESCE(SUM(total),0)      AS total_revenue
       FROM sales
       WHERE session_id = $1`,
      [sessionId]
    );

    const { total_sales, total_subtotal, total_tax, total_revenue } = totals.rows[0];

    const result = await db.query(
      `UPDATE cash_sessions
       SET closed_at      = NOW(),
           total_sales    = $1,
           total_subtotal = $2,
           total_tax      = $3,
           total_revenue  = $4
       WHERE id = $5 AND closed_at IS NULL
       RETURNING *`,
      [total_sales, total_subtotal, total_tax, total_revenue, sessionId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, error: 'Sesión no encontrada o ya cerrada' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[SessionCtrl] closeSession:', err.message);
    res.status(500).json({ success: false, error: 'Error al cerrar sesión' });
  }
};

const getSessionSummary = async (req, res) => {
  const sessionId = parseInt(req.params.id, 10);
  try {
    const session = await db.query(
      `SELECT cs.*, u.name AS user_name FROM cash_sessions cs
       LEFT JOIN users u ON u.id = cs.user_id
       WHERE cs.id = $1`,
      [sessionId]
    );
    if (!session.rows[0]) return res.status(404).json({ success: false, error: 'Sesión no encontrada' });

    const sales = await db.query(
      `SELECT s.id, s.total, s.subtotal, s.tax_amount, s.created_at,
              json_agg(json_build_object(
                'product_name', sd.product_name,
                'quantity', sd.quantity,
                'unit_price', sd.unit_price,
                'subtotal', sd.subtotal
              ) ORDER BY sd.id) AS details
       FROM sales s
       JOIN sale_details sd ON sd.sale_id = s.id
       WHERE s.session_id = $1
       GROUP BY s.id
       ORDER BY s.created_at`,
      [sessionId]
    );

    // Top productos de la sesión
    const topProducts = await db.query(
      `SELECT sd.product_name,
              SUM(sd.quantity)::int AS total_qty,
              SUM(sd.subtotal)      AS total_revenue
       FROM sale_details sd
       JOIN sales s ON s.id = sd.sale_id
       WHERE s.session_id = $1
       GROUP BY sd.product_name
       ORDER BY total_qty DESC
       LIMIT 5`,
      [sessionId]
    );

    res.json({
      success: true,
      data: {
        session: session.rows[0],
        sales: sales.rows,
        topProducts: topProducts.rows
      }
    });
  } catch (err) {
    console.error('[SessionCtrl] getSummary:', err.message);
    res.status(500).json({ success: false, error: 'Error al obtener resumen' });
  }
};

module.exports = { openSession, closeSession, getSessionSummary };
