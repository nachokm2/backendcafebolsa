require('dotenv').config();

module.exports = {
  PRICE_INCREASE_MIN:         parseFloat(process.env.PRICE_INCREASE_MIN)         || 3,
  PRICE_INCREASE_MAX:         parseFloat(process.env.PRICE_INCREASE_MAX)         || 5,
  PRICE_DECREASE_MIN:         parseFloat(process.env.PRICE_DECREASE_MIN)         || 2,
  PRICE_DECREASE_MAX:         parseFloat(process.env.PRICE_DECREASE_MAX)         || 5,
  PRICE_DECREASE_INTERVAL_MS: parseInt(process.env.PRICE_DECREASE_INTERVAL_MS)   || 300000,
  NO_SALE_THRESHOLD_MS:       5 * 60 * 1000,   // 5 minutos sin ventas → baja el precio
  TAX_RATE:                   parseFloat(process.env.TAX_RATE)                   || 19
};
