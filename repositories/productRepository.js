const db = require('../config/database');

const findAll = async () => {
  const result = await db.query(
    `SELECT * FROM products
     WHERE active = true
     ORDER BY category, name`
  );
  return result.rows;
};

const findById = async (id) => {
  const result = await db.query(
    `SELECT * FROM products WHERE id = $1 AND active = true`,
    [id]
  );
  return result.rows[0] || null;
};

// Acepta un client de transacción o usa el pool directamente
const updatePrice = async (id, newPrice, client = null) => {
  const executor = client || db;
  const result = await executor.query(
    `UPDATE products
     SET current_price = $1
     WHERE id = $2
     RETURNING *`,
    [newPrice, id]
  );
  return result.rows[0];
};

const updateLastSaleAt = async (id, client = null) => {
  const executor = client || db;
  const result = await executor.query(
    `UPDATE products
     SET last_sale_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [id]
  );
  return result.rows[0];
};

// Devuelve productos activos cuyo precio es mayor al mínimo
// y que no han tenido ventas en el período indicado
const findEligibleForDecrease = async (thresholdMs) => {
  const cutoffTime = new Date(Date.now() - thresholdMs).toISOString();
  const result = await db.query(
    `SELECT * FROM products
     WHERE active = true
       AND current_price > min_price
       AND (last_sale_at IS NULL OR last_sale_at < $1)`,
    [cutoffTime]
  );
  return result.rows;
};

module.exports = { findAll, findById, updatePrice, updateLastSaleAt, findEligibleForDecrease };
