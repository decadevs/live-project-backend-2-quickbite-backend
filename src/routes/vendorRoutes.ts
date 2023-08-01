import express from "express";
import { authForVerifiedVendor, auth, vendorauth } from "../middleware/authorizations";
import { upload } from "../middleware/upload";
import {vendorcreatesFood,vendorLogin, getSingleVendor,
    vendorChangeLoginPassword, vendorEditProfile,
    vendorgetsAllHisFood, vendorGetsSingleFood,
    verifyVendor, registerVendor } from "../controllers/vendorControllers";

const router = express.Router();

router.post("/verifyvendor", verifyVendor);
router.post("/registervendor", authForVerifiedVendor, upload.single("cover_image"), registerVendor);
router.post("/createfood", vendorauth, upload.single("food_image"), vendorcreatesFood);
router.get("/getallfood", vendorauth, vendorgetsAllHisFood);
router.get("/getsinglefood", vendorauth, vendorGetsSingleFood);
router.post('/login', vendorLogin)
router.post('/loginpasswordchange', vendorauth, vendorChangeLoginPassword)
router.patch('/editprofile', vendorauth, vendorEditProfile)
router.get('/getsingleprofile', vendorauth, getSingleVendor)


export default router;
