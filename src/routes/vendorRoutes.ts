import express from "express";
import { authForVerifiedVendor, auth, vendorauth } from "../middleware/authorizations";
import { upload } from "../middleware/upload";
import {vendorcreatesFood,vendorLogin, vendorGetsProfile,
    vendorChangePassword, vendorEditProfile,
    vendorgetsAllHisFood, vendorGetsSingleFood,
    verifyVendor, registerVendor, DeleteSingleFood, DeleteAllFood, updateFood   } from "../controllers/vendorControllers";

const router = express.Router();

router.post("/verifyvendor", verifyVendor);
router.post("/registervendor", authForVerifiedVendor, upload.single("cover_image"), registerVendor);
router.post("/createfood", upload.single("food_image"), vendorcreatesFood);
router.get("/getallfood",vendorauth, vendorgetsAllHisFood);
router.get("/getsinglefood", vendorGetsSingleFood);
router.post('/login', vendorLogin)
router.post('/loginpasswordchange', vendorauth, vendorChangePassword)
router.patch('/editprofile', vendorauth, upload.single("cover_image"), vendorEditProfile)
router.get('/getsingleprofile', vendorauth, vendorGetsProfile)
router.delete('/deletefood', DeleteSingleFood)


export default router;
