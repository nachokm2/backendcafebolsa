const express      = require('express');
const router       = express.Router();
const ctrl         = require('../controllers/alertController');
const authenticate = require('../middleware/authenticate');

// All alert routes require a valid customer (or cashier) JWT
router.use(authenticate());

router.get('/',               ctrl.getAlerts);
router.post('/',              ctrl.upsertAlert);
router.delete('/:productId',  ctrl.deleteAlert);

module.exports = router;
