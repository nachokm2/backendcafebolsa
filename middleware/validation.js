const { body, param } = require('express-validator');

const validateSale = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Se requiere al menos un producto en la venta'),
  body('items.*.productId')
    .isInt({ min: 1 })
    .withMessage('productId debe ser un entero positivo'),
  body('items.*.quantity')
    .isInt({ min: 1, max: 99 })
    .withMessage('quantity debe estar entre 1 y 99')
];

const validateProductId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID debe ser un entero positivo')
];

module.exports = { validateSale, validateProductId };
