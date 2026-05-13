const router       = require('express').Router();
const ctrl         = require('../controllers/cashSessionController');
const authenticate = require('../middleware/authenticate');

// Sesiones de caja: solo cashiers y admins
router.use(authenticate(['admin', 'cashier']));

router.post('/',           ctrl.openSession);
router.put('/:id/close',   ctrl.closeSession);
router.get('/:id/summary', ctrl.getSessionSummary);

module.exports = router;
