import { Router } from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser } from '../modules/auth/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../modules/auth/User';

const router = Router();

router.get('/', authenticate, getAllUsers);
router.get('/:id', authenticate, getUserById);
router.put('/:id', authenticate, updateUser);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), deleteUser);

export default router;
