const { validationResult } = require('express-validator');
const db          = require('../config/database');
const productRepo = require('../repositories/productRepository');
const salesRepo   = require('../repositories/salesRepository');
const priceEngine = require('../services/priceEngine');
const wsService   = require('../services/websocketService');
const constants   = require('../config/constants');

const createSale = async (req, res) => {
  // Validar input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { items } = req.body;
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Cargar todos los productos dentro de la transacción (precios actuales)
    const products = await Promise.all(
      items.map(({ productId }) => productRepo.findById(productId))
    );

    // Verificar que todos existen
    for (let i = 0; i < products.length; i++) {
      if (!products[i]) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: `Producto con ID ${items[i].productId} no encontrado`
        });
      }
    }

    // Verificar stock disponible
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const qty     = items[i].quantity;
      if (product.stock !== null && product.stock < qty) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Stock insuficiente para "${product.name}" (disponible: ${product.stock})`
        });
      }
    }

    // Calcular totales con precios actuales en BD (no los del cliente)
    let subtotal = 0;
    const saleItems = items.map(({ productId, quantity }, idx) => {
      const product     = products[idx];
      const unitPrice   = parseFloat(product.current_price);
      const itemSubtotal = unitPrice * quantity;
      subtotal += itemSubtotal;

      return {
        productId:   product.id,
        productName: product.name,
        quantity,
        unitPrice,
        subtotal:    itemSubtotal
      };
    });

    const taxAmount = subtotal * (constants.TAX_RATE / 100);
    const total     = subtotal + taxAmount;

    // Descontar stock
    await Promise.all(
      saleItems.map(item => client.query(
        `UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2`,
        [item.quantity, item.productId]
      ))
    );

    // Registrar venta con cajero, sesión y cliente móvil (opcional)
    const { userId, sessionId, cashierName, customerId } = req.body;
    const sale = await salesRepo.createSale(
      { subtotal, taxRate: constants.TAX_RATE, taxAmount, total, userId, sessionId, cashierName, customerId },
      client
    );

    await Promise.all(
      saleItems.map(item => salesRepo.createSaleDetail({ saleId: sale.id, ...item }, client))
    );

    // Registrar fecha de última venta para todos los productos comprados
    await Promise.all(
      items.map(({ productId }) => productRepo.updateLastSaleAt(productId, client))
    );

    // Subir precio tantas veces como unidades se compraron
    const updatedProducts = [];
    for (const { productId, quantity } of items) {
      let updated;
      for (let i = 0; i < quantity; i++) {
        updated = await priceEngine.increasePrice(productId, client);
      }
      updatedProducts.push(updated);
    }

    await client.query('COMMIT');

    // Award loyalty points: 1 pt per $1000 CLP total
    const earnedPoints = customerId ? Math.floor(total / 1000) : 0;
    if (customerId && earnedPoints > 0) {
      db.query(
        `UPDATE customers SET points = points + $1 WHERE id = $2`,
        [earnedPoints, customerId]
      ).catch(err => console.warn('[SalesCtrl] Points error:', err.message));
    }

    // Notificar en tiempo real a todos los clientes WebSocket
    wsService.broadcast('price_update', {
      products: updatedProducts,
      reason:   'purchase_increase',
      saleId:   sale.id
    });

    wsService.broadcast('new_sale', {
      saleId: sale.id,
      total:  sale.total
    });

    res.status(201).json({
      success: true,
      data: {
        sale,
        items:           saleItems,
        updatedProducts,
        earnedPoints,
      }
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[SalesCtrl] createSale:', err.message);
    res.status(500).json({ success: false, error: 'Error al procesar la venta' });
  } finally {
    client.release();
  }
};

const getRecentSales = async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit, 10)  || 20, 200);
    const page   = Math.max(parseInt(req.query.page,  10)  || 1,  1);
    const offset = (page - 1) * limit;
    const sales  = await salesRepo.getRecentSales(limit, offset);
    res.json({ success: true, data: sales, meta: { page, limit } });
  } catch (err) {
    console.error('[SalesCtrl] getRecentSales:', err.message);
    res.status(500).json({ success: false, error: 'Error al obtener ventas' });
  }
};

module.exports = { createSale, getRecentSales };
