import { Router } from 'express';
import { loginHandler, resetPasswordHandler, signupHandler, changePasswordHandler, logoutHandler, refreshHandler, meHandler, updateProfileHandler } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', loginHandler);
router.post('/signup', signupHandler);
router.post('/reset-password', resetPasswordHandler);
router.post('/change-password', requireAuth, changePasswordHandler);
router.get('/me', requireAuth, meHandler);
router.put('/me', requireAuth, updateProfileHandler);
router.post('/refresh', refreshHandler);
router.post('/logout', logoutHandler);

export default router;
