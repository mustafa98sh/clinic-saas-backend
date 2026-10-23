import { Router } from 'express';
import { loginClinic } from '../controllers/auth.controller';

const router = Router();

// مسار تسجيل الدخول: POST /api/auth/login
router.post('/login', loginClinic);

export default router;