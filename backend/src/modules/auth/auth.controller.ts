import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from './User';
import { Notification } from './Notification';
import { validateBody } from '../../validation/middleware';
import { CreateUserSchema, LoginUserSchema, RefreshTokenSchema, LogoutAllSchema } from './user.schema';
import {
  generateTokenPair,
  storeRefreshToken,
  validateRefreshTokenFromDB,
  verifyRefreshToken,
  verifyAccessToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens
} from './token.utils';

export const register = [
  validateBody(CreateUserSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, password, name, role } = req.body;

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const user = await User.create({
        email,
        password,
        name,
        role: role || UserRole.EMPLOYEE
      });

      // Generate token pair
      const tokenPair = generateTokenPair(user.id);

      // Store refresh token in database
      const refreshTokenExpiry = new Date();
      refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days
      await storeRefreshToken(tokenPair.refreshToken, user.id, refreshTokenExpiry);

      // Set cookies
      res.cookie('accessToken', tokenPair.accessToken, {
        httpOnly: true,
        maxAge: tokenPair.expiresIn * 1000,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.cookie('refreshToken', tokenPair.refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  }
];

export const login = [
  validateBody(LoginUserSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValid = await user.validatePassword(password);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate token pair
      const tokenPair = generateTokenPair(user.id);

      // Store refresh token in database
      const refreshTokenExpiry = new Date();
      refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days
      await storeRefreshToken(tokenPair.refreshToken, user.id, refreshTokenExpiry);

      // Set cookies
      res.cookie('accessToken', tokenPair.accessToken, {
        httpOnly: true,
        maxAge: tokenPair.expiresIn * 1000,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.cookie('refreshToken', tokenPair.refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  }
];

// Refresh access token using refresh token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const refreshTokenFromCookie = req.cookies.refreshToken;

    if (!refreshTokenFromCookie) {
      return res.status(401).json({ message: 'Refresh token not provided' });
    }

    // Verify refresh token from JWT
    const decoded = verifyRefreshToken(refreshTokenFromCookie);

    // Validate refresh token in database
    const tokenValidation = await validateRefreshTokenFromDB(refreshTokenFromCookie);

    if (!tokenValidation.valid || !tokenValidation.userId) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    // Generate new token pair
    const newTokenPair = generateTokenPair(tokenValidation.userId);

    // Store new refresh token in database
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days
    await storeRefreshToken(newTokenPair.refreshToken, tokenValidation.userId, refreshTokenExpiry);

    // Set new cookies
    res.cookie('accessToken', newTokenPair.accessToken, {
      httpOnly: true,
      maxAge: newTokenPair.expiresIn * 1000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.cookie('refreshToken', newTokenPair.refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({
      accessToken: newTokenPair.accessToken,
      refreshToken: newTokenPair.refreshToken,
      expiresIn: newTokenPair.expiresIn
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// Logout - revoke refresh token
export const logout = async (req: Request, res: Response) => {
  try {
    const refreshTokenFromCookie = req.cookies.refreshToken;

    if (refreshTokenFromCookie) {
      // Revoke the refresh token in database
      await revokeRefreshToken(refreshTokenFromCookie);
    }

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current user info
export const me = async (req: Request, res: Response) => {
  try {
    const accessToken = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];

    if (!accessToken) {
      return res.status(401).json({ message: 'Access token not provided' });
    }

    const decoded = verifyAccessToken(accessToken);
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired access token' });
  }
};

// Logout from all devices - revoke all refresh tokens for user
export const logoutAll = async (req: Request, res: Response) => {
  try {
    const accessToken = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];

    if (!accessToken) {
      return res.status(401).json({ message: 'Access token not provided' });
    }

    const decoded = verifyAccessToken(accessToken);

    // Revoke all refresh tokens for this user
    await revokeAllUserRefreshTokens(decoded.userId);

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(401).json({ message: 'Invalid access token' });
  }
};
