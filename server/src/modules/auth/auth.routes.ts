import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateSchema } from '../../shared/validate';
import { authenticateJWT } from '../../shared/authMiddleware';
import { RegisterSchema, LoginSchema, RefreshTokenSchema } from './auth.schema';

const router = Router();

router.post('/register', validateSchema(RegisterSchema), AuthController.register);
router.post('/login', validateSchema(LoginSchema), AuthController.login);
router.post('/refresh', validateSchema(RefreshTokenSchema), AuthController.refresh);
router.get('/me', authenticateJWT, AuthController.getMe);

export default router;
