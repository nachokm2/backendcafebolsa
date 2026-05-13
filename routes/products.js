const router = require('express').Router();
const ctrl   = require('../controllers/productController');

router.get('/',              ctrl.getAllProducts);
router.get('/categories',    ctrl.getCategories);            // lista de categorías únicas
router.get('/history',       ctrl.getPriceHistory);          // historial global
router.get('/:id/history',   ctrl.getPriceHistory);          // historial por producto

module.exports = router;
