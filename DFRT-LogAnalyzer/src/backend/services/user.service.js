/**
 * User Service - Business Logic
 * @file user.service.js
 * Handles user operations and authentication
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { DatabaseError, ValidationError, NotFoundError, ConflictError } = require('../utils/response.handler');

class UserService {
    static database = null;

    static setDatabase(db) {
        this.database = db;
    }

    /**
     * Register new user
     */
    static async register(userData) {
        const { username, email, password, fullName } = userData;

        if (!username || !email || !password) {
            throw new ValidationError('Username, email, and password are required');
        }

        try {
            // Check if user already exists
            const existing = await this.database.get(
                'SELECT id FROM users WHERE email = ? OR username = ?',
                [email, username]
            );

            if (existing) {
                throw new ConflictError('User with this email or username already exists');
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // Create user
            const userId = uuidv4();
            await this.database.run(
                `INSERT INTO users (id, username, email, passwordHash, fullName, role)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [userId, username, email, passwordHash, fullName || username, 'user']
            );

            return { id: userId, username, email, fullName };
        } catch (error) {
            if (error.constructor.name === 'ConflictError') throw error;
            throw new DatabaseError('Failed to register user', error);
        }
    }

    /**
     * Login user
     */
    static async login(email, password) {
        if (!email || !password) {
            throw new ValidationError('Email and password are required');
        }

        try {
            const user = await this.database.get(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );

            if (!user) {
                throw new NotFoundError('User');
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
            if (!isPasswordValid) {
                throw new ValidationError('Invalid password');
            }

            // Check if user is active
            if (!user.isActive) {
                throw new ValidationError('User account is inactive');
            }

            // Generate JWT token
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            // Update last login
            await this.database.run(
                'UPDATE users SET lastLogin = ? WHERE id = ?',
                [new Date().toISOString(), user.id]
            );

            // Create session
            const sessionId = uuidv4();
            await this.database.run(
                `INSERT INTO sessions (id, userId, token, expiresAt)
                 VALUES (?, ?, ?, ?)`,
                [sessionId, user.id, token, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()]
            );

            return {
                user: { id: user.id, username: user.username, email: user.email, role: user.role },
                token
            };
        } catch (error) {
            if (error.constructor.name === 'ValidationError') throw error;
            throw new DatabaseError('Login failed', error);
        }
    }

    /**
     * Get user by ID
     */
    static async getUserById(userId) {
        try {
            const user = await this.database.get(
                'SELECT id, username, email, fullName, role, isActive, lastLogin, createdAt FROM users WHERE id = ?',
                [userId]
            );

            if (!user) {
                throw new NotFoundError('User');
            }

            return user;
        } catch (error) {
            throw new DatabaseError('Failed to get user', error);
        }
    }

    /**
     * Update user profile
     */
    static async updateProfile(userId, updates) {
        try {
            const { fullName, email } = updates;

            // Check if email already exists
            if (email) {
                const existing = await this.database.get(
                    'SELECT id FROM users WHERE email = ? AND id != ?',
                    [email, userId]
                );
                if (existing) {
                    throw new ConflictError('Email already in use');
                }
            }

            const fields = [];
            const values = [];

            if (fullName) {
                fields.push('fullName = ?');
                values.push(fullName);
            }

            if (email) {
                fields.push('email = ?');
                values.push(email);
            }

            fields.push('updatedAt = ?');
            values.push(new Date().toISOString());
            values.push(userId);

            await this.database.run(
                `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
                values
            );

            return this.getUserById(userId);
        } catch (error) {
            throw new DatabaseError('Failed to update profile', error);
        }
    }

    /**
     * Change password
     */
    static async changePassword(userId, oldPassword, newPassword) {
        try {
            const user = await this.database.get(
                'SELECT passwordHash FROM users WHERE id = ?',
                [userId]
            );

            if (!user) {
                throw new NotFoundError('User');
            }

            // Verify old password
            const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
            if (!isValid) {
                throw new ValidationError('Current password is incorrect');
            }

            // Hash new password
            const newHash = await bcrypt.hash(newPassword, 10);

            // Update password
            await this.database.run(
                'UPDATE users SET passwordHash = ? WHERE id = ?',
                [newHash, userId]
            );

            return { message: 'Password changed successfully' };
        } catch (error) {
            throw new DatabaseError('Failed to change password', error);
        }
    }

    /**
     * Logout user
     */
    static async logout(token) {
        try {
            await this.database.run(
                'UPDATE sessions SET isActive = 0 WHERE token = ?',
                [token]
            );
            return { message: 'Logged out successfully' };
        } catch (error) {
            throw new DatabaseError('Logout failed', error);
        }
    }

    /**
     * List all users (admin only)
     */
    static async listUsers(page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            const rows = await this.database.all(
                `SELECT id, username, email, fullName, role, isActive, createdAt 
                 FROM users ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
                [limit, offset]
            );

            const countResult = await this.database.get('SELECT COUNT(*) as total FROM users');

            return {
                data: rows,
                pagination: {
                    total: countResult.total,
                    page,
                    limit,
                    pages: Math.ceil(countResult.total / limit)
                }
            };
        } catch (error) {
            throw new DatabaseError('Failed to list users', error);
        }
    }
}

module.exports = UserService;
