import { userGetsAllFoods,userGetsAllFoodByAVendor,
userGetFoodByMostPopularVendors} from '../controllers/userControllers'
import { registerUser, LogIn, verifyOtp, reSendOtp} from '../controllers/userControllers';
import {Router} from 'express';
import {auth} from '../middleware/authorizations'

const router = Router();

router.post('/register', registerUser);
router.post('/login', LogIn);
router.post('/verify', auth, verifyOtp);
router.get('/resend', auth, reSendOtp);
router.get("/allfoods", userGetsAllFoods)
router.get("/allvendorfoods",userGetsAllFoodByAVendor)
router.get("/popularvendors", userGetFoodByMostPopularVendors)

export default router;