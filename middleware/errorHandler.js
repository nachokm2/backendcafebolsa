const errorHandler = (err, req, res, next) => {
  console.error('[ErrorHandler]', err.stack || err.message);

  const isProd = process.env.NODE_ENV === 'production';

  res.status(err.statusCode || 500).json({
    success: false,
    error: isProd ? 'Error interno del servidor' : (err.message || 'Unknown error')
  });
};

module.exports = errorHandler;
