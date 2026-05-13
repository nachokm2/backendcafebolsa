const router = require('express').Router();
const ctrl   = require('../controllers/salesController');
const { validateSale } = require('../middleware/validation');

router.post('/', validateSale, ctrl.createSale);
router.get('/',               ctrl.getRecentSales);

module.exports = router;
