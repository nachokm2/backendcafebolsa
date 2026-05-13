const router       = require('express').Router();
const ctrl         = require('../controllers/adminController');
const authenticate = require('../middleware/authenticate');

// Todas las rutas admin requieren rol admin
router.use(authenticate(['admin']));

router.get('/status',                ctrl.getEngineStatus);
router.put('/engine/pause',          ctrl.togglePriceEngine);
router.post('/engine/reset',         ctrl.resetPrices);
router.post('/demo',                 ctrl.controlDemo);
router.put('/products/:id',          ctrl.updateProduct);
router.post('/products/:id/restock', ctrl.restockProduct);

module.exports = router;
