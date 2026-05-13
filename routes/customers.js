const router       = require('express').Router();
const ctrl         = require('../controllers/customerController');
const authenticate = require('../middleware/authenticate');
const rateLimit    = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiados intentos. Intenta en 10 minutos.' }
});

router.post('/register',        loginLimiter, ctrl.register);
router.post('/login',           loginLimiter, ctrl.login);
router.get('/leaderboard',                    ctrl.getLeaderboard); // public — no auth
router.get('/me/profile',       authenticate(), ctrl.getProfile);
router.get('/:id/orders',       authenticate(), ctrl.getOrders);

module.exports = router;
