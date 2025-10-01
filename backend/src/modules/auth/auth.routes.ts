import { Router } from 'express';
import { register, login, logout, me, refreshToken, logoutAll } from './auth.controller';
import { validateBody } from '../../validation/middleware';
import { RefreshTokenSchema, LogoutAllSchema } from './user.schema';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken); // No validation needed - uses cookies
router.post('/logout', logout);
router.post('/logout-all', logoutAll); // No validation needed - uses access token
router.get('/me', me);

export default router;
