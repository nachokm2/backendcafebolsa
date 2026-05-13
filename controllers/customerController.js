const jwt = require('jsonwebtoken');
const db  = require('../config/database');

const signCustomerToken = (customer) => jwt.sign(
  { id: customer.id, name: customer.name, role: 'customer' },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
);

/** POST /api/customers/register */
const register = async (req, res) => {
  const { name, pin } = req.body;

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ success: false, error: 'Nombre debe tener al menos 2 caracteres' });
  }
  if (!pin || !/^\d{4}$/.test(String(pin))) {
    return res.status(400).json({ success: false, error: 'PIN debe ser 4 dígitos' });
  }

  try {
    const existing = await db.query(
      `SELECT id FROM customers WHERE name = $1`,
      [name.trim()]
    );
    if (existing.rows[0]) {
      return res.status(409).json({ success: false, error: 'Nombre ya registrado' });
    }

    const result = await db.query(
      `INSERT INTO customers (name, pin) VALUES ($1, $2) RETURNING id, name, created_at`,
      [name.trim(), String(pin)]
    );
    const customer = result.rows[0];
    const token    = signCustomerToken(customer);

    res.status(201).json({ success: true, data: { customer, token } });
  } catch (err) {
    console.error('[CustomerCtrl] register:', err.message);
    res.status(500).json({ success: false, error: 'Error al registrar' });
  }
};

/** POST /api/customers/login */
const login = async (req, res) => {
  const { name, pin } = req.body;

  if (!name || !pin) {
    return res.status(400).json({ success: false, error: 'Nombre y PIN requeridos' });
  }

  try {
    const result = await db.query(
      `SELECT id, name FROM customers WHERE name = $1 AND pin = $2 AND active = true`,
      [name.trim(), String(pin)]
    );

    if (!result.rows[0]) {
      return res.status(401).json({ success: false, error: 'Nombre o PIN incorrecto' });
    }

    const customer = result.rows[0];
    const token    = signCustomerToken(customer);

    res.json({ success: true, data: { customer, token } });
  } catch (err) {
    console.error('[CustomerCtrl] login:', err.message);
    res.status(500).json({ success: false, error: 'Error al autenticar' });
  }
};

/** GET /api/customers/:id/orders */
const getOrders = async (req, res) => {
  const customerId = parseInt(req.params.id, 10);

  // Un cliente solo puede ver sus propios pedidos
  if (req.user.role === 'customer' && req.user.id !== customerId) {
    return res.status(403).json({ success: false, error: 'Sin permiso' });
  }

  try {
    const limit  = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const page   = Math.max(parseInt(req.query.page,  10) || 1,  1);
    const offset = (page - 1) * limit;

    const result = await db.query(
      `SELECT
         s.id, s.subtotal, s.tax_amount, s.total, s.created_at,
         json_agg(
           json_build_object(
             'product_id',   sd.product_id,
             'product_name', sd.product_name,
             'quantity',     sd.quantity,
             'unit_price',   sd.unit_price,
             'subtotal',     sd.subtotal
           ) ORDER BY sd.id
         ) AS items
       FROM sales s
       JOIN sale_details sd ON sd.sale_id = s.id
       WHERE s.customer_id = $1
       GROUP BY s.id
       ORDER BY s.created_at DESC
       LIMIT $2 OFFSET $3`,
      [customerId, limit, offset]
    );

    res.json({ success: true, data: result.rows, meta: { page, limit } });
  } catch (err) {
    console.error('[CustomerCtrl] getOrders:', err.message);
    res.status(500).json({ success: false, error: 'Error al obtener pedidos' });
  }
};

/** GET /api/customers/me/profile — perfil completo con stats de lealtad */
const getProfile = async (req, res) => {
  const customerId = req.user.id;
  try {
    const result = await db.query(
      `SELECT c.id, c.name, c.points, c.created_at,
              COUNT(s.id)::int        AS total_orders,
              COALESCE(SUM(s.total), 0) AS total_spent
       FROM customers c
       LEFT JOIN sales s ON s.customer_id = c.id
       WHERE c.id = $1
       GROUP BY c.id`,
      [customerId]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[CustomerCtrl] getProfile:', err.message);
    res.status(500).json({ success: false, error: 'Error al obtener perfil' });
  }
};

/** GET /api/customers/leaderboard — top 10 por puntos (público) */
const getLeaderboard = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, points
       FROM customers
       WHERE active = true AND points > 0
       ORDER BY points DESC
       LIMIT 10`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[CustomerCtrl] getLeaderboard:', err.message);
    res.status(500).json({ success: false, error: 'Error al obtener leaderboard' });
  }
};

module.exports = { register, login, getOrders, getProfile, getLeaderboard };
