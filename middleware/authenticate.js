const jwt = require('jsonwebtoken');

/**
 * Verifica el JWT del header Authorization: Bearer <token>
 * Roles permitidos se pasan como array opcional:  authenticate(['admin'])
 */
const authenticate = (roles = []) => (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Token requerido' });
  }

  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Token expirado' : 'Token inválido';
    return res.status(401).json({ success: false, error: msg });
  }

  if (roles.length && !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, error: 'Sin permiso suficiente' });
  }

  next();
};

module.exports = authenticate;
