import express from "express";
import {verifyVendor, registerVendor, getPopularVendors, getAllVendors} from "../controllers/vendorControllers"
import { authForVerifiedVendor, auth } from "../middleware/authorizations";
import { upload } from "../middleware/upload";
import {vendorcreatesFood,vendorLogin, getSingleVendor,
    vendorChangeLoginPassword, vendorEditProfile,
    vendorgetsAllFood, vendorGetsSingleFood, } from "../controllers/vendorControllers";

const router = express.Router();

router.post("/verifyvendor", verifyVendor);
router.post("/registervendor", authForVerifiedVendor, upload.single("cover_image"), registerVendor);
router.post("/createfood", auth, upload.single("food_image"), vendorcreatesFood);
router.get("/getallfood", auth, vendorgetsAllFood);
router.get("/getsinglefood", auth, vendorGetsSingleFood);
router.get('/getPopularVendors', getPopularVendors)
router.get('/getVendors', getAllVendors)
router.post('/login', vendorLogin)
router.post('/loginpasswordchange', auth, vendorChangeLoginPassword)
router.patch('/editprofile', auth, vendorEditProfile)
router.get('/getsingleprofile', auth, getSingleVendor)


export default router;
