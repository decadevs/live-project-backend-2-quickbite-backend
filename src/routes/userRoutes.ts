import { userGetsAllFoods,userGetsAllFoodByAVendor, userGetPopularFoods, getAllVendors,
registerUser, userLogIn, verifyOtp, userGetPopularVendors, reSendOtp} from '../controllers/userControllers'
import {Router} from 'express';
import {auth} from '../middleware/authorizations'

const router = Router();

router.post('/register', registerUser);
router.post('/login', userLogIn);
router.post('/verify', auth, verifyOtp);
router.get('/resend', auth, reSendOtp);
router.get("/allfoods", auth, userGetsAllFoods)
router.get('/allvendorfoods', auth, userGetsAllFoodByAVendor)
router.get('/popularfoods', auth, userGetPopularFoods)
router.get('/getVendors', auth, getAllVendors)
router.get('/getPopularVendors', auth, userGetPopularVendors)

export default router;