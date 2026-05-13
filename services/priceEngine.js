const productRepo  = require('../repositories/productRepository');
const salesRepo    = require('../repositories/salesRepository');
const wsService    = require('./websocketService');
const alertService = require('./alertService');
const constants    = require('../config/constants');
const db           = require('../config/database');

let enginePaused = false;

const randomPercent = (min, max) => min + Math.random() * (max - min);

const isPaused = () => enginePaused;
const setPaused = (state) => {
  enginePaused = state;
  console.log(`[PriceEngine] ${state ? 'PAUSADO' : 'REANUDADO'}`);
};

/**
 * Aumenta el precio de un producto tras una compra.
 * Respeta la pausa global y la pausa por producto.
 * Usa porcentajes por producto si están definidos.
 */
const increasePrice = async (productId, client) => {
  const product = await productRepo.findById(productId);
  if (!product) throw new Error(`Producto ${productId} no encontrado`);

  // Respetar pausa global o por producto
  if (enginePaused || product.price_paused) return product;

  const incMin = parseFloat(product.inc_min) || constants.PRICE_INCREASE_MIN;
  const incMax = parseFloat(product.inc_max) || constants.PRICE_INCREASE_MAX;
  const pct    = randomPercent(incMin, incMax);

  const rawNew   = parseFloat(product.current_price) * (1 + pct / 100);
  const newPrice = Math.min(Math.round(rawNew), parseFloat(product.max_price));

  if (newPrice <= Math.round(parseFloat(product.current_price))) return product;

  const updated = await productRepo.updatePrice(productId, newPrice, client);

  await salesRepo.createPriceHistory({
    productId:     product.id,
    productName:   product.name,
    oldPrice:      parseFloat(product.current_price),
    newPrice,
    changePercent: pct.toFixed(4),
    changeReason:  'purchase_increase'
  }, client);

  return updated;
};

/**
 * Baja automáticamente precios de productos sin ventas recientes.
 */
const decreasePricesAutomatically = async () => {
  if (enginePaused) {
    console.log('[PriceEngine] Scheduler omitido — motor pausado');
    return [];
  }

  const candidates = await productRepo.findEligibleForDecrease(constants.NO_SALE_THRESHOLD_MS);
  if (candidates.length === 0) return [];

  const updated = [];

  for (const product of candidates) {
    if (product.price_paused) continue;

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const decMin   = parseFloat(product.dec_min) || constants.PRICE_DECREASE_MIN;
      const decMax   = parseFloat(product.dec_max) || constants.PRICE_DECREASE_MAX;
      const pct      = randomPercent(decMin, decMax);
      const rawNew   = parseFloat(product.current_price) * (1 - pct / 100);
      const newPrice = Math.max(Math.round(rawNew), parseFloat(product.min_price));

      if (newPrice >= Math.round(parseFloat(product.current_price))) {
        await client.query('ROLLBACK');
        continue;
      }

      const updatedProduct = await productRepo.updatePrice(product.id, newPrice, client);

      await salesRepo.createPriceHistory({
        productId:     product.id,
        productName:   product.name,
        oldPrice:      parseFloat(product.current_price),
        newPrice,
        changePercent: (-pct).toFixed(4),
        changeReason:  'auto_decrease'
      }, client);

      await client.query('COMMIT');
      updated.push(updatedProduct);

      // Check if any customer alert threshold was met by this price drop
      alertService.checkAlerts(
        product.id, newPrice, product.name, product.image_emoji || '☕'
      ).catch(err => console.warn('[PriceEngine] alertService error:', err.message));

    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`[PriceEngine] Decrease error for product ${product.id}:`, err.message);
    } finally {
      client.release();
    }
  }

  if (updated.length > 0) {
    wsService.broadcast('price_update', { products: updated, reason: 'auto_decrease' });
    console.log(`[PriceEngine] Auto-decreased ${updated.length} product(s)`);
  }

  return updated;
};

/**
 * Resetea todos los precios al precio base (ejecutar al inicio del día).
 */
const resetAllPricesToBase = async () => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const products = await db.query(
      `SELECT id, name, base_price, current_price FROM products WHERE active = true`
    );

    const resetted = [];
    for (const product of products.rows) {
      if (Math.round(parseFloat(product.current_price)) === Math.round(parseFloat(product.base_price))) continue;

      await client.query(
        `UPDATE products SET current_price = base_price, updated_at = NOW() WHERE id = $1`,
        [product.id]
      );

      await salesRepo.createPriceHistory({
        productId:     product.id,
        productName:   product.name,
        oldPrice:      parseFloat(product.current_price),
        newPrice:      parseFloat(product.base_price),
        changePercent: 0,
        changeReason:  'manual_reset'
      }, client);

      resetted.push({ ...product, current_price: product.base_price });
    }

    await client.query('COMMIT');

    if (resetted.length > 0) {
      // Recargar productos actualizados
      const fresh = await db.query(`SELECT * FROM products WHERE active = true`);
      wsService.broadcast('price_update', { products: fresh.rows, reason: 'daily_reset' });
      console.log(`[PriceEngine] Daily reset: ${resetted.length} products reset to base price`);
    }

    return resetted;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[PriceEngine] Reset error:', err.message);
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Programa el reset automático a medianoche.
 */
const scheduleMidnightReset = () => {
  const scheduleNext = () => {
    const now  = new Date();
    const next = new Date();
    next.setHours(24, 0, 0, 0); // próxima medianoche
    const msUntilMidnight = next - now;

    setTimeout(async () => {
      try {
        console.log('[PriceEngine] Midnight reset triggered');
        await resetAllPricesToBase();
      } catch (err) {
        console.error('[PriceEngine] Midnight reset failed:', err.message);
      }
      scheduleNext(); // reprogramar para la siguiente noche
    }, msUntilMidnight);

    console.log(`[PriceEngine] Midnight reset scheduled in ${Math.round(msUntilMidnight / 60000)} min`);
  };

  scheduleNext();
};

const startPriceDecreaseScheduler = () => {
  alertService.initFCM();
  const intervalMs = constants.PRICE_DECREASE_INTERVAL_MS;
  console.log(`[PriceEngine] Decrease scheduler started — interval: ${intervalMs / 1000}s`);

  setInterval(async () => {
    try {
      await decreasePricesAutomatically();
    } catch (err) {
      console.error('[PriceEngine] Scheduler error:', err.message);
    }
  }, intervalMs);
};

module.exports = {
  increasePrice,
  decreasePricesAutomatically,
  resetAllPricesToBase,
  startPriceDecreaseScheduler,
  scheduleMidnightReset,
  isPaused,
  setPaused
};
