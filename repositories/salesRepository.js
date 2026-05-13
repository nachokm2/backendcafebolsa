const db = require('../config/database');

const createSale = async ({ subtotal, taxAmount, total, userId, sessionId, cashierName, customerId }, client) => {
  const result = await client.query(
    `INSERT INTO sales (subtotal, tax_amount, total, user_id, session_id, cashier_name, customer_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [subtotal, taxAmount, total, userId || null, sessionId || null, cashierName || null, customerId || null]
  );
  return result.rows[0];
};

const createSaleDetail = async (
  { saleId, productId, productName, quantity, unitPrice, subtotal },
  client
) => {
  const result = await client.query(
    `INSERT INTO sale_details
       (sale_id, product_id, product_name, quantity, unit_price, subtotal)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [saleId, productId, productName, quantity, unitPrice, subtotal]
  );
  return result.rows[0];
};

const createPriceHistory = async (
  { productId, productName, oldPrice, newPrice, changePercent, changeReason },
  client = null
) => {
  const executor = client || db;
  const result = await executor.query(
    `INSERT INTO price_history
       (product_id, product_name, old_price, new_price, change_percent, change_reason)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [productId, productName, oldPrice, newPrice, changePercent, changeReason]
  );
  return result.rows[0];
};

const getRecentSales = async (limit = 10, offset = 0) => {
  const result = await db.query(
    `SELECT
       s.*,
       json_agg(
         json_build_object(
           'product_name', sd.product_name,
           'quantity',     sd.quantity,
           'unit_price',   sd.unit_price,
           'subtotal',     sd.subtotal
         ) ORDER BY sd.id
       ) AS details
     FROM sales s
     JOIN sale_details sd ON sd.sale_id = s.id
     GROUP BY s.id
     ORDER BY s.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
};

const getPriceHistory = async (productId = null, limit = 50) => {
  if (productId) {
    const result = await db.query(
      `SELECT * FROM price_history
       WHERE product_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [productId, limit]
    );
    return result.rows;
  }

  const result = await db.query(
    `SELECT * FROM price_history
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
};

module.exports = {
  createSale,
  createSaleDetail,
  createPriceHistory,
  getRecentSales,
  getPriceHistory
};
