import express from "express"
const router = express.Router();

// import { Router } from "express";
import { userGetsAllFoods,userGetsAllFoodByAVendor,userGetFoodByMostPopularVendors,getMostPopularFoodsByOrders} from '../controllers/userControllers'

import {auth} from '../middleware/authorizations'




router.get("/allfoods", userGetsAllFoods)
router.get("/allvendorfoods",userGetsAllFoodByAVendor)
router.get("/popularvendors", userGetFoodByMostPopularVendors)

export default router