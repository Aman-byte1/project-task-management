import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { RefreshToken } from './refreshToken.model';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JWTPayload {
  userId: number;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

// Generate a secure refresh token
export const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

// Generate access token (short-lived)
export const generateAccessToken = (userId: number): string => {
  const payload: JWTPayload = {
    userId,
    type: 'access'
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '15m', // 15 minutes
    issuer: 'task-management-app',
    audience: 'task-management-users'
  });
};

// Generate refresh token (long-lived)
export const generateRefreshTokenJWT = (userId: number): string => {
  const payload: JWTPayload = {
    userId,
    type: 'refresh'
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!, {
    expiresIn: '7d', // 7 days
    issuer: 'task-management-app',
    audience: 'task-management-users'
  });
};

// Generate both tokens
export const generateTokenPair = (userId: number): TokenPair => {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshTokenJWT(userId);

  // Calculate expiration time for access token
  const decoded = jwt.decode(accessToken) as jwt.JwtPayload;
  const expiresIn = decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 900; // 15 minutes default

  return {
    accessToken,
    refreshToken,
    expiresIn
  };
};

// Verify access token
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
      issuer: 'task-management-app',
      audience: 'task-management-users'
    }) as JWTPayload;

    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

// Verify refresh token
export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!, {
      issuer: 'task-management-app',
      audience: 'task-management-users'
    }) as JWTPayload;

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

// Store refresh token in database
export const storeRefreshToken = async (token: string, userId: number, expiresAt: Date): Promise<void> => {
  // First, revoke all existing refresh tokens for this user
  await RefreshToken.update(
    { isRevoked: true },
    { where: { userId, isRevoked: false } }
  );

  // Create new refresh token
  await RefreshToken.create({
    token,
    userId,
    expiresAt,
    isRevoked: false
  });
};

// Validate refresh token from database
export const validateRefreshTokenFromDB = async (token: string): Promise<{ valid: boolean; userId?: number }> => {
  try {
    const refreshToken = await RefreshToken.findOne({
      where: { token, isRevoked: false }
    });

    if (!refreshToken) {
      return { valid: false };
    }

    if (refreshToken.isExpired()) {
      // Mark as revoked if expired
      await refreshToken.update({ isRevoked: true });
      return { valid: false };
    }

    return { valid: true, userId: refreshToken.userId };
  } catch (error) {
    return { valid: false };
  }
};

// Revoke refresh token
export const revokeRefreshToken = async (token: string): Promise<boolean> => {
  try {
    const [affectedRows] = await RefreshToken.update(
      { isRevoked: true },
      { where: { token, isRevoked: false } }
    );
    return affectedRows > 0;
  } catch (error) {
    return false;
  }
};

// Revoke all refresh tokens for a user
export const revokeAllUserRefreshTokens = async (userId: number): Promise<void> => {
  await RefreshToken.update(
    { isRevoked: true },
    { where: { userId, isRevoked: false } }
  );
};

// Clean up expired tokens (should be run periodically)
export const cleanupExpiredTokens = async (): Promise<number> => {
  const [affectedRows] = await RefreshToken.update(
    { isRevoked: true },
    {
      where: {
        isRevoked: false,
        expiresAt: { [require('sequelize').Op.lt]: new Date() }
      }
    }
  );
  return affectedRows;
};
