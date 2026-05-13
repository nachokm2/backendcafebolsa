const router       = require('express').Router();
const ctrl         = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');

router.post('/login',         ctrl.login);
router.post('/refresh-token', authenticate(), ctrl.refreshToken);
router.get('/users',          authenticate(['admin']), ctrl.getUsers);

module.exports = router;
