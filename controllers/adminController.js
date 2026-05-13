const db          = require('../config/database');
const priceEngine = require('../services/priceEngine');
const demoService = require('../services/demoService');
const productRepo = require('../repositories/productRepository');

// Actualizar configuración de un producto (stock, pausa, porcentajes)
const updateProduct = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID inválido' });

  const { stock, price_paused, inc_min, inc_max, dec_min, dec_max } = req.body;

  try {
    const fields = [];
    const values = [];
    let idx = 1;

    if (stock !== undefined)        { fields.push(`stock = $${idx++}`);        values.push(parseInt(stock, 10)); }
    if (price_paused !== undefined) { fields.push(`price_paused = $${idx++}`); values.push(Boolean(price_paused)); }
    if (inc_min !== undefined)      { fields.push(`inc_min = $${idx++}`);      values.push(parseFloat(inc_min) || null); }
    if (inc_max !== undefined)      { fields.push(`inc_max = $${idx++}`);      values.push(parseFloat(inc_max) || null); }
    if (dec_min !== undefined)      { fields.push(`dec_min = $${idx++}`);      values.push(parseFloat(dec_min) || null); }
    if (dec_max !== undefined)      { fields.push(`dec_max = $${idx++}`);      values.push(parseFloat(dec_max) || null); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'Sin campos para actualizar' });
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await db.query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[AdminCtrl] updateProduct:', err.message);
    res.status(500).json({ success: false, error: 'Error al actualizar producto' });
  }
};

// Pausar / reanudar motor de precios global
const togglePriceEngine = async (req, res) => {
  const { paused } = req.body;
  priceEngine.setPaused(Boolean(paused));
  res.json({ success: true, data: { paused: priceEngine.isPaused() } });
};

// Estado del motor de precios
const getEngineStatus = async (req, res) => {
  res.json({
    success: true,
    data: {
      paused: priceEngine.isPaused(),
      demoActive: demoService.isDemoActive()
    }
  });
};

// Resetear todos los precios al base manualmente
const resetPrices = async (req, res) => {
  try {
    const result = await priceEngine.resetAllPricesToBase();
    res.json({ success: true, data: { resetted: result.length } });
  } catch (err) {
    console.error('[AdminCtrl] resetPrices:', err.message);
    res.status(500).json({ success: false, error: 'Error al resetear precios' });
  }
};

// Control del modo demo
const controlDemo = async (req, res) => {
  const { action, intervalMs } = req.body;
  if (action === 'start') {
    const result = demoService.startDemo(intervalMs || 3000);
    return res.json({ success: true, data: result });
  }
  if (action === 'stop') {
    const result = demoService.stopDemo();
    return res.json({ success: true, data: result });
  }
  res.status(400).json({ success: false, error: 'action debe ser "start" o "stop"' });
};

// Reponer stock de un producto
const restockProduct = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { quantity } = req.body;
  if (isNaN(id) || !quantity || quantity < 1) {
    return res.status(400).json({ success: false, error: 'Datos inválidos' });
  }

  try {
    const result = await db.query(
      `UPDATE products SET stock = stock + $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, stock`,
      [parseInt(quantity, 10), id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[AdminCtrl] restockProduct:', err.message);
    res.status(500).json({ success: false, error: 'Error al reponer stock' });
  }
};

module.exports = { updateProduct, togglePriceEngine, getEngineStatus, resetPrices, controlDemo, restockProduct };
