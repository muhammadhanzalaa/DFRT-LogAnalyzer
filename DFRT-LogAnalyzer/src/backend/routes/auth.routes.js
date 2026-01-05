/**
 * Authentication Routes
 * @file auth.routes.js
 * Public routes for authentication
 */

const express = require('express');
const router = express.Router();
const UserService = require('../services/user.service');
const validationMiddleware = require('../middleware/validation.middleware');
const rateLimiter = require('../middleware/rate-limiter.middleware');
const { ApiResponse, ValidationError } = require('../utils/response.handler');

/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/register',
    rateLimiter.global,
    validationMiddleware.field({
        username: ['required', 'username'],
        email: ['required', 'email'],
        password: ['required', 'password'],
        fullName: ['required']
    }),
    async (req, res, next) => {
        try {
            const user = await UserService.register(req.body);
            res.status(201).json(new ApiResponse(true, user, 'User registered successfully', 'CREATED'));
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login',
    rateLimiter.auth,
    validationMiddleware.field({
        email: ['required', 'email'],
        password: ['required']
    }),
    async (req, res, next) => {
        try {
            const { email, password } = req.body;
            const result = await UserService.login(email, password);
            res.json(new ApiResponse(true, result, 'Login successful', 'OK'));
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            throw new ValidationError('Token required');
        }
        const result = await UserService.logout(token);
        res.json(new ApiResponse(true, result, 'Logged out successfully', 'OK'));
    } catch (error) {
        next(error);
    }
});

module.exports = router;
