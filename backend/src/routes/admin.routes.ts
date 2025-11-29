import { Router } from 'express';
import { listAdminsHandler, createAdminHandler, deleteAdminHandler } from '../controllers/admin.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', listAdminsHandler);
router.post('/', createAdminHandler);
router.delete('/:id', deleteAdminHandler);

export default router;
