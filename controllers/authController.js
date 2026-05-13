const jwt = require('jsonwebtoken');
const db  = require('../config/database');

const signToken = (user) => jwt.sign(
  { id: user.id, name: user.name, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
);

const login = async (req, res) => {
  const { pin } = req.body;

  if (!pin || !/^\d{4}$/.test(String(pin))) {
    return res.status(400).json({ success: false, error: 'PIN debe ser 4 dígitos' });
  }

  try {
    const result = await db.query(
      `SELECT id, name, role FROM users WHERE pin = $1 AND active = true`,
      [String(pin)]
    );

    if (!result.rows[0]) {
      return res.status(401).json({ success: false, error: 'PIN incorrecto' });
    }

    const user  = result.rows[0];
    const token = signToken(user);

    res.json({ success: true, data: { user, token } });
  } catch (err) {
    console.error('[AuthCtrl] login:', err.message);
    res.status(500).json({ success: false, error: 'Error al autenticar' });
  }
};

const refreshToken = (req, res) => {
  // req.user ya está validado por el middleware authenticate
  const { id, name, role } = req.user;
  const token = signToken({ id, name, role });
  res.json({ success: true, data: { token } });
};

const getUsers = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, role, active, created_at FROM users ORDER BY role DESC, name`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[AuthCtrl] getUsers:', err.message);
    res.status(500).json({ success: false, error: 'Error al obtener usuarios' });
  }
};

module.exports = { login, refreshToken, getUsers };
