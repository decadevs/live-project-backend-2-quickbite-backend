import express from "express";
import { verifyVendor, registerVendor } from "../controllers/vendorControllers";
import { authForVerifiedVendor, auth } from "../middleware/authorizations";
import { upload } from "../middleware/upload";
import {vendorcreatesFood, vendorgetsAllFood, vendorGetsSingleFood, } from "../controllers/vendorControllers";

const router = express.Router();

router.post("/verifyvendor", verifyVendor);
router.post("/registervendor", authForVerifiedVendor, upload.single("cover_image"), registerVendor);
router.post("/createfood", auth, upload.single("food_image"), vendorcreatesFood);
router.get("/getallfood", auth, vendorgetsAllFood);
router.get("/getsinglefood", auth, vendorGetsSingleFood);

export default router;
