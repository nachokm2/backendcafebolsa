const productRepo = require('../repositories/productRepository');
const salesRepo   = require('../repositories/salesRepository');

const getAllProducts = async (req, res) => {
  try {
    const products = await productRepo.findAll();
    res.json({ success: true, data: products });
  } catch (err) {
    console.error('[ProductCtrl] getAllProducts:', err.message);
    res.status(500).json({ success: false, error: 'Error al obtener productos' });
  }
};

const getPriceHistory = async (req, res) => {
  try {
    const productId = req.params.id ? parseInt(req.params.id, 10) : null;
    const limit     = Math.min(parseInt(req.query.limit, 10) || 50, 200);

    if (req.params.id && isNaN(productId)) {
      return res.status(400).json({ success: false, error: 'ID de producto inválido' });
    }

    const history = await salesRepo.getPriceHistory(productId, limit);
    res.json({ success: true, data: history });
  } catch (err) {
    console.error('[ProductCtrl] getPriceHistory:', err.message);
    res.status(500).json({ success: false, error: 'Error al obtener historial' });
  }
};

const getCategories = async (req, res) => {
  try {
    const products = await productRepo.findAll();
    const categories = [...new Set(products.map(p => p.category))].sort();
    res.json({ success: true, data: categories });
  } catch (err) {
    console.error('[ProductCtrl] getCategories:', err.message);
    res.status(500).json({ success: false, error: 'Error al obtener categorías' });
  }
};

module.exports = { getAllProducts, getPriceHistory, getCategories };
