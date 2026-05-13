const router       = require('express').Router();
const ctrl         = require('../controllers/reportsController');
const authenticate = require('../middleware/authenticate');

// Reportes: solo admin y cashier
router.use(authenticate(['admin', 'cashier']));

router.get('/by-hour',         ctrl.getSalesByHour);
router.get('/top-products',    ctrl.getTopProducts);
router.get('/daily-revenue',   ctrl.getDailyRevenue);
router.get('/price-chart/:id', ctrl.getPriceChart);

module.exports = router;
