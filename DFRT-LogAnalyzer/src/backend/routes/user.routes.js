/**
 * User Routes
 * @file user.routes.js
 * Protected routes for user management
 */

const express = require('express');
const router = express.Router();
const UserService = require('../services/user.service');
const authMiddleware = require('../middleware/auth.middleware');
const validationMiddleware = require('../middleware/validation.middleware');
const { ApiResponse, NotFoundError } = require('../utils/response.handler');

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get('/me', authMiddleware, async (req, res, next) => {
    try {
        const user = await UserService.getUserById(req.user.id);
        res.json(new ApiResponse(true, user, 'User profile retrieved', 'OK'));
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/users/me
 * Update current user profile
 */
router.put('/me',
    authMiddleware,
    validationMiddleware.field({
        fullName: ['required'],
        email: ['email']
    }),
    async (req, res, next) => {
        try {
            const user = await UserService.updateProfile(req.user.id, req.body);
            res.json(new ApiResponse(true, user, 'Profile updated successfully', 'OK'));
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/users/change-password
 * Change password
 */
router.post('/change-password',
    authMiddleware,
    validationMiddleware.field({
        oldPassword: ['required'],
        newPassword: ['required', 'password']
    }),
    async (req, res, next) => {
        try {
            const { oldPassword, newPassword } = req.body;
            const result = await UserService.changePassword(req.user.id, oldPassword, newPassword);
            res.json(new ApiResponse(true, result, 'Password changed successfully', 'OK'));
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/users
 * List all users (admin only)
 */
router.get('/',
    authMiddleware,
    authMiddleware.requireRole('admin'),
    async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await UserService.listUsers(page, limit);
            res.json(new ApiResponse(true, result.data, 'Users retrieved', 'OK', result.pagination));
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/users/:id
 * Get user by ID (admin only)
 */
router.get('/:id',
    authMiddleware,
    authMiddleware.requireRole('admin'),
    async (req, res, next) => {
        try {
            const user = await UserService.getUserById(req.params.id);
            res.json(new ApiResponse(true, user, 'User retrieved', 'OK'));
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
