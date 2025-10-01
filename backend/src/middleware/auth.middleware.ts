import { Request, Response, NextFunction } from 'express';
import { User, UserRole } from '../modules/auth/User';
import { verifyAccessToken } from '../modules/auth/token.utils';

export interface AuthRequest extends Request {
  user?: User;
  file?: any; // For multer file uploads
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const accessToken = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];

    if (!accessToken) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = verifyAccessToken(accessToken);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired access token' });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};
