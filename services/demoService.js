const productRepo = require('../repositories/productRepository');
const salesRepo   = require('../repositories/salesRepository');
const priceEngine = require('./priceEngine');
const wsService   = require('./websocketService');
const constants   = require('../config/constants');
const db          = require('../config/database');

let demoInterval = null;
let isDemoRunning = false;

const isDemoActive = () => isDemoRunning;

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const runDemoSale = async () => {
  try {
    const products = await productRepo.findAll();
    if (products.length === 0) return;

    // Seleccionar 1–3 productos al azar
    const numProducts = randomInt(1, Math.min(3, products.length));
    const shuffled    = [...products].sort(() => Math.random() - 0.5);
    const selected    = shuffled.slice(0, numProducts);

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      let subtotal = 0;
      const items = selected.map(p => {
        const qty      = randomInt(1, 3);
        const itemSub  = parseFloat(p.current_price) * qty;
        subtotal += itemSub;
        return { productId: p.id, productName: p.name, quantity: qty, unitPrice: parseFloat(p.current_price), subtotal: itemSub };
      });

      const taxAmount = subtotal * (constants.TAX_RATE / 100);
      const total     = subtotal + taxAmount;

      const sale = await salesRepo.createSale(
        { subtotal, taxRate: constants.TAX_RATE, taxAmount, total },
        client
      );

      await Promise.all(items.map(item =>
        salesRepo.createSaleDetail({ saleId: sale.id, ...item }, client)
      ));

      await Promise.all(selected.map(p => productRepo.updateLastSaleAt(p.id, client)));

      const updatedProducts = [];
      for (const item of items) {
        for (let i = 0; i < item.quantity; i++) {
          const updated = await priceEngine.increasePrice(item.productId, client);
          if (i === item.quantity - 1) updatedProducts.push(updated);
        }
      }

      await client.query('COMMIT');

      wsService.broadcast('price_update', {
        products: updatedProducts,
        reason:   'purchase_increase',
        saleId:   sale.id,
        isDemo:   true
      });

      wsService.broadcast('new_sale', { saleId: sale.id, total: sale.total, isDemo: true });

      console.log(`[Demo] Venta simulada #${sale.id} — Total: $${Math.round(total).toLocaleString('es-CL')}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[Demo] Error en venta simulada:', err.message);
  }
};

const startDemo = (intervalMs = 3000) => {
  if (isDemoRunning) return { success: false, message: 'Demo ya en ejecución' };
  isDemoRunning = true;
  demoInterval  = setInterval(runDemoSale, intervalMs);
  console.log(`[Demo] Iniciado — intervalo: ${intervalMs}ms`);
  wsService.broadcast('demo_status', { active: true });
  return { success: true, message: 'Demo iniciado' };
};

const stopDemo = () => {
  if (!isDemoRunning) return { success: false, message: 'Demo no está activo' };
  clearInterval(demoInterval);
  demoInterval  = null;
  isDemoRunning = false;
  console.log('[Demo] Detenido');
  wsService.broadcast('demo_status', { active: false });
  return { success: true, message: 'Demo detenido' };
};

module.exports = { startDemo, stopDemo, isDemoActive };
