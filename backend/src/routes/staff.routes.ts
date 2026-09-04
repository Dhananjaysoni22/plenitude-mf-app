import { Router } from 'express';
import { getStaff, createStaff, updateStaff, deleteStaff, resetPassword } from '../controllers/staff.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, getStaff);
router.post('/', authenticate, createStaff);
router.put('/:id', authenticate, updateStaff);
router.delete('/:id', authenticate, deleteStaff);

export default router;

router.post('/:id/reset-password', authenticate, resetPassword);
