import { registerUser, LogIn, verifyOtp, reSendOtp} from '../controllers/userControllers';
import {Router} from 'express';
import {auth} from '../middleware/authorizations'

const router = Router();

router.post('/register', registerUser);
router.post('/login', LogIn);
router.post('/verify', auth, verifyOtp);
router.get('/resend', auth, reSendOtp);



export default router;