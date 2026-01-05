/**
 * Configuration Routes
 * Manages application settings and configurations
 */

const express = require('express');
const router = express.Router();
const { asyncHandler, AppError } = require('../middleware/error.middleware');
const dbService = require('../services/database.service');
const { validators } = require('../utils/validation');

/**
 * GET /api/config
 * Get all settings
 */
router.get('/', asyncHandler(async (req, res) => {
  const settings = await dbService.query(
    `SELECT * FROM settings ORDER BY key`
  );

  const configObj = {};
  settings.forEach(setting => {
    configObj[setting.key] = setting.value;
  });

  res.json({
    success: true,
    data: configObj
  });
}));

/**
 * GET /api/config/:key
 * Get specific setting
 */
router.get('/:key', asyncHandler(async (req, res) => {
  const { key } = req.params;

  const setting = await dbService.queryOne(
    `SELECT * FROM settings WHERE key = ?`,
    [key]
  );

  if (!setting) {
    throw new AppError('Setting not found', 404);
  }

  res.json({
    success: true,
    data: {
      [setting.key]: setting.value
    }
  });
}));

/**
 * PUT /api/config/:key
 * Update or create setting
 */
router.put('/:key', asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { value, type = 'string' } = req.body;

  // Validate input
  const validator = validators.validateConfigUpdate({ key, value });
  validator.throwIfInvalid();

  // Check if setting exists
  const existing = await dbService.queryOne(
    `SELECT * FROM settings WHERE key = ?`,
    [key]
  );

  let result;
  if (existing) {
    // Update
    await dbService.update(
      `UPDATE settings SET value = ?, type = ?, updatedAt = CURRENT_TIMESTAMP WHERE key = ?`,
      [value, type, key]
    );
    result = await dbService.queryOne(
      `SELECT * FROM settings WHERE key = ?`,
      [key]
    );
  } else {
    // Insert
    const id = await dbService.insert(
      `INSERT INTO settings (key, value, type) VALUES (?, ?, ?)`,
      [key, value, type]
    );
    result = { id, key, value, type };
  }

  res.json({
    success: true,
    message: 'Setting updated',
    data: result
  });
}));

/**
 * DELETE /api/config/:key
 * Delete setting
 */
router.delete('/:key', asyncHandler(async (req, res) => {
  const { key } = req.params;

  const setting = await dbService.queryOne(
    `SELECT * FROM settings WHERE key = ?`,
    [key]
  );

  if (!setting) {
    throw new AppError('Setting not found', 404);
  }

  await dbService.delete(
    `DELETE FROM settings WHERE key = ?`,
    [key]
  );

  res.json({
    success: true,
    message: 'Setting deleted'
  });
}));

module.exports = router;
